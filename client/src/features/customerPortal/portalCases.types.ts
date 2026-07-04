import type { PortalCustomer } from './portalAuth.types'

export const portalCaseStatuses = [
  'RECEIVED',
  'VERIFYING',
  'PROPOSING_SOLUTION',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
] as const

export type PortalCaseStatus = (typeof portalCaseStatuses)[number]

export const portalPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

export type PortalPriority = (typeof portalPriorities)[number]

export type PortalUserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'
export type PortalAppointmentMethod = 'OFFLINE' | 'ONLINE' | 'PHONE'
export type PortalAppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
export type PortalTaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
export type PortalDocumentType =
  | 'IDENTITY_DOCUMENT'
  | 'REAL_ESTATE_DOCUMENT'
  | 'CONTRACT'
  | 'LEGAL_DOCUMENT'
  | 'CONSTRUCTION_DOCUMENT'
  | 'OTHER'

export interface PortalPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PortalStaffSummary {
  id: string
  fullName: string
  role: PortalUserRole
}

export interface PortalServiceSummary {
  id: string
  name: string
  slug: string
}

export interface PortalCaseTimelineItem {
  id: string
  action: string
  description: string | null
  oldStatus: PortalCaseStatus | null
  newStatus: PortalCaseStatus | null
  createdAt: string
  user: PortalStaffSummary | null
}

export interface PortalCaseSummary {
  id: string
  caseCode: string
  title: string
  status: PortalCaseStatus
  priority: PortalPriority
  service: PortalServiceSummary
  assignedStaff: PortalStaffSummary | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  latestActivity: PortalCaseTimelineItem | null
  upcomingAppointmentCount: number
  documentCount: number
  taskCount: number
}

export interface PortalCaseListResponse {
  items: PortalCaseSummary[]
  meta: PortalPaginationMeta
}

export interface PortalCaseRelatedCounts {
  histories: number
  appointments: number
  documents: number
  tasks: number
}

export interface PortalAppointment {
  id: string
  appointmentDate: string
  startTime: string
  endTime: string | null
  method: PortalAppointmentMethod
  status: PortalAppointmentStatus
  staff: PortalStaffSummary | null
}

export interface PortalDocumentMetadata {
  id: string
  fileName: string
  fileType: PortalDocumentType
  mimeType: string | null
  size: number | null
  createdAt: string
}

export interface PortalTaskSummary {
  id: string
  title: string
  status: PortalTaskStatus
  priority: PortalPriority
  deadline: string | null
  updatedAt: string
}

export interface PortalCaseDetail extends PortalCaseSummary {
  description: string | null
  customer: PortalCustomer
  deadline: string | null
  counts: PortalCaseRelatedCounts
  timeline: PortalCaseTimelineItem[]
  appointments: PortalAppointment[]
  documents: PortalDocumentMetadata[]
  tasks: PortalTaskSummary[]
}

export interface PortalCaseStatusCount {
  status: PortalCaseStatus
  count: number
}

export interface PortalCaseSummaryResponse {
  totalCases: number
  activeCases: number
  completedCases: number
  cancelledCases: number
  upcomingAppointments: number
  nextAppointment: PortalAppointment | null
  casesByStatus: PortalCaseStatusCount[]
  recentCases: PortalCaseSummary[]
}

export interface PortalCaseListParams {
  page: number
  limit: number
  search?: string
  status?: PortalCaseStatus
}
