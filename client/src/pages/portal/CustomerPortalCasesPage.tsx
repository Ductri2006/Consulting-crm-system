import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  RefreshCw,
  Search,
  SearchX,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  listPortalCases,
  portalCaseListFilterSchema,
  portalCaseStatuses,
  type PortalCaseStatus,
  type PortalCaseSummary,
  type PortalPaginationMeta,
} from '../../features/customerPortal'
import {
  PortalPriorityBadge,
  PortalStatusBadge,
} from '../../features/customerPortal/portalCases.display'
import {
  formatPortalDateTime,
  formatPortalLabel,
} from '../../features/customerPortal/portalCases.format'
import { getStatusLabel } from '../../i18n/statusLabels'

const PAGE_SIZE = 10

const EMPTY_META: PortalPaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function CaseCard({ caseProfile }: { caseProfile: PortalCaseSummary }) {
  const { t } = useTranslation()

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-emerald-700">
              {caseProfile.caseCode}
            </span>
            <PortalStatusBadge status={caseProfile.status} />
            <PortalPriorityBadge priority={caseProfile.priority} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-950">
            {caseProfile.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {caseProfile.service.name}
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          to={`/portal/cases/${caseProfile.id}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          {t('common.viewDetails')}
        </Link>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-bold text-slate-400">{t('common.updated')}</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {formatPortalDateTime(caseProfile.updatedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-400">
            {t('portal.cases.assignedConsultant')}
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {caseProfile.assignedStaff?.fullName ?? t('common.notAssigned')}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-slate-400">
            {t('portal.cases.relatedRecords')}
          </dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {t('portal.cases.documentCount', {
              count: caseProfile.documentCount,
            })}{' '}
            -{' '}
            {t('portal.cases.taskCount', {
              count: caseProfile.taskCount,
            })}
          </dd>
        </div>
      </dl>

      {caseProfile.latestActivity ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-bold text-slate-700">
            {t('portal.cases.latestActivity')}
          </span>{' '}
          {caseProfile.latestActivity.description ??
            formatPortalLabel(caseProfile.latestActivity.action)}
        </div>
      ) : null}
    </article>
  )
}

export function CustomerPortalCasesPage() {
  const { t } = useTranslation()
  const [cases, setCases] = useState<PortalCaseSummary[]>([])
  const [meta, setMeta] = useState<PortalPaginationMeta>(EMPTY_META)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<PortalCaseStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState<string | null>(null)

  const loadCases = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await listPortalCases({
        page,
        limit: PAGE_SIZE,
        ...(search && { search }),
        ...(status && { status }),
      })
      setCases(result.items)
      setMeta(result.meta)
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          t('portal.cases.loadErrorFallback', {
            defaultValue: 'Portal cases could not be loaded.',
          }),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, search, status, t])

  useEffect(() => {
    void loadCases()
  }, [loadCases])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = portalCaseListFilterSchema.safeParse({
      search: searchInput,
      status,
    })

    if (!parsed.success) {
      setFilterError(
        parsed.error.issues[0]?.message ??
          t('portal.cases.invalidFilters', {
            defaultValue: 'Invalid filters.',
          }),
      )
      return
    }

    setFilterError(null)
    setPage(1)
    setSearch(parsed.data.search.trim())
    setStatus(parsed.data.status)
  }

  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setSearchInput('')
    setStatus('')
    setFilterError(null)
  }

  const hasFilters = Boolean(search || status)

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {t('portal.cases.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">
              {t('portal.cases.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t('portal.cases.description')}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 lg:self-auto"
            disabled={isLoading}
            onClick={() => void loadCases()}
            type="button"
          >
            <RefreshCw
              className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              aria-hidden="true"
            />
            {t('common.refresh')}
          </button>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_14rem_auto_auto]"
          noValidate
          onSubmit={handleSubmit}
        >
          <label className="relative block">
            <span className="sr-only">{t('portal.cases.search')}</span>
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('portal.cases.searchPlaceholder')}
              value={searchInput}
            />
          </label>
          <label>
            <span className="sr-only">{t('portal.cases.filterByStatus')}</span>
            <select
              className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              onChange={(event) =>
                setStatus(event.target.value as PortalCaseStatus | '')
              }
              value={status}
            >
              <option value="">{t('portal.cases.allStatuses')}</option>
              {portalCaseStatuses.map((caseStatus) => (
                <option key={caseStatus} value={caseStatus}>
                  {getStatusLabel(t, 'case', caseStatus)}
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
          <p className="mt-3 text-sm font-semibold text-rose-700">
            {filterError}
          </p>
        ) : null}
      </section>

      {loadError && cases.length === 0 ? (
        <section
          className="grid min-h-72 place-items-center rounded-lg border border-rose-200 bg-rose-50 p-8 text-center"
          role="alert"
        >
          <div>
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
            <h2 className="mt-4 font-bold text-slate-950">
              {t('portal.cases.loadErrorTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-rose-700">
              {loadError}
            </p>
            <button
              className="mt-5 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"
              onClick={() => void loadCases()}
              type="button"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        </section>
      ) : isLoading && cases.length === 0 ? (
        <section className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div>
            <BriefcaseBusiness className="mx-auto h-8 w-8 animate-pulse text-emerald-600" />
            <p className="mt-4 text-sm font-bold text-slate-600">
              {t('portal.cases.loading')}
            </p>
          </div>
        </section>
      ) : cases.length === 0 ? (
        <section className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div>
            <SearchX className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-4 font-bold text-slate-950">
              {t('portal.cases.emptyTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {hasFilters
                ? t('portal.cases.emptyFiltered')
                : t('portal.cases.emptyDefault')}
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
              {t('portal.cases.refreshFailed', { message: loadError })}
            </div>
          ) : null}
          <div className="grid gap-4">
            {cases.map((caseProfile) => (
              <CaseCard caseProfile={caseProfile} key={caseProfile.id} />
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                {t('portal.cases.pageOf', {
                  page: meta.page,
                  totalPages: Math.max(meta.totalPages, 1),
                })}
              </span>
              <span>{t('portal.cases.totalCases', { count: meta.total })}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                {t('portal.cases.updatedNewestFirst')}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-4 w-4" aria-hidden="true" />
                {t('portal.cases.metadataOnly')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                disabled={isLoading || meta.page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('portal.cases.previous')}
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
                {t('portal.cases.next')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
