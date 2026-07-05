import {
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Inbox,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/admin'
import {
  listPortalUpdates,
  getPortalUpdateDescription,
  portalUpdateTypes,
  type PortalUpdateItem,
  type PortalUpdatesListResponse,
  type PortalUpdateType,
} from '../../features/customerPortal'
import { formatPortalDateTime } from '../../features/customerPortal/portalCases.format'
import { getStatusLabel } from '../../i18n/statusLabels'

const EMPTY_UPDATES: PortalUpdatesListResponse = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

const typeIcons: Record<PortalUpdateType, ReactNode> = {
  ACCOUNT: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
  APPOINTMENT: <CalendarClock className="h-5 w-5" aria-hidden="true" />,
  CASE: <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
  DOCUMENT: <FileText className="h-5 w-5" aria-hidden="true" />,
}

function UpdateCard({ update }: { update: PortalUpdateItem }) {
  const { t } = useTranslation()

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
          {typeIcons[update.type]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700">
                {getStatusLabel(t, 'portalUpdateType', update.type)}
              </p>
              <h2 className="mt-1 break-words text-base font-bold text-slate-950">
                {update.action
                  ? getStatusLabel(t, 'portalUpdateAction', update.action)
                  : update.title}
              </h2>
            </div>
            <time
              className="shrink-0 text-xs font-semibold text-slate-400"
              dateTime={update.occurredAt}
            >
              {formatPortalDateTime(update.occurredAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {getPortalUpdateDescription(t, update)}
          </p>
          {update.caseProfile ? (
            <Link
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              to={`/portal/cases/${update.caseProfile.id}`}
            >
              {update.caseProfile.caseCode} - {update.caseProfile.title}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function CustomerPortalUpdatesPage() {
  const { t } = useTranslation()
  const [updates, setUpdates] =
    useState<PortalUpdatesListResponse>(EMPTY_UPDATES)
  const [page, setPage] = useState(1)
  const [type, setType] = useState<PortalUpdateType | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadUpdates = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      setUpdates(
        await listPortalUpdates({
          page,
          limit: 20,
          ...(type && { type }),
        }),
      )
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('portal.updates.loadErrorFallback'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, t, type])

  useEffect(() => {
    void loadUpdates()
  }, [loadUpdates])

  return (
    <div className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-700">
              {t('portal.updates.eyebrow')}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
              {t('portal.updates.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t('portal.updates.description')}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void loadUpdates()}
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

      {loadError && updates.items.length > 0 ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          {t('portal.updates.refreshFailed', { message: loadError })}
        </div>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-bold text-slate-500" htmlFor="update-type">
          {t('portal.updates.filterByType')}
        </label>
        <select
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          id="update-type"
          onChange={(event) => {
            setPage(1)
            setType(event.target.value as PortalUpdateType | '')
          }}
          value={type}
        >
          <option value="">{t('portal.updates.allTypes')}</option>
          {portalUpdateTypes.map((item) => (
            <option key={item} value={item}>
              {getStatusLabel(t, 'portalUpdateType', item)}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        {loadError && updates.items.length === 0 ? (
          <ErrorState
            description={loadError}
            onRetry={() => void loadUpdates()}
            title={t('portal.updates.loadErrorTitle')}
          />
        ) : isLoading ? (
          <LoadingState hint={null} label={t('portal.updates.loading')} />
        ) : updates.items.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-center">
            <div>
              <Inbox className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-4 font-bold text-slate-950">
                {t('portal.updates.emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                {t('portal.updates.emptyDescription')}
              </p>
            </div>
          </div>
        ) : (
          updates.items.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))
        )}
      </section>

      <nav
        aria-label={t('common.pagination')}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm font-semibold text-slate-500">
          {t('portal.updates.totalUpdates', {
            count: updates.meta.total,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || updates.meta.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            {t('portal.documents.previous')}
          </button>
          <span className="min-w-24 text-center text-sm font-bold text-slate-700">
            {updates.meta.page} / {Math.max(1, updates.meta.totalPages)}
          </span>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              isLoading ||
              updates.meta.totalPages === 0 ||
              updates.meta.page >= updates.meta.totalPages
            }
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            {t('portal.documents.next')}
          </button>
        </div>
      </nav>
    </div>
  )
}
