import {
  AlertTriangle,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileStack,
  FolderKanban,
  Inbox,
  LockKeyhole,
  RefreshCw,
  UsersRound,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  EmptyState,
  LoadingState,
  StatCard,
  StatusBadge,
} from '../../components/admin'
import { useAuth } from '../../features/auth'
import {
  getCasesByMonth,
  getCasesByStatus,
  getRecentActivities,
  getReportOverview,
  getStaffPerformance,
  getUpcomingDeadlines,
  type CaseStatusReportItem,
  type CasesByMonthItem,
  type DashboardOverview,
  type RecentActivityItem,
  type ReportDateRange,
  type StaffPerformanceItem,
  type UpcomingDeadlineItem,
} from '../../features/reports'
import {
  formatDate as formatLocalizedDate,
  formatDateTime as formatLocalizedDateTime,
  formatMonthYear,
  formatNumber,
} from '../../i18n/format'
import { getStatusLabel } from '../../i18n/statusLabels'
import { cn } from '../../utils/cn'

const DEADLINE_LIMIT = 10
const ACTIVITY_LIMIT = 10
const PERFORMANCE_LIMIT = 10

interface SectionState<T> {
  data: T
  isLoading: boolean
  error: string | null
}

const EMPTY_OVERVIEW: DashboardOverview = {
  totalCustomers: 0,
  totalCases: 0,
  casesInProgress: 0,
  completedCases: 0,
  overdueCases: 0,
  todayAppointments: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  totalDocuments: 0,
  newConsultationRequests: 0,
}

const overviewCards = [
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

const deadlineStatusNamespaces = {
  CASE: 'case',
  TASK: 'task',
  APPOINTMENT: 'appointment',
} as const

const toDateInputValue = (date: Date): string => {
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1_000)

const getLastDaysRange = (days: number): ReportDateRange => {
  const today = new Date()

  return {
    fromDate: toDateInputValue(addDays(today, -(days - 1))),
    toDate: toDateInputValue(today),
  }
}

const getThisMonthRange = (): ReportDateRange => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    fromDate: toDateInputValue(firstDay),
    toDate: toDateInputValue(today),
  }
}

const getDateRangeError = (
  range: ReportDateRange,
  message: string,
): string | null => {
  if (range.fromDate && range.toDate && range.fromDate > range.toDate) {
    return message
  }

  return null
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

function SectionShell({
  children,
  description,
  title,
  action,
}: {
  children: ReactNode
  description: string
  title: string
  action?: ReactNode
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </article>
  )
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center p-8">
      <LoadingState label={label} />
    </div>
  )
}

function SectionError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
        <h3 className="mt-4 font-bold text-slate-900">
          {t('admin.reports.unavailable')}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        {onRetry ? (
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('admin.appointments.retry')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function EmptyReport({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <EmptyState
      description={description}
      icon={<BarChart3 className="h-6 w-6" aria-hidden="true" />}
      title={title}
    />
  )
}

function CasesByStatusChart({
  items,
}: {
  items: CaseStatusReportItem[]
}) {
  const { i18n, t } = useTranslation()
  const maxCount = Math.max(1, ...items.map((item) => item.count))

  if (items.every((item) => item.count === 0)) {
    return (
      <EmptyReport
        description={t('admin.reports.empty.caseStatusDescription')}
        title={t('admin.reports.empty.caseStatusTitle')}
      />
    )
  }

  return (
    <div className="space-y-5 p-5 sm:p-6">
      {items.map((item) => (
        <div key={item.status}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <StatusBadge status={item.status} />
            <span className="text-sm font-bold tabular-nums text-slate-700">
              {formatNumber(item.count, i18n.language)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                'h-full min-w-0 rounded-full transition-[width] duration-500',
                statusBarColors[item.status] ?? 'bg-slate-500',
              )}
              style={{
                width:
                  item.count === 0
                    ? '0%'
                    : `${Math.max(7, (item.count / maxCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function CasesByMonthChart({ items }: { items: CasesByMonthItem[] }) {
  const { i18n, t } = useTranslation()
  const maxCount = Math.max(
    1,
    ...items.flatMap((item) => [item.created, item.completed]),
  )

  if (items.length === 0) {
    return (
      <EmptyReport
        description={t('admin.reports.empty.monthlyDescription')}
        title={t('admin.reports.empty.monthlyTitle')}
      />
    )
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-5 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-blue-500" />
          {t('common.created')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
          {t('common.completed')}
        </span>
      </div>
      <div className="space-y-5">
        {items.map((item) => (
          <div
            className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_4rem]"
            key={item.month}
          >
            <span className="text-sm font-bold text-slate-700">
              {formatMonthYear(item.month, i18n.language)}
            </span>
            <div className="space-y-2">
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width:
                      item.created === 0
                        ? '0%'
                        : `${Math.max(7, (item.created / maxCount) * 100)}%`,
                  }}
                />
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width:
                      item.completed === 0
                        ? '0%'
                        : `${Math.max(7, (item.completed / maxCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-right text-sm font-bold tabular-nums text-slate-700">
              {formatNumber(item.created, i18n.language)}/
              {formatNumber(item.completed, i18n.language)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UpcomingDeadlinesList({
  items,
}: {
  items: UpcomingDeadlineItem[]
}) {
  const { i18n, t } = useTranslation()

  if (items.length === 0) {
    return (
      <EmptyReport
        description={t('admin.reports.empty.deadlinesDescription')}
        title={t('admin.reports.empty.deadlinesTitle')}
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
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
                {formatLocalizedDate(item.date, i18n.language)}
              </p>
              {item.startTime ? (
                <p className="mt-0.5 text-xs text-slate-400">
                  {item.startTime}
                </p>
              ) : null}
            </div>
            <StatusBadge
              namespace={deadlineStatusNamespaces[item.type]}
              status={item.status}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function StaffPerformanceList({
  items,
}: {
  items: StaffPerformanceItem[]
}) {
  const { i18n, t } = useTranslation()

  if (items.length === 0) {
    return (
      <EmptyReport
        description={t('admin.reports.empty.staffDescription')}
        title={t('admin.reports.empty.staffTitle')}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80">
          <tr>
            {[
              t('status.role.STAFF'),
              t('admin.reports.staff.assignedCases'),
              t('admin.reports.staff.completedCases'),
              t('admin.reports.staff.completedTasks'),
              t('navigation.appointments'),
            ].map((header) => (
              <th
                className="whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                key={header}
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item) => (
            <tr className="transition-colors hover:bg-slate-50/80" key={item.user.id}>
              <td className="whitespace-nowrap px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {item.user.fullName}
                  </p>
                  <p className="text-xs text-slate-400">{item.user.email}</p>
                </div>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                {formatNumber(item.assignedCases, i18n.language)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-emerald-700">
                {formatNumber(item.completedCases, i18n.language)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-blue-700">
                {formatNumber(item.completedTasks, i18n.language)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-violet-700">
                {formatNumber(item.appointmentsCompleted, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecentActivitiesList({ items }: { items: RecentActivityItem[] }) {
  const { i18n, t } = useTranslation()

  if (items.length === 0) {
    return (
      <EmptyReport
        description={t('admin.reports.empty.activitiesDescription')}
        title={t('admin.reports.empty.activitiesTitle')}
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((activity) => (
        <li className="flex gap-4 p-5 sm:px-6" key={activity.id}>
          <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
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
                {formatLocalizedDateTime(activity.createdAt, i18n.language)}
              </time>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">
              {activity.caseProfile ? (
                <>
                  {activity.caseProfile.caseCode} - {activity.caseProfile.title}
                </>
              ) : (
                <>
                  {getStatusLabel(
                    t,
                    'entityType',
                    activity.entityType ?? 'ActivityLog',
                  )}{' '}
                  - {getStatusLabel(t, 'activityAction', activity.action)}
                </>
              )}
            </p>
            {activity.newStatus ? (
              <div className="mt-2 flex items-center gap-2">
                {activity.oldStatus ? (
                  <StatusBadge status={activity.oldStatus} />
                ) : null}
                {activity.oldStatus ? (
                  <span className="text-xs text-slate-300">
                    {t('admin.reports.toStatus')}
                  </span>
                ) : null}
                <StatusBadge status={activity.newStatus} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AdminReportsPage() {
  const { i18n, t } = useTranslation()
  const { user } = useAuth()
  const canViewStaffPerformance =
    user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getLastDaysRange(30),
  )
  const [deadlineDays, setDeadlineDays] = useState(7)
  const [overview, setOverview] = useState<SectionState<DashboardOverview>>({
    data: EMPTY_OVERVIEW,
    isLoading: true,
    error: null,
  })
  const [casesByStatus, setCasesByStatus] = useState<
    SectionState<CaseStatusReportItem[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  })
  const [casesByMonth, setCasesByMonth] = useState<
    SectionState<CasesByMonthItem[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  })
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<
    SectionState<UpcomingDeadlineItem[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  })
  const [staffPerformance, setStaffPerformance] = useState<
    SectionState<StaffPerformanceItem[]>
  >({
    data: [],
    isLoading: false,
    error: null,
  })
  const [recentActivities, setRecentActivities] = useState<
    SectionState<RecentActivityItem[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  })
  const rangeError = getDateRangeError(
    dateRange,
    t('admin.reports.rangeError'),
  )

  const loadStaticReports = useCallback(async () => {
    setOverview((current) => ({ ...current, isLoading: true, error: null }))
    setCasesByStatus((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))
    setRecentActivities((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    const [overviewResult, statusResult, activitiesResult] =
      await Promise.allSettled([
        getReportOverview(),
        getCasesByStatus(),
        getRecentActivities(ACTIVITY_LIMIT),
      ])

    setOverview({
      data:
        overviewResult.status === 'fulfilled'
          ? overviewResult.value
          : EMPTY_OVERVIEW,
      isLoading: false,
      error:
        overviewResult.status === 'rejected'
          ? getErrorMessage(overviewResult.reason, t('admin.reports.errors.overview'))
          : null,
    })
    setCasesByStatus({
      data: statusResult.status === 'fulfilled' ? statusResult.value : [],
      isLoading: false,
      error:
        statusResult.status === 'rejected'
          ? getErrorMessage(
              statusResult.reason,
              t('admin.reports.errors.caseStatus'),
            )
          : null,
    })
    setRecentActivities({
      data:
        activitiesResult.status === 'fulfilled' ? activitiesResult.value : [],
      isLoading: false,
      error:
        activitiesResult.status === 'rejected'
          ? getErrorMessage(
              activitiesResult.reason,
              t('admin.reports.errors.activities'),
            )
          : null,
    })
  }, [t])

  const loadRangeReports = useCallback(async () => {
    if (rangeError) {
      setCasesByMonth((current) => ({
        ...current,
        isLoading: false,
        error: rangeError,
      }))
      setStaffPerformance((current) => ({
        ...current,
        isLoading: false,
        error: canViewStaffPerformance ? rangeError : null,
      }))
      return
    }

    setCasesByMonth((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    if (canViewStaffPerformance) {
      setStaffPerformance((current) => ({
        ...current,
        isLoading: true,
        error: null,
      }))
    } else {
      setStaffPerformance({ data: [], isLoading: false, error: null })
    }

    const monthPromise = getCasesByMonth(dateRange)
    const performancePromise = canViewStaffPerformance
      ? getStaffPerformance(dateRange, PERFORMANCE_LIMIT)
      : Promise.resolve<StaffPerformanceItem[]>([])
    const [monthResult, performanceResult] = await Promise.allSettled([
      monthPromise,
      performancePromise,
    ])

    setCasesByMonth({
      data: monthResult.status === 'fulfilled' ? monthResult.value : [],
      isLoading: false,
      error:
        monthResult.status === 'rejected'
          ? getErrorMessage(
              monthResult.reason,
              t('admin.reports.errors.monthly'),
            )
          : null,
    })
    setStaffPerformance({
      data:
        performanceResult.status === 'fulfilled'
          ? performanceResult.value
          : [],
      isLoading: false,
      error:
        performanceResult.status === 'rejected'
          ? getErrorMessage(
              performanceResult.reason,
              t('admin.reports.errors.staff'),
            )
          : null,
    })
  }, [canViewStaffPerformance, dateRange, rangeError, t])

  const loadUpcomingDeadlines = useCallback(async () => {
    setUpcomingDeadlines((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    try {
      const items = await getUpcomingDeadlines(deadlineDays, DEADLINE_LIMIT)
      setUpcomingDeadlines({ data: items, isLoading: false, error: null })
    } catch (error) {
      setUpcomingDeadlines({
        data: [],
        isLoading: false,
        error: getErrorMessage(
          error,
          t('admin.reports.errors.deadlines'),
        ),
      })
    }
  }, [deadlineDays, t])

  useEffect(() => {
    void loadStaticReports()
  }, [loadStaticReports])

  useEffect(() => {
    void loadRangeReports()
  }, [loadRangeReports])

  useEffect(() => {
    void loadUpcomingDeadlines()
  }, [loadUpcomingDeadlines])

  const isInitialLoading =
    overview.isLoading &&
    casesByStatus.isLoading &&
    recentActivities.isLoading &&
    casesByMonth.isLoading &&
    upcomingDeadlines.isLoading
  const hasInitialErrors =
    overview.error &&
    casesByStatus.error &&
    recentActivities.error &&
    casesByMonth.error &&
    upcomingDeadlines.error
  const monthTotals = useMemo(
    () =>
      casesByMonth.data.reduce(
        (totals, item) => ({
          created: totals.created + item.created,
          completed: totals.completed + item.completed,
        }),
        { created: 0, completed: 0 },
      ),
    [casesByMonth.data],
  )

  if (isInitialLoading) {
    return <LoadingState label={t('admin.reports.loading')} />
  }

  if (hasInitialErrors) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <SectionError
          message={t('admin.reports.errors.page')}
          onRetry={() => {
            void loadStaticReports()
            void loadRangeReports()
            void loadUpcomingDeadlines()
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {t('admin.reports.eyebrow')}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {t('navigation.reports')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.reports.description')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[10rem_10rem_auto]">
            <label>
              <span className="sr-only">{t('admin.reports.fromDate')}</span>
              <input
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) =>
                  setDateRange((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
                type="date"
                value={dateRange.fromDate}
              />
            </label>
            <label>
              <span className="sr-only">{t('admin.reports.toDate')}</span>
              <input
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) =>
                  setDateRange((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
                type="date"
                value={dateRange.toDate}
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: t('admin.reports.last7Days'), range: getLastDaysRange(7) },
                { label: t('admin.reports.last30Days'), range: getLastDaysRange(30) },
                { label: t('admin.reports.thisMonth'), range: getThisMonthRange() },
              ].map((item) => (
                <button
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  key={item.label}
                  onClick={() => setDateRange(item.range)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
              <button
                className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                onClick={() => setDateRange({ fromDate: '', toDate: '' })}
                type="button"
              >
                {t('common.clear')}
              </button>
            </div>
          </div>
          {rangeError ? (
            <p className="mt-2 text-sm font-semibold text-rose-600">
              {rangeError}
            </p>
          ) : null}
        </div>
      </header>

      <section
        aria-label={t('admin.reports.overviewSummary')}
        className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {overview.error ? (
          <div className="sm:col-span-2 xl:col-span-5">
            <SectionError
              message={overview.error}
              onRetry={() => void loadStaticReports()}
            />
          </div>
        ) : (
          overviewCards.map(
            ({ key, icon: Icon, iconClassName }) => (
              <StatCard
                description={t(`admin.dashboard.stats.${key}.description`)}
                icon={<Icon className="h-5 w-5" aria-hidden="true" />}
                iconClassName={iconClassName}
                key={key}
                label={t(`admin.dashboard.stats.${key}.label`)}
                value={overview.data[key]}
              />
            ),
          )
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionShell
          description={t('admin.dashboard.casesByStatusDescription')}
          title={t('admin.dashboard.casesByStatus')}
        >
          {casesByStatus.isLoading ? (
            <SectionLoading label={t('admin.reports.loadingCaseStatus')} />
          ) : casesByStatus.error ? (
            <SectionError
              message={casesByStatus.error}
              onRetry={() => void loadStaticReports()}
            />
          ) : (
            <CasesByStatusChart items={casesByStatus.data} />
          )}
        </SectionShell>

        <SectionShell
          action={
            <div className="text-right text-xs font-semibold text-slate-400">
              <p>
                {t('admin.reports.createdCount', {
                  count: formatNumber(monthTotals.created, i18n.language),
                })}
              </p>
              <p>
                {t('admin.reports.completedCount', {
                  count: formatNumber(monthTotals.completed, i18n.language),
                })}
              </p>
            </div>
          }
          description={t('admin.reports.casesByMonthDescription')}
          title={t('admin.reports.casesByMonth')}
        >
          {rangeError ? (
            <SectionError message={rangeError} />
          ) : casesByMonth.isLoading ? (
            <SectionLoading label={t('admin.reports.loadingMonthly')} />
          ) : casesByMonth.error ? (
            <SectionError
              message={casesByMonth.error}
              onRetry={() => void loadRangeReports()}
            />
          ) : (
            <CasesByMonthChart items={casesByMonth.data} />
          )}
        </SectionShell>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <SectionShell
          action={
            <select
              aria-label={t('admin.reports.deadlineWindow')}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setDeadlineDays(Number(event.target.value))}
              value={deadlineDays}
            >
              {[7, 14, 30].map((days) => (
                <option key={days} value={days}>
                  {t('admin.reports.days', { count: days })}
                </option>
              ))}
            </select>
          }
          description={t('admin.reports.deadlinesDescription')}
          title={t('admin.dashboard.upcomingDeadlines')}
        >
          {upcomingDeadlines.isLoading ? (
            <SectionLoading label={t('admin.reports.loadingDeadlines')} />
          ) : upcomingDeadlines.error ? (
            <SectionError
              message={upcomingDeadlines.error}
              onRetry={() => void loadUpcomingDeadlines()}
            />
          ) : (
            <UpcomingDeadlinesList items={upcomingDeadlines.data} />
          )}
        </SectionShell>

        <SectionShell
          description={t('admin.reports.staffDescription')}
          title={t('admin.reports.staffTitle')}
        >
          {!canViewStaffPerformance ? (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">
                  {t('admin.reports.staffLockedTitle')}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {t('admin.reports.staffLockedDescription')}
                </p>
              </div>
            </div>
          ) : rangeError ? (
            <SectionError message={rangeError} />
          ) : staffPerformance.isLoading ? (
            <SectionLoading label={t('admin.reports.loadingStaff')} />
          ) : staffPerformance.error ? (
            <SectionError
              message={staffPerformance.error}
              onRetry={() => void loadRangeReports()}
            />
          ) : (
            <StaffPerformanceList items={staffPerformance.data} />
          )}
        </SectionShell>
      </section>

      <section className="mt-6">
        <SectionShell
          description={t('admin.reports.activitiesDescription')}
          title={t('admin.dashboard.recentActivities')}
        >
          {recentActivities.isLoading ? (
            <SectionLoading label={t('admin.reports.loadingActivities')} />
          ) : recentActivities.error ? (
            <SectionError
              message={recentActivities.error}
              onRetry={() => void loadStaticReports()}
            />
          ) : (
            <RecentActivitiesList items={recentActivities.data} />
          )}
        </SectionShell>
      </section>
    </div>
  )
}
