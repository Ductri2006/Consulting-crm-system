export const appointmentStatuses = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
] as const

export type AppointmentStatus = (typeof appointmentStatuses)[number]

export const appointmentMethods = ['OFFLINE', 'ONLINE', 'PHONE'] as const

export type AppointmentMethod = (typeof appointmentMethods)[number]

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CustomerOption {
  id: string
  fullName: string
  phone: string
  email: string | null
}

export interface CaseOption {
  id: string
  caseCode: string
  title: string
  status: string
  customerId?: string
  customer?: CustomerOption
}

export interface UserOption {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
}

export interface Appointment {
  id: string
  customerId: string
  caseProfileId: string | null
  staffId: string | null
  appointmentDate: string
  startTime: string
  endTime: string | null
  method: AppointmentMethod
  status: AppointmentStatus
  note: string | null
  createdAt: string
  updatedAt: string
  customer: CustomerOption
  caseProfile: CaseOption | null
  staff: UserOption | null
}

export type AppointmentDetail = Appointment

export interface AppointmentListResponse {
  items: Appointment[]
  meta: PaginationMeta
}

export interface TodayAppointmentListResponse {
  items: Appointment[]
}

export interface AppointmentListParams {
  page: number
  limit: number
  search?: string
  status?: AppointmentStatus
  method?: AppointmentMethod
  customerId?: string
  caseProfileId?: string
  staffId?: string
  date?: string
  fromDate?: string
  toDate?: string
}

export interface TodayAppointmentParams {
  staffId?: string
}

export interface CreateAppointmentInput {
  customerId: string
  caseProfileId?: string
  staffId?: string
  appointmentDate: string
  startTime: string
  endTime?: string
  method?: AppointmentMethod
  note?: string
}

export interface UpdateAppointmentInput {
  appointmentDate?: string
  startTime?: string
  endTime?: string | null
  method?: AppointmentMethod
  note?: string | null
  staffId?: string | null
  caseProfileId?: string | null
}

export interface AppointmentStatusUpdateValues {
  status: AppointmentStatus
}

export interface AppointmentFormValues {
  customerId: string
  caseProfileId: string
  staffId: string
  appointmentDate: string
  startTime: string
  endTime: string
  method: AppointmentMethod
  note: string
}

export interface CustomerOptionListResponse {
  items: CustomerOption[]
  meta: PaginationMeta
}

export interface CaseOptionListResponse {
  items: CaseOption[]
  meta: PaginationMeta
}

export interface UserOptionListResponse {
  users: UserOption[]
}

export const appointmentStatusTransitions: Readonly<
  Record<AppointmentStatus, readonly AppointmentStatus[]>
> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}
