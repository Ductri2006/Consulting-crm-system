import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe2,
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
import { useTranslation } from 'react-i18next'
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
  updateDocumentPortalVisibility,
  uploadDocument,
  type CaseOption,
  type CustomerOption,
  type DocumentDetail,
  type DocumentRecord,
  type DocumentSource,
  type DocumentType,
  type DocumentUploadFormValues,
  type DocumentVisibility,
  type PaginationMeta,
  type UserOption,
} from '../../features/documents'
import {
  formatDateTime as formatLocalizedDateTime,
  formatFileSize as formatLocalizedFileSize,
} from '../../i18n/format'
import { getStatusLabel } from '../../i18n/statusLabels'
import { translateValidationMessage } from '../../i18n/validationMessages'
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

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const formatDateTime = (value: string | undefined): string =>
  formatLocalizedDateTime(value ?? null)

const formatFileSize = (size: number | null | undefined): string =>
  formatLocalizedFileSize(size ?? null)

function FieldError({
  id,
  message,
}: {
  id: string
  message?: string
}) {
  const { t } = useTranslation()
  const translatedMessage = translateValidationMessage(t, message)

  return message ? (
    <p className="field-error" id={id}>
      {translatedMessage}
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
  const { t } = useTranslation()
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
        {t('common.close')}
      </button>
    </div>
  )
}

function ModalActions({
  isSubmitting,
  onCancel,
  submitLabel,
  submittingLabel,
}: {
  isSubmitting: boolean
  onCancel: () => void
  submitLabel: string
  submittingLabel?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      <button
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={onCancel}
        type="button"
      >
        {t('common.cancel')}
      </button>
      <button
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting
          ? (submittingLabel ?? t('admin.documents.saving'))
          : submitLabel}
      </button>
    </div>
  )
}

function DocumentTypeBadge({ fileType }: { fileType: DocumentType }) {
  const { t } = useTranslation()
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
      {getStatusLabel(t, 'document', fileType)}
    </span>
  )
}

function DocumentSourceBadge({ source }: { source: DocumentSource }) {
  const { t } = useTranslation()
  const isCustomerUpload = source === 'CUSTOMER_PORTAL'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isCustomerUpload
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-sky-50 text-sky-700 ring-sky-600/20',
      )}
    >
      {t(`admin.documents.source.${source}`)}
    </span>
  )
}

function DocumentVisibilityBadge({
  visibility,
}: {
  visibility: DocumentVisibility
}) {
  const { t } = useTranslation()
  const isVisible = visibility === 'CUSTOMER_VISIBLE'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isVisible
          ? 'bg-teal-50 text-teal-700 ring-teal-600/20'
          : 'bg-slate-100 text-slate-700 ring-slate-500/20',
      )}
    >
      {t(`admin.documents.visibility.${visibility}`)}
    </span>
  )
}

function SecurityStatusBadge({
  namespace,
  value,
}: {
  namespace: 'storageProvider' | 'scanStatus' | 'ocrStatus'
  value: string
}) {
  const { t } = useTranslation()
  const tone =
    value === 'CLEAN' || value === 'COMPLETED'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : value === 'INFECTED' || value === 'FAILED'
        ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
        : value === 'PENDING'
          ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
          : 'bg-slate-100 text-slate-700 ring-slate-500/20'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        tone,
      )}
    >
      {getStatusLabel(t, namespace, value)}
    </span>
  )
}

const getDocumentUploaderLabel = (
  document: DocumentRecord,
  fallback: string,
): string => {
  if (document.source === 'CUSTOMER_PORTAL') {
    return (
      document.uploadedByPortalAccount?.customer.fullName ??
      document.uploadedByPortalAccount?.email ??
      fallback
    )
  }

  return document.uploadedBy?.fullName ?? fallback
}

const getDownloadUnavailableLabel = (
  document: DocumentRecord,
  t: Parameters<typeof getStatusLabel>[0],
): string =>
  document.downloadUnavailableReason
    ? getStatusLabel(
        t,
        'downloadUnavailableReason',
        document.downloadUnavailableReason,
      )
    : t('admin.documents.downloadUnavailable')

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
  const { t } = useTranslation()
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
            {t('admin.documents.loadingOptions')}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="document-file">
              {t('admin.documents.fields.file')} <span aria-hidden="true">*</span>
            </label>
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
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
              {t('admin.documents.fields.fileType')} <span aria-hidden="true">*</span>
            </label>
            <select
              className="field-input"
              id="document-type"
              {...register('fileType')}
            >
              {documentTypes.map((fileType) => (
                <option key={fileType} value={fileType}>
                  {getStatusLabel(t, 'document', fileType)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="document-customer">
              {t('navigation.customers')}
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
              <option value="">{t('admin.documents.noDirectCustomer')}</option>
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
              {t('navigation.cases')}
            </label>
            <select
              className="field-input"
              disabled={isLoadingLookups}
              id="document-case"
              {...register('caseProfileId')}
            >
              <option value="">{t('admin.documents.noLinkedCase')}</option>
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
        submitLabel={t('admin.documents.uploadDocument')}
        submittingLabel={t('admin.documents.uploading')}
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
  const { t } = useTranslation()

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="truncate">{document.fileName}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DocumentTypeBadge fileType={document.fileType} />
            <SecurityStatusBadge
              namespace="storageProvider"
              value={document.storageProvider}
            />
            <SecurityStatusBadge
              namespace="scanStatus"
              value={document.scanStatus}
            />
            <SecurityStatusBadge
              namespace="ocrStatus"
              value={document.ocrStatus}
            />
          </div>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDownloading || !document.downloadAvailable}
          onClick={() => onDownload(document)}
          title={
            document.downloadAvailable
              ? t('admin.documents.download')
              : getDownloadUnavailableLabel(document, t)
          }
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isDownloading ? t('admin.documents.downloading') : t('admin.documents.download')}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem
          label={t('admin.documents.fields.mimeType')}
          value={document.mimeType ?? t('common.notProvided')}
        />
        <DetailItem
          label={t('admin.documents.fields.source')}
          value={t(`admin.documents.source.${document.source}`)}
        />
        <DetailItem
          label={t('admin.documents.fields.portalVisibility')}
          value={t(`admin.documents.visibility.${document.visibility}`)}
        />
        <DetailItem
          label={t('admin.documents.fields.storageProvider')}
          value={getStatusLabel(t, 'storageProvider', document.storageProvider)}
        />
        <DetailItem
          label={t('admin.documents.fields.scanStatus')}
          value={getStatusLabel(t, 'scanStatus', document.scanStatus)}
        />
        <DetailItem
          label={t('admin.documents.fields.ocrStatus')}
          value={getStatusLabel(t, 'ocrStatus', document.ocrStatus)}
        />
        <DetailItem
          label={t('admin.documents.fields.size')}
          value={formatFileSize(document.size)}
        />
        <DetailItem
          label={t('admin.documents.fields.downloadCount')}
          value={String(document.downloadCount)}
        />
        <DetailItem
          label={t('admin.documents.fields.lastDownloadedAt')}
          value={
            document.lastDownloadedAt
              ? formatDateTime(document.lastDownloadedAt)
              : t('common.notProvided')
          }
        />
        {document.scanMessage ? (
          <DetailItem
            label={t('admin.documents.fields.scanMessage')}
            value={document.scanMessage}
          />
        ) : null}
        <DetailItem
          label={t('navigation.customers')}
          value={document.customer?.fullName ?? t('admin.documents.noCustomer')}
        />
        <DetailItem
          label={t('admin.documents.fields.caseProfile')}
          value={
            document.caseProfile
              ? `${document.caseProfile.caseCode} - ${document.caseProfile.title}`
              : t('admin.documents.noCase')
          }
        />
        <DetailItem
          label={t('admin.documents.fields.uploadedBy')}
          value={getDocumentUploaderLabel(
            document,
            t('admin.documents.unknownUploader'),
          )}
        />
        <DetailItem
          label={t('admin.documents.fields.uploadedDate')}
          value={formatDateTime(document.createdAt)}
        />
        <DetailItem
          label={t('admin.documents.fields.visibilityUpdatedBy')}
          value={
            document.portalVisibilityUpdatedBy?.fullName ??
            t('common.notProvided')
          }
        />
        <DetailItem
          label={t('admin.documents.fields.visibilityUpdatedAt')}
          value={formatDateTime(document.portalVisibilityUpdatedAt ?? undefined)}
        />
        {document.updatedAt ? (
          <DetailItem
            label={t('admin.documents.fields.updatedDate')}
            value={formatDateTime(document.updatedAt)}
          />
        ) : null}
      </div>
      {document.ocrTextPreview ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('admin.documents.fields.ocrTextPreview')}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {document.ocrTextPreview}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function AdminDocumentsPage() {
  const { t } = useTranslation()
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
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState<
    string | null
  >(null)
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
          getErrorMessage(error, t('admin.documents.loadError')),
        )
      }
    } finally {
      if (sequence === listSequence.current) {
        setIsLoading(false)
      }
    }
  }, [caseProfileId, customerId, fileType, page, search, t, uploadedById])

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
        ? getErrorMessage(customersResult.reason, t('admin.documents.customersLoadError'))
        : '',
      casesResult.status === 'rejected'
        ? getErrorMessage(casesResult.reason, t('admin.documents.casesLoadError'))
        : '',
      uploadersResult.status === 'rejected'
        ? getErrorMessage(uploadersResult.reason, t('admin.documents.uploadersLoadError'))
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
          getErrorMessage(error, t('admin.documents.detailsLoadError')),
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
        message: t('admin.documents.uploadedFeedback', {
          fileName: uploaded.fileName,
        }),
      })
      await refreshAfterMutation()
    } catch (error) {
      setUploadError(
        getErrorMessage(error, t('admin.documents.uploadError')),
      )
    }
  }

  const handleDownload = async (document: DocumentRecord) => {
    if (!document.downloadAvailable) {
      setFeedback({
        type: 'error',
        message: getDownloadUnavailableLabel(document, t),
      })
      return
    }

    setDownloadingId(document.id)
    setFeedback(null)

    try {
      await downloadDocument(document.id, document.fileName)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          t('admin.documents.downloadError'),
        ),
      })
    } finally {
      setDownloadingId(null)
      void refreshAfterMutation()
    }
  }

  const handlePortalVisibilityToggle = async (document: DocumentRecord) => {
    const nextVisibility: DocumentVisibility =
      document.visibility === 'CUSTOMER_VISIBLE'
        ? 'INTERNAL_ONLY'
        : 'CUSTOMER_VISIBLE'

    setVisibilityUpdatingId(document.id)
    setFeedback(null)

    try {
      const updated = await updateDocumentPortalVisibility(document.id, {
        visibility: nextVisibility,
      })
      setFeedback({
        type: 'success',
        message: t('admin.documents.visibilityUpdatedFeedback', {
          fileName: updated.fileName,
          visibility: t(`admin.documents.visibility.${updated.visibility}`),
        }),
      })
      await refreshAfterMutation()

      if (documentDetail?.id === updated.id) {
        setDocumentDetail(updated)
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(
          error,
          t('admin.documents.visibilityUpdateError'),
        ),
      })
    } finally {
      setVisibilityUpdatingId(null)
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
        message: t('admin.documents.deletedFeedback', { fileName }),
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
          t('admin.documents.deleteError'),
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
      header: t('admin.documents.fields.fileName'),
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
      header: t('admin.documents.fields.type'),
      render: (document) => (
        <DocumentTypeBadge fileType={document.fileType} />
      ),
    },
    {
      key: 'source',
      header: t('admin.documents.fields.source'),
      render: (document) => <DocumentSourceBadge source={document.source} />,
    },
    {
      key: 'visibility',
      header: t('admin.documents.fields.portalVisibility'),
      render: (document) => (
        <DocumentVisibilityBadge visibility={document.visibility} />
      ),
    },
    {
      key: 'security',
      header: t('admin.documents.fields.scanStatus'),
      render: (document) => (
        <div className="flex flex-wrap gap-1.5">
          <SecurityStatusBadge
            namespace="storageProvider"
            value={document.storageProvider}
          />
          <SecurityStatusBadge
            namespace="scanStatus"
            value={document.scanStatus}
          />
          <SecurityStatusBadge
            namespace="ocrStatus"
            value={document.ocrStatus}
          />
        </div>
      ),
    },
    {
      key: 'customer',
      header: t('navigation.customers'),
      render: (document) =>
        document.customer?.fullName ?? t('admin.documents.noCustomer'),
    },
    {
      key: 'case',
      header: t('navigation.cases'),
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
          t('admin.documents.noCase')
        ),
    },
    {
      key: 'uploadedBy',
      header: t('admin.documents.fields.uploadedBy'),
      render: (document) =>
        getDocumentUploaderLabel(
          document,
          t('admin.documents.unknownUploader'),
        ),
    },
    {
      key: 'createdAt',
      header: t('admin.documents.fields.uploadedDate'),
      render: (document) => formatDateTime(document.createdAt),
    },
    {
      key: 'downloads',
      header: t('admin.documents.fields.downloadCount'),
      render: (document) => (
        <div>
          <p className="font-semibold text-slate-800">
            {document.downloadCount}
          </p>
          <p className="text-xs text-slate-400">
            {document.lastDownloadedAt
              ? formatDateTime(document.lastDownloadedAt)
              : t('common.notProvided')}
          </p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('admin.customers.actions.label'),
      headerClassName: 'text-right',
      className: 'text-right',
      render: (document) => (
        <div className="flex justify-end gap-1">
          <button
            aria-label={t('admin.documents.actions.viewAria', {
              fileName: document.fileName,
            })}
            className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-50"
            onClick={() => openDetail(document)}
            title={t('common.viewDetails')}
            type="button"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={t('admin.documents.actions.downloadAria', {
              fileName: document.fileName,
            })}
            className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              downloadingId === document.id || !document.downloadAvailable
            }
            onClick={() => void handleDownload(document)}
            title={
              document.downloadAvailable
                ? t('admin.documents.download')
                : getDownloadUnavailableLabel(document, t)
            }
            type="button"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          {canManage ? (
            <button
              aria-label={t(
                document.visibility === 'CUSTOMER_VISIBLE'
                  ? 'admin.documents.actions.hideFromPortalAria'
                  : 'admin.documents.actions.showInPortalAria',
                { fileName: document.fileName },
              )}
              className="rounded-lg p-2 text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={visibilityUpdatingId === document.id}
              onClick={() => void handlePortalVisibilityToggle(document)}
              title={
                document.visibility === 'CUSTOMER_VISIBLE'
                  ? t('admin.documents.hideFromPortal')
                  : t('admin.documents.makeVisibleToCustomer')
              }
              type="button"
            >
              {document.visibility === 'CUSTOMER_VISIBLE' ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Globe2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          ) : null}
          {canDelete(document) ? (
            <button
              aria-label={t('admin.documents.actions.deleteAria', {
                fileName: document.fileName,
              })}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setDeleteTarget(document)}
              title={t('common.delete')}
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
            {t('admin.documents.eyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('navigation.documents')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.documents.description')}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"
          onClick={openUpload}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('admin.documents.uploadDocument')}
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
            label={t('admin.documents.searchLabel')}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            placeholder={t('admin.documents.searchPlaceholder')}
            value={searchInput}
          />
          <select
            aria-label={t('admin.documents.filterFileType')}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => {
              setPage(1)
              setFileType(event.target.value as DocumentType | '')
            }}
            value={fileType}
          >
            <option value="">{t('admin.documents.allFileTypes')}</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {getStatusLabel(t, 'document', type)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.documents.filterCustomer')}
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
            <option value="">{t('admin.documents.allCustomers')}</option>
            {lookups.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullName}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.documents.filterCase')}
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
            <option value="">{t('admin.documents.allCases')}</option>
            {lookups.cases.map((caseProfile) => (
              <option key={caseProfile.id} value={caseProfile.id}>
                {caseProfile.caseCode}
              </option>
            ))}
          </select>
          {canManage ? (
            <select
              aria-label={t('admin.documents.filterUploader')}
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
              <option value="">{t('admin.documents.allUploaders')}</option>
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
            {t('admin.cases.clearFilters')}
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
                {t('admin.documents.loadErrorTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {loadError}
              </p>
              <button
                className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                onClick={() => void loadDocuments()}
                type="button"
              >
                {t('common.tryAgain')}
              </button>
            </div>
          </div>
        ) : isLoading && documents.length === 0 ? (
          <LoadingState label={t('admin.documents.loading')} />
        ) : documents.length === 0 ? (
          <EmptyState
            description={
              hasFilters
                ? t('admin.documents.emptyFiltered')
                : t('admin.documents.emptyDefault')
            }
            icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
            title={t('admin.documents.emptyTitle')}
          />
        ) : (
          <>
            {loadError ? (
              <div
                className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
                role="alert"
              >
                <span>
                  {t('admin.documents.refreshFailed', { message: loadError })}
                </span>
                <button
                  className="shrink-0 font-bold underline"
                  onClick={() => void loadDocuments()}
                  type="button"
                >
                  {t('admin.appointments.retry')}
                </button>
              </div>
            ) : null}
            <DataTable
              caption={t('navigation.documents')}
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
        title={t('admin.documents.uploadDocument')}
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
        title={detailTarget ? detailTarget.fileName : t('admin.documents.detailsTitle')}
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
              <LoadingState label={t('admin.documents.loadingDetails')} />
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isLoading={isDeleting}
        isOpen={deleteTarget !== null}
        message={t('admin.documents.deleteConfirm', {
          fileName: deleteTarget?.fileName ?? '',
        })}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null)
          }
        }}
        onConfirm={() => void handleDelete()}
        title={t('admin.documents.deleteTitle')}
      />
    </div>
  )
}
