export type CaseStatus =
  | 'RECEIVED'
  | 'VERIFYING'
  | 'PROPOSING_SOLUTION'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

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

export interface CaseStatusReportItem {
  status: CaseStatus
  count: number
}

export interface CasesByMonthItem {
  month: string
  created: number
  completed: number
}

export type UpcomingDeadlineType = 'CASE' | 'TASK' | 'APPOINTMENT'

export interface UpcomingDeadlineItem {
  type: UpcomingDeadlineType
  id: string
  title: string
  date: string
  priority?: Priority
  startTime?: string
  status: string
}

export interface StaffPerformanceUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  avatarUrl: string | null
}

export interface StaffPerformanceItem {
  user: StaffPerformanceUser
  assignedCases: number
  completedCases: number
  completedTasks: number
  appointmentsCompleted: number
}

export interface RecentActivityUser {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RecentActivityCase {
  id: string
  caseCode: string
  title: string
}

export interface RecentActivityItem {
  type: 'CASE_HISTORY'
  id: string
  action: string
  description: string
  oldStatus: CaseStatus | null
  newStatus: CaseStatus | null
  createdAt: string
  user: RecentActivityUser | null
  caseProfile: RecentActivityCase
}

export interface ReportDateRange {
  fromDate: string
  toDate: string
}

export interface ItemsResponse<T> {
  items: T[]
}
