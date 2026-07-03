export const caseStatuses = [
  'RECEIVED',
  'VERIFYING',
  'PROPOSING_SOLUTION',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
] as const

export type CaseStatus = (typeof caseStatuses)[number]

export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

export type Priority = (typeof priorities)[number]

export const assignableUserRoles = ['ADMIN', 'MANAGER', 'STAFF'] as const

export type AssignableUserRole = (typeof assignableUserRoles)[number]
export type UserRole = AssignableUserRole | 'CUSTOMER'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CaseCustomerSummary {
  id: string
  fullName: string
  phone: string
  email: string | null
}

export interface CaseServiceSummary {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export interface SafeCaseUser {
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

export interface CaseRelatedCounts {
  histories: number
  documents: number
  tasks: number
  appointments: number
}

export interface CaseRecord {
  id: string
  caseCode: string
  customerId: string
  serviceId: string
  assignedToId: string | null
  title: string
  description: string | null
  note: string | null
  status: CaseStatus
  priority: Priority
  deadline: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CaseProfile extends CaseRecord {
  customer: CaseCustomerSummary
  service: CaseServiceSummary
  assignedTo: SafeCaseUser | null
  _count: CaseRelatedCounts
}

export interface CaseHistoryItem {
  id: string
  caseProfileId: string
  userId: string | null
  action: string
  oldStatus: CaseStatus | null
  newStatus: CaseStatus | null
  note: string | null
  createdAt: string
  user: SafeCaseUser | null
}

export interface CaseDetail extends CaseProfile {
  histories: CaseHistoryItem[]
}

export interface CaseListResponse {
  items: CaseProfile[]
  meta: PaginationMeta
}

export interface CaseHistoryResponse {
  items: CaseHistoryItem[]
  meta: PaginationMeta
}

export interface CaseListParams {
  page: number
  limit: number
  search?: string
  status?: CaseStatus
  priority?: Priority
  serviceId?: string
  customerId?: string
  assignedToId?: string
}

export interface OverdueCaseListParams {
  page: number
  limit: number
  assignedToId?: string
}

export interface CaseHistoryParams {
  page: number
  limit: number
}

export interface CreateCaseInput {
  customerId: string
  serviceId: string
  assignedToId?: string
  title: string
  description?: string
  note?: string
  priority?: Priority
  deadline?: string
}

export interface UpdateCaseInput {
  title?: string
  description?: string
  note?: string
  priority?: Priority
  deadline?: string | null
}

export interface CaseStatusUpdateInput {
  status: CaseStatus
  note?: string
}

export interface CaseAssignInput {
  assignedToId: string
}

export interface CaseFormValues {
  customerId: string
  serviceId: string
  assignedToId: string
  title: string
  description: string
  note: string
  priority: Priority
  deadline: string
}

export type CaseEditFormValues = Pick<
  CaseFormValues,
  'title' | 'description' | 'note' | 'priority' | 'deadline'
>

export interface CaseStatusUpdateValues {
  status: CaseStatus
  note: string
}

export interface CaseAssignValues {
  assignedToId: string
}

export interface CustomerOption {
  id: string
  fullName: string
  phone: string
  email: string | null
}

export interface CustomerOptionListResponse {
  items: CustomerOption[]
  meta: PaginationMeta
}

export interface ServiceOption {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceOptionListResponse {
  items: ServiceOption[]
  meta: PaginationMeta
}

export type UserOption = SafeCaseUser

export interface UserOptionListResponse {
  users: UserOption[]
}

export const caseStatusTransitions: Readonly<
  Record<CaseStatus, readonly CaseStatus[]>
> = {
  RECEIVED: ['VERIFYING', 'CANCELLED'],
  VERIFYING: ['PROPOSING_SOLUTION', 'CANCELLED'],
  PROPOSING_SOLUTION: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}
