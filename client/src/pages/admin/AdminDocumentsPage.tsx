import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import {
  ConfirmDialog,
  DataTable,
  EmptyState,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  type DataTableColumn,
} from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  deleteDocument,
  documentTypes,
  documentUploadFormSchema,
  downloadDocument,
  getDocument,
  listDocumentCases,
  listDocumentCustomers,
  listDocuments,
  listDocumentUploaders,
  toDocumentUploadInput,
  uploadDocument,
  type CaseOption,
  type CustomerOption,
  type DocumentDetail,
  type DocumentRecord,
  type DocumentType,
  type DocumentUploadFormValues,
  type PaginationMeta,
  type UserOption,
} from '../../features/documents'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_UPLOAD_FORM: Omit<DocumentUploadFormValues, 'file'> = {
  customerId: '',
  caseProfileId: '',
  fileType: 'OTHER',
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

interface LookupState {
  customers: CustomerOption[]
  cases: CaseOption[]
  uploaders: UserOption[]
}

const EMPTY_LOOKUPS: LookupState = {
  customers: [],
  cases: [],
  uploaders: [],
}

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const formatDateTime = (value: string | undefined): string => {
  if (!value) {
    return 'None'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatFileSize = (size: number | null | undefined): string => {
  if (typeof size !== 'number') {
    return 'Unknown size'
  }

  if (size < 1024) {
    return `${size} B`
  }

  const units = ['KB', 'MB', 'GB'] as const
  let value = size / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  return message ? (
    <p className="field-error" id={id}>
      {message}
    </p>
  ) : null
}

function FormError({ message }: { message: string | null }) {
  return message ? (
    <div
      className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      role="alert"
    >
      {message}
    </div>
  ) : null
}

function FeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: Feedback
  onDismiss: () => void
}) {
  const isSuccess = feedback.type === 'success'

  return (
    <div
      className={cn(
        'mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm',
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-700',
      )}
      role="status"
    >
      <span className="flex items-start gap-2">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden="true" />
        )}
        {feedback.message}
      </span>
      <button
        className="shrink-0 text-xs font-bold uppercase tracking-wide"
        onClick={onDismiss}
        type="button"
      >
        Dismiss
      </button>
    </div>
  )
}

function ModalActions({
  isSubmitting,
  onCancel,
  submitLabel,
  submittingLabel = 'Saving...',
}: {
  isSubmitting: boolean
  onCancel: () => void
  submitLabel: string
  submittingLabel?: string
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
      <button
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </div>
  )
}

function DocumentTypeBadge({ fileType }: { fileType: DocumentType }) {
  const styles: Record<DocumentType, string> = {
    IDENTITY_DOCUMENT: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    REAL_ESTATE_DOCUMENT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    CONTRACT: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    LEGAL_DOCUMENT: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    CONSTRUCTION_DOCUMENT: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    OTHER: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[fileType],
      )}
    >
      {formatLabel(fileType)}
    </span>
  )
}

function UploadDocumentForm({
  error,
  isLoadingLookups,
  lookupError,
  lookups,
  onCancel,
  onSubmit,
}: {
  error: string | null
  isLoadingLookups: boolean
  lookupError: string | null
  lookups: LookupState
  onCancel: () => void
  onSubmit: (values: DocumentUploadFormValues) => Promise<void>
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<DocumentUploadFormValues>({
    resolver: zodResolver(documentUploadFormSchema),
    defaultValues: EMPTY_UPLOAD_FORM,
  })
  const selectedFiles = watch('file')
  const selectedFile = selectedFiles?.[0]

  useEffect(() => {
    reset(EMPTY_UPLOAD_FORM)
  }, [reset])

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto p-5 sm:p-6">
        <FormError message={error} />
        {lookupError ? (
          <div
            className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="alert"
          >
            {lookupError}
          </div>
        ) : null}
        {isLoadingLookups ? (
          <div className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Loading document options...
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="document-file">
              File <span aria-hidden="true">*</span>
            </label>
            <input
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              aria-describedby={
                errors.file ? 'document-file-error' : undefined
              }
              aria-invalid={Boolean(errors.file)}
              className="field-input"
              id="document-file"
              type="file"
              {...register('file')}
            />
            <FieldError
              id="document-file-error"
              message={errors.file?.message}
            />
            {selectedFile ? (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <p className="font-bold">{selectedFile.name}</p>
                <p className="mt-1 text-xs font-semibold">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="field-label" htmlFor="document-type">
              File type <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="document-type"
              {...register('fileType')}
            >
              {documentTypes.map((fileType) => (
                <option key={fileType} value={fileType}>
                  {formatLabel(fileType)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="document-customer">
              Customer
            </label>
            <select
              aria-describedby={
                errors.customerId ? 'document-customer-error' : undefined
              }
              aria-invalid={Boolean(errors.customerId)}
              className="field-input"
              disabled={isLoadingLookups}
              id="document-customer"
              {...register('customerId')}
            >
              <option value="">No direct customer</option>
              {lookups.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} - {customer.phone}
                </option>
              ))}
            </select>
            <FieldError
              id="document-customer-error"
              message={errors.customerId?.message}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="document-case">
              Case
            </label>
            <select
              className="field-input"
              disabled={isLoadingLookups}
              id="document-case"
              {...register('caseProfileId')}
            >
              <option value="">No linked case</option>
              {lookups.cases.map((caseProfile) => (
                <option key={caseProfile.id} value={caseProfile.id}>
                  {caseProfile.caseCode} - {caseProfile.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ModalActions
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitLabel="Upload document"
        submittingLabel="Uploading..."
      />
    </form>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function DocumentDetailView({
  document,
  isDownloading,
  onDownload,
}: {
  document: DocumentDetail
  isDownloading: boolean
  onDownload: (document: DocumentRecord) => void
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="truncate">{document.fileName}</span>
          </p>
          <div className="mt-3">
            <DocumentTypeBadge fileType={document.fileType} />
          </div>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDownloading}
          onClick={() => onDownload(document)}
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem label="MIME type" value={document.mimeType ?? 'Unknown'} />
        <DetailItem label="Size" value={formatFileSize(document.size)} />
        <DetailItem
          label="Customer"
          value={document.customer?.fullName ?? 'No customer'}
        />
        <DetailItem
          label="Case profile"
          value={
            document.caseProfile
              ? `${document.caseProfile.caseCode} - ${document.caseProfile.title}`
              : 'No case'
          }
        />
        <DetailItem
          label="Uploaded by"
          value={document.uploadedBy?.fullName ?? 'Unknown uploader'}
        />
        <DetailItem
          label="Uploaded date"
          value={formatDateTime(document.createdAt)}
        />
        {document.updatedAt ? (
          <DetailItem
            label="Updated date"
            value={formatDateTime(document.updatedAt)}
          />
        ) : null}
      </div>
    </div>
  )
}

export function AdminDocumentsPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [fileType, setFileType] = useState<DocumentType | ''>('')
  const [customerId, setCustomerId] = useState('')
  const [caseProfileId, setCaseProfileId] = useState('')
  const [uploadedById, setUploadedById] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [lookups, setLookups] = useState<LookupState>(EMPTY_LOOKUPS)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<DocumentRecord | null>(null)
  const [documentDetail, setDocumentDetail] =
    useState<DocumentDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const listSequence = useRef(0)
  const lookupSequence = useRef(0)
  const detailSequence = useRef(0)

  const loadDocuments = useCallback(async () => {
    const sequence = ++listSequence.current
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listDocuments({
        page,
        limit: PAGE_SIZE,
        search,
        fileType: fileType || undefined,
        customerId,
        caseProfileId,
        uploadedById,
      })

      if (sequence === listSequence.current) {
        setDocuments(result.items)
        setMeta(result.meta)
      }
    } catch (error) {
      if (sequence === listSequence.current) {
        setLoadError(
          getErrorMessage(error, 'Documents could not be loaded.'),
        )
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [caseProfileId, customerId, fileType, page, search, uploadedById])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const loadLookups = async () => {
    const sequence = ++lookupSequence.current
    setIsLoadingLookups(true)
    setLookupError(null)

    const [customersResult, casesResult, uploadersResult] =
      await Promise.allSettled([
        listDocumentCustomers(),
        listDocumentCases(),
        canManage
          ? listDocumentUploaders()
          : Promise.resolve({ users: [] as UserOption[] }),
      ])

    if (sequence !== lookupSequence.current) {
      return
    }

    setLookups({
      customers:
        customersResult.status === 'fulfilled'
          ? customersResult.value.items
          : [],
      cases: casesResult.status === 'fulfilled' ? casesResult.value.items : [],
      uploaders:
        uploadersResult.status === 'fulfilled'
          ? uploadersResult.value.users.filter((teamUser) => teamUser.isActive)
          : [],
    })

    const warnings = [
      customersResult.status === 'rejected'
        ? getErrorMessage(customersResult.reason, 'Customers could not load.')
        : '',
      casesResult.status === 'rejected'
        ? getErrorMessage(casesResult.reason, 'Cases could not load.')
        : '',
      uploadersResult.status === 'rejected'
        ? getErrorMessage(uploadersResult.reason, 'Uploaders could not load.')
        : '',
    ].filter(Boolean)

    setLookupError(warnings.length > 0 ? warnings.join(' ') : null)
    setIsLoadingLookups(false)
  }

  const refreshAfterMutation = async () => {
    await loadDocuments()
  }

  const openUpload = () => {
    setUploadError(null)
    setIsUploadOpen(true)
    void loadLookups()
  }

  const closeUpload = () => {
    lookupSequence.current += 1
    setIsUploadOpen(false)
    setUploadError(null)
    setIsLoadingLookups(false)
  }

  const loadDetail = async (target: DocumentRecord) => {
    const sequence = ++detailSequence.current
    setIsDetailLoading(true)
    setDetailError(null)
    setDocumentDetail(null)

    try {
      const result = await getDocument(target.id)

      if (sequence === detailSequence.current) {
        setDocumentDetail(result)
      }
    } catch (error) {
      if (sequence === detailSequence.current) {
        setDetailError(
          getErrorMessage(error, 'Document details could not be loaded.'),
        )
      }
    } finally {
      if (sequence === detailSequence.current) {
        setIsDetailLoading(false)
      }
    }
  }

  const openDetail = (target: DocumentRecord) => {
    setDetailTarget(target)
    void loadDetail(target)
  }

  const closeDetail = () => {
    detailSequence.current += 1
    setDetailTarget(null)
    setDocumentDetail(null)
    setDetailError(null)
    setIsDetailLoading(false)
  }

  const handleUpload = async (values: DocumentUploadFormValues) => {
    setUploadError(null)

    try {
      const uploaded = await uploadDocument(toDocumentUploadInput(values))
      closeUpload()
      setFeedback({
        type: 'success',
        message: `${uploaded.fileName} uploaded successfully.`,
      })
      await refreshAfterMutation()
    } catch (error) {
      setUploadError(
        getErrorMessage(error, 'The document could not be uploaded.'),
      )
    }
  }

  const handleDownload = async (document: DocumentRecord) => {
    setDownloadingId(document.id)
    setFeedback(null)

    try {
      await downloadDocument(document.id, document.fileName)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'The document could not be downloaded.',
        ),
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    setIsDeleting(true)
    setFeedback(null)

    try {
      const fileName = deleteTarget.fileName
      await deleteDocument(deleteTarget.id)
      setDeleteTarget(null)
      setFeedback({
        type: 'success',
        message: `${fileName} deleted successfully.`,
      })

      if (documents.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await refreshAfterMutation()
      }
    } catch (error) {
      setDeleteTarget(null)
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          'The document could not be deleted.',
        ),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setFileType('')
    setCustomerId('')
    setCaseProfileId('')
    setUploadedById('')
  }

  const submitSearch = () => {
    const nextSearch = searchInput.trim()

    if (page === 1 && search === nextSearch) {
      void loadDocuments()
      return
    }

    setPage(1)
    setSearch(nextSearch)
  }

  const canDelete = (document: DocumentRecord): boolean =>
    canManage || document.uploadedById === user?.id

  const hasFilters = Boolean(
    search || fileType || customerId || caseProfileId || uploadedById,
  )

  const columns: readonly DataTableColumn<DocumentRecord>[] = [
    {
      key: 'fileName',
      header: 'File name',
      className: 'max-w-72',
      render: (document) => (
        <div>
          <p className="truncate font-semibold text-slate-900">
            {document.fileName}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatFileSize(document.size)}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (document) => (
        <DocumentTypeBadge fileType={document.fileType} />
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (document) => document.customer?.fullName ?? 'No customer',
    },
    {
      key: 'case',
      header: 'Case',
      className: 'max-w-56',
      render: (document) =>
        document.caseProfile ? (
          <div>
            <p className="font-semibold text-slate-800">
              {document.caseProfile.caseCode}
            </p>
            <p className="truncate text-xs text-slate-400">
              {document.caseProfile.title}
            </p>
          </div>
        ) : (
          'No case'
        ),
    },
    {
      key: 'uploadedBy',
      header: 'Uploaded by',
      render: (document) => document.uploadedBy?.fullName ?? 'Unknown',
    },
    {
      key: 'createdAt',
      header: 'Uploaded date',
      render: (document) => formatDateTime(document.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (document) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={`View details for ${document.fileName}`}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(document)}
            title="View detail"
            type="button"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Download ${document.fileName}`}
            className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={downloadingId === document.id}
            onClick={() => void handleDownload(document)}
            title="Download"
            type="button"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          {canDelete(document) ? (
            <button
              aria-label={`Delete ${document.fileName}`}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(document)}
              title="Delete"
              type="button"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Document archive
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Documents
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Store and retrieve customer documents linked to CRM records.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openUpload}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Upload Document
        </button>
      </header>

      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(16rem,1fr)_14rem_14rem_14rem_14rem_auto]">
          <SearchInput
            isDisabled={isLoading}
            label="Search documents"
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder="Search file, customer or case..."
            value={searchInput}
          />
          <select
            aria-label="Filter by file type"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setFileType(event.target.value as DocumentType | '')
            }}
            value={fileType}
          >
            <option value="">All file types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by customer"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setCustomerId(event.target.value)
            }}
            onFocus={() => {
              if (lookups.customers.length === 0 && !isLoadingLookups) {
                void loadLookups()
              }
            }}
            value={customerId}
          >
            <option value="">All customers</option>
            {lookups.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by case"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setCaseProfileId(event.target.value)
            }}
            onFocus={() => {
              if (lookups.cases.length === 0 && !isLoadingLookups) {
                void loadLookups()
              }
            }}
            value={caseProfileId}
          >
            <option value="">All cases</option>
            {lookups.cases.map((caseProfile) => (
              <option key={caseProfile.id} value={caseProfile.id}>
                {caseProfile.caseCode}
              </option>
            ))}
          </select>
          {canManage ? (
            <select
              aria-label="Filter by uploader"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => {
                setPage(1)
                setUploadedById(event.target.value)
              }}
              onFocus={() => {
                if (lookups.uploaders.length === 0 && !isLoadingLookups) {
                  void loadLookups()
                }
              }}
              value={uploadedById}
            >
              <option value="">All uploaders</option>
              {lookups.uploaders.map((uploader) => (
                <option key={uploader.id} value={uploader.id}>
                  {uploader.fullName}
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        </div>

        {lookupError ? (
          <div
            className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
            role="alert"
          >
            {lookupError}
          </div>
        ) : null}

        {loadError && documents.length === 0 ? (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
              <h2 className="mt-4 font-bold text-slate-900">
                Couldn&apos;t load documents
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadDocuments()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : isLoading && documents.length === 0 ? (
          <LoadingState label="Loading documents..." />
        ) : documents.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? 'Try changing or clearing the current filters.'
                : 'Upload the first document to start building the archive.'
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title="No documents found"
          />
        ) : (
          <>
            {loadError ? (
              <div
                className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                <span>Refresh failed: {loadError}. Showing cached data.</span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadDocuments()}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}
            <DataTable
              caption="Documents"
              columns={columns}
              getRowKey={(document) => document.id}
              items={documents}
            />
            <Pagination
              isDisabled={isLoading}
              onPageChange={setPage}
              page={meta.page}
              totalItems={meta.total}
              totalPages={meta.totalPages}
            />
          </>
        )}
      </section>

      <Modal
        isDismissible={!isLoadingLookups}
        isOpen={isUploadOpen}
        onClose={closeUpload}
        size="lg"
        title="Upload Document"
      >
        <UploadDocumentForm
          error={uploadError}
          isLoadingLookups={isLoadingLookups}
          lookupError={lookupError}
          lookups={lookups}
          onCancel={closeUpload}
          onSubmit={handleUpload}
        />
      </Modal>

      <Modal
        isDismissible={!isDetailLoading}
        isOpen={detailTarget !== null}
        onClose={closeDetail}
        size="lg"
        title={detailTarget ? detailTarget.fileName : 'Document details'}
      >
        {documentDetail ? (
          <DocumentDetailView
            document={documentDetail}
            isDownloading={downloadingId === documentDetail.id}
            onDownload={(target) => void handleDownload(target)}
          />
        ) : (
          <div className="p-6">
            {detailError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {detailError}
              </div>
            ) : (
              <LoadingState label="Loading document details..." />
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        message={`Delete document ${deleteTarget?.fileName ?? ''}? This action cannot be undone.`}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title="Delete document"
      />
    </div>
  )
}
