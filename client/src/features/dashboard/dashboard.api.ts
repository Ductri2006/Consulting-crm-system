import { apiClient } from '../../lib/apiClient'
import type {
  CaseStatusItem,
  DashboardData,
  DashboardOverview,
  RecentActivityItem,
  UpcomingDeadlineItem,
} from './dashboard.types'

interface ItemsResponse<T> {
  items: T[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const [overview, casesByStatus, upcomingDeadlines, recentActivities] =
    await Promise.all([
      apiClient.get<DashboardOverview>('/dashboard/overview'),
      apiClient.get<ItemsResponse<CaseStatusItem>>(
        '/dashboard/cases-by-status',
      ),
      apiClient.get<ItemsResponse<UpcomingDeadlineItem>>(
        '/dashboard/upcoming-deadlines?days=7&limit=8',
      ),
      apiClient.get<ItemsResponse<RecentActivityItem>>(
        '/dashboard/recent-activities?limit=8',
      ),
    ])

  return {
    overview,
    casesByStatus: casesByStatus.items,
    upcomingDeadlines: upcomingDeadlines.items,
    recentActivities: recentActivities.items,
  }
}
