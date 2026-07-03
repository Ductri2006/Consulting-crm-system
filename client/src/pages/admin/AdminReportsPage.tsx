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
    label: 'Total Customers',
    icon: UsersRound,
    iconClassName: 'bg-blue-50 text-blue-600',
    description: 'Customer records',
  },
  {
    key: 'totalCases',
    label: 'Total Cases',
    icon: FolderKanban,
    iconClassName: 'bg-indigo-50 text-indigo-600',
    description: 'All case profiles',
  },
  {
    key: 'casesInProgress',
    label: 'Cases In Progress',
    icon: Clock3,
    iconClassName: 'bg-amber-50 text-amber-600',
    description: 'Active processing',
  },
  {
    key: 'completedCases',
    label: 'Completed Cases',
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-50 text-emerald-600',
    description: 'Successfully completed',
  },
  {
    key: 'overdueCases',
    label: 'Overdue Cases',
    icon: AlertTriangle,
    iconClassName: 'bg-rose-50 text-rose-600',
    description: 'Require attention',
  },
  {
    key: 'todayAppointments',
    label: 'Today Appointments',
    icon: CalendarCheck2,
    iconClassName: 'bg-cyan-50 text-cyan-600',
    description: 'Scheduled today',
  },
  {
    key: 'pendingTasks',
    label: 'Pending Tasks',
    icon: ClipboardList,
    iconClassName: 'bg-violet-50 text-violet-600',
    description: 'Open team tasks',
  },
  {
    key: 'overdueTasks',
    label: 'Overdue Tasks',
    icon: AlertTriangle,
    iconClassName: 'bg-orange-50 text-orange-600',
    description: 'Past deadline',
  },
  {
    key: 'totalDocuments',
    label: 'Total Documents',
    icon: FileStack,
    iconClassName: 'bg-slate-100 text-slate-600',
    description: 'Files on record',
  },
  {
    key: 'newConsultationRequests',
    label: 'New Consultations',
    icon: Inbox,
    iconClassName: 'bg-fuchsia-50 text-fuchsia-600',
    description: 'Awaiting contact',
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

const getDateRangeError = (range: ReportDateRange): string | null => {
  if (range.fromDate && range.toDate && range.fromDate > range.toDate) {
    return 'From date must be on or before to date.'
  }

  return null
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

const formatLabel = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')

const formatDateTime = (value: string, includeTime = false): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

const formatMonth = (value: string): string => {
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

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
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-600" />
        <h3 className="mt-4 font-bold text-slate-900">Report unavailable</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
        {onRetry ? (
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
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
  const maxCount = Math.max(1, ...items.map((item) => item.count))

  if (items.every((item) => item.count === 0)) {
    return (
      <EmptyReport
        description="Case workflow counts will appear once cases exist."
        title="No case status data"
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
              {item.count.toLocaleString()}
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
  const maxCount = Math.max(
    1,
    ...items.flatMap((item) => [item.created, item.completed]),
  )

  if (items.length === 0) {
    return (
      <EmptyReport
        description="Try selecting a wider date range."
        title="No monthly case data"
      />
    )
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-5 text-xs font-bold uppercase tracking-wide text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-blue-500" />
          Created
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
          Completed
        </span>
      </div>
      <div className="space-y-5">
        {items.map((item) => (
          <div
            className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)_4rem]"
            key={item.month}
          >
            <span className="text-sm font-bold text-slate-700">
              {formatMonth(item.month)}
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
              {item.created}/{item.completed}
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
  if (items.length === 0) {
    return (
      <EmptyReport
        description="No open cases, tasks or appointments are due in this window."
        title="No upcoming deadlines"
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
                {item.type}
              </span>
              {item.priority ? (
                <span className="text-xs font-semibold text-slate-400">
                  {formatLabel(item.priority)} priority
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
                {formatDateTime(item.date)}
              </p>
              {item.startTime ? (
                <p className="mt-0.5 text-xs text-slate-400">
                  {item.startTime}
                </p>
              ) : null}
            </div>
            <StatusBadge status={item.status} />
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
  if (items.length === 0) {
    return (
      <EmptyReport
        description="No staff activity was found for the selected date range."
        title="No staff performance data"
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80">
          <tr>
            {[
              'Staff',
              'Assigned cases',
              'Completed cases',
              'Completed tasks',
              'Appointments',
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
                {item.assignedCases.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-emerald-700">
                {item.completedCases.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-blue-700">
                {item.completedTasks.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-violet-700">
                {item.appointmentsCompleted.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecentActivitiesList({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyReport
        description="Case updates will appear here as the team works."
        title="No recent activities"
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
                  {activity.user?.fullName ?? 'System'}
                </span>{' '}
                {activity.description}
              </p>
              <time
                className="shrink-0 text-xs text-slate-400"
                dateTime={activity.createdAt}
              >
                {formatDateTime(activity.createdAt, true)}
              </time>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">
              {activity.caseProfile.caseCode} - {activity.caseProfile.title}
            </p>
            {activity.newStatus ? (
              <div className="mt-2 flex items-center gap-2">
                {activity.oldStatus ? (
                  <StatusBadge status={activity.oldStatus} />
                ) : null}
                {activity.oldStatus ? (
                  <span className="text-xs text-slate-300">to</span>
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
  const rangeError = getDateRangeError(dateRange)

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
          ? getErrorMessage(overviewResult.reason, 'Overview could not load.')
          : null,
    })
    setCasesByStatus({
      data: statusResult.status === 'fulfilled' ? statusResult.value : [],
      isLoading: false,
      error:
        statusResult.status === 'rejected'
          ? getErrorMessage(
              statusResult.reason,
              'Case status report could not load.',
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
              'Recent activities could not load.',
            )
          : null,
    })
  }, [])

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
              'Monthly case report could not load.',
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
              'Staff performance report could not load.',
            )
          : null,
    })
  }, [canViewStaffPerformance, dateRange, rangeError])

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
          'Upcoming deadlines could not be loaded.',
        ),
      })
    }
  }, [deadlineDays])

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
    return <LoadingState label="Loading reports..." />
  }

  if (hasInitialErrors) {
    return (
      <div className="mx-auto max-w-[1600px]">
        <SectionError
          message="The reports page could not load any report sections."
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
            Operational insight
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Reports
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Operational insights across CRM activity.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[10rem_10rem_auto]">
            <label>
              <span className="sr-only">From date</span>
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
              <span className="sr-only">To date</span>
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
                { label: 'Last 7 days', range: getLastDaysRange(7) },
                { label: 'Last 30 days', range: getLastDaysRange(30) },
                { label: 'This month', range: getThisMonthRange() },
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
                Clear
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
        aria-label="Overview summary"
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
            ({ key, label, icon: Icon, iconClassName, description }) => (
              <StatCard
                description={description}
                icon={<Icon className="h-5 w-5" aria-hidden="true" />}
                iconClassName={iconClassName}
                key={key}
                label={label}
                value={overview.data[key]}
              />
            ),
          )
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionShell
          description="Distribution across the case workflow."
          title="Cases by Status"
        >
          {casesByStatus.isLoading ? (
            <SectionLoading label="Loading case status report..." />
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
              <p>{monthTotals.created.toLocaleString()} created</p>
              <p>{monthTotals.completed.toLocaleString()} completed</p>
            </div>
          }
          description="Created and completed cases in the selected range."
          title="Cases by Month"
        >
          {rangeError ? (
            <SectionError message={rangeError} />
          ) : casesByMonth.isLoading ? (
            <SectionLoading label="Loading monthly case report..." />
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
              aria-label="Upcoming deadline window"
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setDeadlineDays(Number(event.target.value))}
              value={deadlineDays}
            >
              {[7, 14, 30].map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          }
          description="Open cases, tasks and appointments due soon."
          title="Upcoming Deadlines"
        >
          {upcomingDeadlines.isLoading ? (
            <SectionLoading label="Loading upcoming deadlines..." />
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
          description="Completed work and ownership metrics for active CRM users."
          title="Staff Performance"
        >
          {!canViewStaffPerformance ? (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">
                  Staff performance locked
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Staff performance reports are available to managers and
                  administrators.
                </p>
              </div>
            </div>
          ) : rangeError ? (
            <SectionError message={rangeError} />
          ) : staffPerformance.isLoading ? (
            <SectionLoading label="Loading staff performance..." />
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
          description="Latest case history activity across visible cases."
          title="Recent Activities"
        >
          {recentActivities.isLoading ? (
            <SectionLoading label="Loading recent activities..." />
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
