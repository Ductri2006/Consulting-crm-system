import { apiClient } from '../../lib/apiClient'
import type {
  CaseStatusReportItem,
  CasesByMonthItem,
  DashboardOverview,
  ItemsResponse,
  RecentActivityItem,
  ReportDateRange,
  StaffPerformanceItem,
  UpcomingDeadlineItem,
} from './reports.types'

const setOptionalParam = (
  query: URLSearchParams,
  key: string,
  value?: string,
): void => {
  const trimmed = value?.trim()

  if (trimmed) {
    query.set(key, trimmed)
  }
}

const buildDateRangeQuery = (range: ReportDateRange): string => {
  const query = new URLSearchParams()

  setOptionalParam(query, 'fromDate', range.fromDate)
  setOptionalParam(query, 'toDate', range.toDate)

  return query.toString()
}

export const getReportOverview = (): Promise<DashboardOverview> =>
  apiClient.get<DashboardOverview>('/dashboard/overview')

export const getCasesByStatus = async (): Promise<
  CaseStatusReportItem[]
> => {
  const response = await apiClient.get<ItemsResponse<CaseStatusReportItem>>(
    '/dashboard/cases-by-status',
  )

  return response.items
}

export const getCasesByMonth = async (
  range: ReportDateRange,
): Promise<CasesByMonthItem[]> => {
  const query = buildDateRangeQuery(range)
  const response = await apiClient.get<ItemsResponse<CasesByMonthItem>>(
    query
      ? `/dashboard/cases-by-month?${query}`
      : '/dashboard/cases-by-month',
  )

  return response.items
}

export const getUpcomingDeadlines = async (
  days: number,
  limit = 10,
): Promise<UpcomingDeadlineItem[]> => {
  const query = new URLSearchParams({
    days: String(days),
    limit: String(limit),
  })
  const response = await apiClient.get<ItemsResponse<UpcomingDeadlineItem>>(
    `/dashboard/upcoming-deadlines?${query.toString()}`,
  )

  return response.items
}

export const getStaffPerformance = async (
  range: ReportDateRange,
  limit = 10,
): Promise<StaffPerformanceItem[]> => {
  const query = new URLSearchParams({ limit: String(limit) })

  setOptionalParam(query, 'fromDate', range.fromDate)
  setOptionalParam(query, 'toDate', range.toDate)

  const response = await apiClient.get<ItemsResponse<StaffPerformanceItem>>(
    `/dashboard/staff-performance?${query.toString()}`,
  )

  return response.items
}

export const getRecentActivities = async (
  limit = 10,
): Promise<RecentActivityItem[]> => {
  const query = new URLSearchParams({ limit: String(limit) })
  const response = await apiClient.get<ItemsResponse<RecentActivityItem>>(
    `/dashboard/recent-activities?${query.toString()}`,
  )

  return response.items
}
