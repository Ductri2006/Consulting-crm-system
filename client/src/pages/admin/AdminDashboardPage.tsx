import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileStack,
  FolderKanban,
  Inbox,
  RefreshCw,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingState, StatCard, StatusBadge } from '../../components/admin'
import {
  getDashboardData,
  type DashboardData,
  type UpcomingDeadlineItem,
} from '../../features/dashboard'
import { formatDate, formatDateTime } from '../../i18n/format'
import type { StatusNamespace } from '../../i18n/statusLabels'
import { getStatusLabel } from '../../i18n/statusLabels'
import { cn } from '../../utils/cn'

const statDefinitions = [
  {
    key: 'totalCustomers',
    icon: UsersRound,
    iconClassName: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'totalCases',
    icon: FolderKanban,
    iconClassName: 'bg-indigo-50 text-indigo-600',
  },
  {
    key: 'casesInProgress',
    icon: Clock3,
    iconClassName: 'bg-amber-50 text-amber-600',
  },
  {
    key: 'completedCases',
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-50 text-emerald-600',
  },
  {
    key: 'overdueCases',
    icon: AlertTriangle,
    iconClassName: 'bg-rose-50 text-rose-600',
  },
  {
    key: 'todayAppointments',
    icon: CalendarCheck2,
    iconClassName: 'bg-cyan-50 text-cyan-600',
  },
  {
    key: 'pendingTasks',
    icon: ClipboardList,
    iconClassName: 'bg-violet-50 text-violet-600',
  },
  {
    key: 'overdueTasks',
    icon: AlertTriangle,
    iconClassName: 'bg-orange-50 text-orange-600',
  },
  {
    key: 'totalDocuments',
    icon: FileStack,
    iconClassName: 'bg-slate-100 text-slate-600',
  },
  {
    key: 'newConsultationRequests',
    icon: Inbox,
    iconClassName: 'bg-fuchsia-50 text-fuchsia-600',
  },
] as const

const statusBarColors: Record<string, string> = {
  RECEIVED: 'bg-sky-500',
  VERIFYING: 'bg-violet-500',
  PROPOSING_SOLUTION: 'bg-indigo-500',
  PROCESSING: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-400',
}

const deadlineTypeStyles: Record<UpcomingDeadlineItem['type'], string> = {
  CASE: 'bg-indigo-50 text-indigo-700',
  TASK: 'bg-amber-50 text-amber-700',
  APPOINTMENT: 'bg-cyan-50 text-cyan-700',
}

const getDeadlineStatusNamespace = (
  type: UpcomingDeadlineItem['type'],
): StatusNamespace => {
  if (type === 'TASK') return 'task'
  if (type === 'APPOINTMENT') return 'appointment'
  return 'case'
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        {t('admin.dashboard.loadErrorTitle')}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
      <button
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
        {t('common.tryAgain')}
      </button>
    </div>
  )
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setData(await getDashboardData())
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('admin.dashboard.loadErrorFallback'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const highestStatusCount = useMemo(
    () =>
      Math.max(1, ...(data?.casesByStatus.map((item) => item.count) ?? [0])),
    [data],
  )

  if (isLoading && !data) {
    return <LoadingState />
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => void loadDashboard()} />
  }

  if (!data) {
    return null
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {t('admin.dashboard.overview')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('admin.dashboard.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.dashboard.pageDescription')}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60 sm:self-auto"
          disabled={isLoading}
          onClick={() => void loadDashboard()}
          type="button"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          {t('common.refresh')}
        </button>
      </div>

      {error ? (
        <div
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          <span>{t('admin.dashboard.refreshFailed', { message: error })}</span>
          <button className="font-bold underline" onClick={() => void loadDashboard()}>
            {t('common.tryAgain')}
          </button>
        </div>
      ) : null}

      <section
        aria-label={t('admin.dashboard.statistics')}
        className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {statDefinitions.map(
          ({ key, icon: Icon, iconClassName }) => (
            <StatCard
              description={t(`admin.dashboard.stats.${key}.description`)}
              icon={<Icon className="h-5 w-5" aria-hidden="true" />}
              iconClassName={iconClassName}
              key={key}
              label={t(`admin.dashboard.stats.${key}.label`)}
              value={data.overview[key]}
            />
          ),
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {t('admin.dashboard.casesByStatus')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('admin.dashboard.casesByStatusDescription')}
            </p>
          </div>
          <div className="mt-7 space-y-5">
            {data.casesByStatus.map((item) => (
              <div key={item.status}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <StatusBadge status={item.status} />
                  <span className="text-sm font-bold tabular-nums text-slate-700">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full min-w-0 rounded-full transition-[width] duration-500',
                      statusBarColors[item.status] ?? 'bg-slate-500',
                    )}
                    style={{
                      width:
                        item.count === 0
                          ? '0%'
                          : `${Math.max(7, (item.count / highestStatusCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t('admin.dashboard.upcomingDeadlines')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('admin.dashboard.upcomingDeadlinesDescription')}
            </p>
          </div>
          {data.upcomingDeadlines.length === 0 ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-slate-800">
                  {t('admin.dashboard.noDeadlines')}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t('admin.dashboard.noDeadlinesDescription')}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingDeadlines.map((item) => (
                <li
                  className="flex flex-col gap-3 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  key={`${item.type}-${item.id}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-2 py-1 text-[10px] font-bold tracking-wider',
                          deadlineTypeStyles[item.type],
                        )}
                      >
                        {t(`admin.dashboard.deadlineType.${item.type}`)}
                      </span>
                      {item.priority ? (
                        <span className="text-xs font-semibold text-slate-400">
                          {t('admin.dashboard.priority', {
                            priority: getStatusLabel(t, 'priority', item.priority),
                          })}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">
                        {formatDate(item.date)}
                      </p>
                      {item.startTime ? (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.startTime}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge
                      namespace={getDeadlineStatusNamespace(item.type)}
                      status={item.status}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mt-6">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">
              {t('admin.dashboard.recentActivities')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('admin.dashboard.recentActivitiesDescription')}
            </p>
          </div>
          {data.recentActivities.length === 0 ? (
            <div className="grid min-h-56 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <Inbox className="h-6 w-6" />
                </span>
                <p className="mt-4 font-semibold text-slate-800">
                  {t('admin.dashboard.noActivity')}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {t('admin.dashboard.noActivityDescription')}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentActivities.map((activity) => (
                <li className="flex gap-4 p-5 sm:px-6" key={activity.id}>
                  <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start sm:gap-4">
                      <p className="text-sm leading-6 text-slate-700">
                        <span className="font-bold text-slate-900">
                          {activity.user?.fullName ?? t('admin.dashboard.system')}
                        </span>{' '}
                        {activity.description}
                      </p>
                      <time
                        className="shrink-0 text-xs text-slate-400"
                        dateTime={activity.createdAt}
                      >
                        {formatDateTime(activity.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {activity.caseProfile.caseCode} &middot;{' '}
                      {activity.caseProfile.title}
                    </p>
                    {activity.newStatus ? (
                      <div className="mt-2 flex items-center gap-2">
                        {activity.oldStatus ? (
                          <StatusBadge status={activity.oldStatus} />
                        ) : null}
                        {activity.oldStatus ? (
                          <span className="text-xs text-slate-300">-&gt;</span>
                        ) : null}
                        <StatusBadge status={activity.newStatus} />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}
