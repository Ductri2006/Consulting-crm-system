export interface ApiResponse<T> {
  success: true
  message: string
  data: T
}

export interface DashboardOverview {
  totalCustomers: number
  totalCases: number
  casesInProgress: number
  completedCases: number
  overdueCases: number
  todayAppointments: number
  pendingTasks: number
  overdueTasks: number
  totalDocuments: number
  newConsultationRequests: number
}

export interface CaseStatusItem {
  status: string
  count: number
}

export interface UpcomingDeadlineItem {
  type: 'CASE' | 'TASK' | 'APPOINTMENT'
  id: string
  title: string
  date: string
  startTime?: string
  priority?: string
  status: string
}

export interface ActivityUser {
  id: string
  fullName: string
  email: string
}

export interface ActivityCase {
  id: string
  caseCode: string
  title: string
}

export interface RecentActivityItem {
  type: 'CASE_HISTORY' | 'ACTIVITY_LOG'
  id: string
  action: string
  description: string
  oldStatus: string | null
  newStatus: string | null
  createdAt: string
  user: ActivityUser | null
  caseProfile: ActivityCase | null
  entityType: string | null
  entityId: string | null
}

export interface DashboardData {
  overview: DashboardOverview
  casesByStatus: CaseStatusItem[]
  upcomingDeadlines: UpcomingDeadlineItem[]
  recentActivities: RecentActivityItem[]
}
