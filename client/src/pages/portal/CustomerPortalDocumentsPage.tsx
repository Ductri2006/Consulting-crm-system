import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  SearchX,
  Upload,
  X,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from '../../components/admin'
import {
  downloadPortalDocument,
  listPortalCases,
  listPortalDocuments,
  portalDocumentFilterSchema,
  portalDocumentSources,
  portalDocumentTypes,
  portalDocumentUploadFormSchema,
  toPortalDocumentUploadInput,
  uploadPortalDocument,
  type PortalCaseSummary,
  type PortalDocumentRecord,
  type PortalDocumentSource,
  type PortalDocumentUploadFormValues,
  type PortalPaginationMeta,
} from '../../features/customerPortal'
import {
  formatPortalDateTime,
  formatPortalFileSize,
} from '../../features/customerPortal/portalCases.format'
import { getStatusLabel } from '../../i18n/statusLabels'
import { translateValidationMessage } from '../../i18n/validationMessages'
import { cn } from '../../utils/cn'

const PAGE_SIZE = 10

const EMPTY_META: PortalPaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const EMPTY_UPLOAD_FORM: Omit<PortalDocumentUploadFormValues, 'file'> = {
  caseProfileId: '',
  fileType: 'OTHER',
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function SourceBadge({ source }: { source: PortalDocumentSource }) {
  const { t } = useTranslation()
  const isCustomerUpload = source === 'CUSTOMER_PORTAL'

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        isCustomerUpload
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
          : 'bg-sky-50 text-sky-700 ring-sky-600/20',
      )}
    >
      {t(`portal.documents.source.${source}`)}
    </span>
  )
}

function PortalStatusBadge({
  namespace,
  value,
}: {
  namespace: 'scanStatus'
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
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        tone,
      )}
    >
      {getStatusLabel(t, namespace, value)}
    </span>
  )
}

const getDownloadUnavailableLabel = (
  document: PortalDocumentRecord,
  t: Parameters<typeof getStatusLabel>[0],
): string =>
  document.downloadUnavailableReason
    ? getStatusLabel(
        t,
        'downloadUnavailableReason',
        document.downloadUnavailableReason,
      )
    : t('portal.documents.downloadUnavailable')

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
    <p className="mt-2 text-xs font-bold text-rose-700" id={id}>
      {translatedMessage}
    </p>
  ) : null
}

function UploadDialog({
  cases,
  error,
  isOpen,
  onClose,
  onSubmit,
}: {
  cases: PortalCaseSummary[]
  error: string | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: PortalDocumentUploadFormValues) => Promise<void>
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<PortalDocumentUploadFormValues>({
    resolver: zodResolver(portalDocumentUploadFormSchema),
    defaultValues: EMPTY_UPLOAD_FORM,
  })
  const selectedFile = watch('file')?.[0]

  useEffect(() => {
    if (isOpen) {
      reset(EMPTY_UPLOAD_FORM)
    }
  }, [isOpen, reset])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {t('portal.documents.uploadEyebrow')}
            </p>
            <h2 className="text-lg font-bold text-slate-950" id={titleId}>
              {t('portal.documents.uploadDocument')}
            </h2>
          </div>
          <button
            aria-label={t('common.close')}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-5">
            {error ? (
              <div
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {t('portal.documents.sharedWarning')}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  className="text-sm font-bold text-slate-700"
                  htmlFor="portal-document-file"
                >
                  {t('portal.documents.fields.file')}{' '}
                  <span aria-hidden="true">*</span>
                </label>
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  aria-describedby={
                    errors.file ? 'portal-document-file-error' : undefined
                  }
                  aria-invalid={Boolean(errors.file)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  id="portal-document-file"
                  type="file"
                  {...register('file')}
                />
                <FieldError
                  id="portal-document-file-error"
                  message={errors.file?.message}
                />
                {selectedFile ? (
                  <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <p className="font-bold">{selectedFile.name}</p>
                    <p className="mt-1 text-xs font-semibold">
                      {formatPortalFileSize(selectedFile.size)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  className="text-sm font-bold text-slate-700"
                  htmlFor="portal-document-type"
                >
                  {t('portal.documents.fields.fileType')}
                </label>
                <select
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  id="portal-document-type"
                  {...register('fileType')}
                >
                  {portalDocumentTypes.map((fileType) => (
                    <option key={fileType} value={fileType}>
                      {getStatusLabel(t, 'document', fileType)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-sm font-bold text-slate-700"
                  htmlFor="portal-document-case"
                >
                  {t('portal.documents.fields.relatedCase')}
                </label>
                <select
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  id="portal-document-case"
                  {...register('caseProfileId')}
                >
                  <option value="">{t('portal.documents.noLinkedCase')}</option>
                  {cases.map((caseProfile) => (
                    <option key={caseProfile.id} value={caseProfile.id}>
                      {caseProfile.caseCode} - {caseProfile.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              {t('common.cancel')}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isSubmitting
                ? t('portal.documents.uploading')
                : t('portal.documents.uploadDocument')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DocumentCard({
  document,
  isDownloading,
  onDownload,
}: {
  document: PortalDocumentRecord
  isDownloading: boolean
  onDownload: (document: PortalDocumentRecord) => void
}) {
  const { t } = useTranslation()
  const uploadedByLabel =
    document.source === 'CUSTOMER_PORTAL'
      ? t('portal.documents.uploadedByCustomer')
      : t('portal.documents.uploadedByWorkspaceTeam')

  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-950/[0.03] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={document.source} />
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">
              {getStatusLabel(t, 'document', document.fileType)}
            </span>
            <PortalStatusBadge
              namespace="scanStatus"
              value={document.scanStatus}
            />
          </div>
          <h2 className="mt-3 break-words text-lg font-bold text-slate-950">
            {document.fileName}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatPortalFileSize(document.size)}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-sm shadow-emerald-950/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isDownloading || !document.downloadAvailable}
          onClick={() => onDownload(document)}
          title={
            document.downloadAvailable
              ? t('portal.documents.download')
              : getDownloadUnavailableLabel(document, t)
          }
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isDownloading
            ? t('portal.documents.downloading')
            : t('portal.documents.download')}
        </button>
      </div>
      {!document.downloadAvailable ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {getDownloadUnavailableLabel(document, t)}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-bold text-slate-400">
            {t('portal.documents.fields.relatedCase')}
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {document.caseProfile
              ? `${document.caseProfile.caseCode} - ${document.caseProfile.title}`
              : t('portal.documents.noLinkedCase')}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-400">
            {t('portal.documents.fields.uploadedBy')}
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {uploadedByLabel}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-400">
            {t('portal.documents.fields.uploadedDate')}
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {formatPortalDateTime(document.createdAt)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

export function CustomerPortalDocumentsPage() {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<PortalDocumentRecord[]>([])
  const [cases, setCases] = useState<PortalCaseSummary[]>([])
  const [meta, setMeta] = useState<PortalPaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [caseId, setCaseId] = useState('')
  const [source, setSource] = useState<PortalDocumentSource | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadCases = useCallback(async () => {
    try {
      const result = await listPortalCases({ page: 1, limit: 50 })
      setCases(result.items)
    } catch {
      setCases([])
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listPortalDocuments({
        page,
        limit: PAGE_SIZE,
        ...(search && { search }),
        ...(caseId && { caseId }),
        ...(source && { source }),
      })
      setDocuments(result.items)
      setMeta(result.meta)
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          t('portal.documents.loadErrorFallback'),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [caseId, page, search, source, t])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = portalDocumentFilterSchema.safeParse({
      search: searchInput,
      caseId,
      source,
    })

    if (!parsed.success) {
      setFilterError(
        translateValidationMessage(
          t,
          parsed.error.issues[0]?.message,
        ) ?? t('portal.documents.invalidFilters'),
      )
      return
    }

    setFilterError(null)
    setPage(1)
    setSearch(parsed.data.search.trim())
    setCaseId(parsed.data.caseId.trim())
    setSource(parsed.data.source)
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setCaseId('')
    setSource('')
    setFilterError(null)
  }

  const handleUpload = async (values: PortalDocumentUploadFormValues) => {
    setUploadError(null)
    setFeedback(null)

    try {
      const uploaded = await uploadPortalDocument(
        toPortalDocumentUploadInput(values),
      )
      setIsUploadOpen(false)
      setFeedback(
        t('portal.documents.uploadedFeedback', {
          fileName: uploaded.fileName,
        }),
      )
      setPage(1)
      await loadDocuments()
    } catch (error) {
      setUploadError(
        getErrorMessage(error, t('portal.documents.uploadError')),
      )
    }
  }

  const handleDownload = async (document: PortalDocumentRecord) => {
    if (!document.downloadAvailable) {
      setLoadError(getDownloadUnavailableLabel(document, t))
      return
    }

    setDownloadingId(document.id)
    setFeedback(null)

    try {
      await downloadPortalDocument(document.id, document.fileName)
      await loadDocuments()
    } catch (error) {
      setLoadError(
        getErrorMessage(error, t('portal.documents.downloadFailed')),
      )
    } finally {
      setDownloadingId(null)
    }
  }

  const hasFilters = Boolean(search || caseId || source)

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm shadow-emerald-950/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {t('portal.documents.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              {t('portal.documents.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t('portal.documents.description')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadDocuments()}
              type="button"
            >
              <RefreshCw
                className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                aria-hidden="true"
              />
              {t('common.refresh')}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-sm shadow-emerald-950/15 transition hover:bg-emerald-700"
              onClick={() => {
                setUploadError(null)
                setIsUploadOpen(true)
              }}
              type="button"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {t('portal.documents.uploadDocument')}
            </button>
          </div>
        </div>
      </header>

      {feedback ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          {feedback}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-950/[0.03]">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_14rem_14rem_auto_auto]"
          noValidate
          onSubmit={handleSubmit}
        >
          <label className="relative block">
            <span className="sr-only">{t('portal.documents.search')}</span>
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('portal.documents.searchPlaceholder')}
              value={searchInput}
            />
          </label>
          <label>
            <span className="sr-only">{t('portal.documents.filterByCase')}</span>
            <select
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => setCaseId(event.target.value)}
              value={caseId}
            >
              <option value="">{t('portal.documents.allCases')}</option>
              {cases.map((caseProfile) => (
                <option key={caseProfile.id} value={caseProfile.id}>
                  {caseProfile.caseCode}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">
              {t('portal.documents.filterBySource')}
            </span>
            <select
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) =>
                setSource(event.target.value as PortalDocumentSource | '')
              }
              value={source}
            >
              <option value="">{t('portal.documents.allSources')}</option>
              {portalDocumentSources.map((documentSource) => (
                <option key={documentSource} value={documentSource}>
                  {t(`portal.documents.source.${documentSource}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            type="submit"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {t('common.apply')}
          </button>
          <button
            className="min-h-10 rounded-lg px-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
            disabled={!hasFilters && !searchInput && !filterError}
            onClick={clearFilters}
            type="button"
          >
            {t('common.clear')}
          </button>
        </form>
        {filterError ? (
          <p className="mt-3 text-sm font-semibold text-rose-700" role="alert">
            {filterError}
          </p>
        ) : null}
      </section>

      {loadError && documents.length === 0 ? (
        <ErrorState
          description={loadError}
          onRetry={() => void loadDocuments()}
          title={t('portal.documents.loadErrorTitle')}
        />
      ) : isLoading && documents.length === 0 ? (
        <LoadingState hint={null} label={t('portal.documents.loading')} />
      ) : documents.length === 0 ? (
        <section className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-sm shadow-slate-950/[0.03]">
          <div>
            <SearchX className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-4 font-bold text-slate-950">
              {t('portal.documents.emptyTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {hasFilters
                ? t('portal.documents.emptyFiltered')
                : t('portal.documents.noDocumentsYet')}
            </p>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {loadError ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              role="alert"
            >
              {t('portal.documents.refreshFailed', { message: loadError })}
            </div>
          ) : null}
          <div className="grid gap-4">
            {documents.map((document) => (
              <DocumentCard
                document={document}
                isDownloading={downloadingId === document.id}
                key={document.id}
                onDownload={(target) => void handleDownload(target)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-950/[0.03] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t('portal.documents.pageOf', {
                page: meta.page,
                totalPages: Math.max(meta.totalPages, 1),
              })}
            </span>
            <span>{t('portal.documents.totalDocuments', { count: meta.total })}</span>
            <div className="flex gap-2">
              <button
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                disabled={isLoading || meta.page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('portal.documents.previous')}
              </button>
              <button
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                disabled={
                  isLoading ||
                  meta.totalPages === 0 ||
                  meta.page >= meta.totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, Math.max(meta.totalPages, 1)),
                  )
                }
                type="button"
              >
                {t('portal.documents.next')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

      <UploadDialog
        cases={cases}
        error={uploadError}
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false)
          setUploadError(null)
        }}
        onSubmit={handleUpload}
      />
    </div>
  )
}
