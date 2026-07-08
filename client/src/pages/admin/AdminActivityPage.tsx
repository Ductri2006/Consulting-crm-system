import {
  Activity,
  CalendarDays,
  FileStack,
  Filter,
  Inbox,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, LoadingState, Pagination } from '../../components/admin'
import {
  activityActions,
  activityEntityTypes,
  getActivitySummary,
  listActivities,
  type ActivityItem,
  type ActivityListParams,
  type ActivityListResponse,
  type ActivitySummaryResponse,
} from '../../features/activity'
import { formatDateTime } from '../../i18n/format'
import { getStatusLabel } from '../../i18n/statusLabels'

const EMPTY_ACTIVITY: ActivityListResponse = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-600/20">
          {icon}
        </span>
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const { t } = useTranslation()

  return (
    <li className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(14rem,1fr)_minmax(10rem,0.7fr)_minmax(0,1.3fr)] lg:items-center">
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">
          {t('admin.activityCenter.occurredAt')}
        </p>
        <time className="mt-1 block text-sm font-semibold text-slate-800">
          {formatDateTime(activity.createdAt)}
        </time>
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">
          {t('admin.activityCenter.action')}
        </p>
        <p className="mt-1 text-sm font-bold text-slate-950">
          {getStatusLabel(t, 'activityAction', activity.action)}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">
          {t('admin.activityCenter.actor')}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          {activity.actor?.fullName ?? t('admin.dashboard.system')}
        </p>
        {activity.actor?.role ? (
          <p className="text-xs text-slate-400">
            {getStatusLabel(t, 'role', activity.actor.role)}
          </p>
        ) : null}
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">
          {getStatusLabel(t, 'entityType', activity.entityType)}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {activity.description ?? t('admin.activityCenter.noDescription')}
        </p>
      </div>
    </li>
  )
}

export function AdminActivityPage() {
  const { t } = useTranslation()
  const [activities, setActivities] =
    useState<ActivityListResponse>(EMPTY_ACTIVITY)
  const [summary, setSummary] = useState<ActivitySummaryResponse | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)

    const params: ActivityListParams = {
      page,
      limit: 20,
      sort: 'newest',
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(fromDate && { fromDate }),
      ...(search && { search }),
      ...(toDate && { toDate }),
    }

    try {
      const [nextSummary, nextActivities] = await Promise.all([
        getActivitySummary(),
        listActivities(params),
      ])
      setSummary(nextSummary)
      setActivities(nextActivities)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('admin.activityCenter.loadErrorFallback'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [action, entityType, fromDate, page, search, t, toDate])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const applySearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const resetFilters = () => {
    setAction('')
    setEntityType('')
    setFromDate('')
    setPage(1)
    setSearch('')
    setSearchInput('')
    setToDate('')
  }

  if (isLoading && activities === EMPTY_ACTIVITY) {
    return <LoadingState label={t('admin.activityCenter.loading')} />
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {t('navigation.activity')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('admin.activityCenter.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {t('admin.activityCenter.description')}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          disabled={isLoading}
          onClick={() => void loadActivities()}
          type="button"
        >
          <RefreshCw
            className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            aria-hidden="true"
          />
          {t('common.refresh')}
        </button>
      </header>

      {loadError ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          {t('admin.activityCenter.refreshFailed', { message: loadError })}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Activity className="h-5 w-5" aria-hidden="true" />}
          label={t('admin.activityCenter.totalToday')}
          value={summary?.totalToday ?? 0}
        />
        <SummaryCard
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          label={t('admin.activityCenter.caseEvents')}
          value={summary?.caseEventsToday ?? 0}
        />
        <SummaryCard
          icon={<FileStack className="h-5 w-5" aria-hidden="true" />}
          label={t('admin.activityCenter.documentEvents')}
          value={summary?.documentEventsToday ?? 0}
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
          label={t('admin.activityCenter.portalEvents')}
          value={summary?.portalEventsToday ?? 0}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="h-4 w-4" aria-hidden="true" />
          {t('admin.activityCenter.filters')}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.7fr)_minmax(12rem,0.7fr)_minmax(10rem,0.55fr)_minmax(10rem,0.55fr)_auto]">
          <label className="relative">
            <span className="sr-only">{t('common.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applySearch()
                }
              }}
              placeholder={t('admin.activityCenter.searchPlaceholder')}
              type="search"
              value={searchInput}
            />
          </label>
          <select
            aria-label={t('admin.activityCenter.allActions')}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) => {
              setPage(1)
              setAction(event.target.value)
            }}
            value={action}
          >
            <option value="">{t('admin.activityCenter.allActions')}</option>
            {activityActions.map((item) => (
              <option key={item} value={item}>
                {getStatusLabel(t, 'activityAction', item)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('admin.activityCenter.allEntities')}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) => {
              setPage(1)
              setEntityType(event.target.value)
            }}
            value={entityType}
          >
            <option value="">{t('admin.activityCenter.allEntities')}</option>
            {activityEntityTypes.map((item) => (
              <option key={item} value={item}>
                {getStatusLabel(t, 'entityType', item)}
              </option>
            ))}
          </select>
          <input
            aria-label={t('admin.activityCenter.fromDate')}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) => {
              setPage(1)
              setFromDate(event.target.value)
            }}
            type="date"
            value={fromDate}
          />
          <input
            aria-label={t('admin.activityCenter.toDate')}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) => {
              setPage(1)
              setToDate(event.target.value)
            }}
            type="date"
            value={toDate}
          />
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700"
              onClick={applySearch}
              type="button"
            >
              {t('common.apply')}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              onClick={resetFilters}
              type="button"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <LoadingState label={t('admin.activityCenter.loading')} />
        ) : activities.items.length === 0 ? (
          <EmptyState
            description={t('admin.activityCenter.emptyDescription')}
            icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
            title={t('admin.activityCenter.emptyTitle')}
          />
        ) : (
          <ul>
            {activities.items.map((activity) => (
              <ActivityRow activity={activity} key={activity.id} />
            ))}
          </ul>
        )}
        <Pagination
          isDisabled={isLoading}
          onPageChange={setPage}
          page={activities.meta.page}
          totalItems={activities.meta.total}
          totalPages={activities.meta.totalPages}
        />
      </section>
    </div>
  )
}
