export const taskStatuses = [
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
] as const

export type TaskStatus = (typeof taskStatuses)[number]

export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

export type Priority = (typeof priorities)[number]

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CaseOption {
  id: string
  caseCode: string
  title: string
  status: string
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

export interface Task {
  id: string
  caseProfileId: string | null
  title: string
  description: string | null
  assignedToId: string | null
  createdById: string | null
  status: TaskStatus
  priority: Priority
  deadline: string | null
  createdAt: string
  updatedAt: string
  caseProfile: CaseOption | null
  assignedTo: UserOption | null
  createdBy: UserOption | null
}

export type TaskDetail = Task

export interface TaskListResponse {
  items: Task[]
  meta: PaginationMeta
}

export interface TaskListParams {
  page: number
  limit: number
  search?: string
  status?: TaskStatus
  priority?: Priority
  assignedToId?: string
  createdById?: string
  caseProfileId?: string
}

export interface OverdueTaskListParams {
  page: number
  limit: number
  assignedToId?: string
}

export interface CreateTaskInput {
  caseProfileId?: string
  title: string
  description?: string
  assignedToId?: string
  priority?: Priority
  deadline?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  assignedToId?: string
  priority?: Priority
  deadline?: string | null
}

export interface TaskFormValues {
  title: string
  description: string
  caseProfileId: string
  assignedToId: string
  priority: Priority
  deadline: string
}

export interface TaskStatusUpdateValues {
  status: TaskStatus
}

export interface CaseOptionListResponse {
  items: CaseOption[]
  meta: PaginationMeta
}

export interface UserOptionListResponse {
  users: UserOption[]
}

export const taskStatusTransitions: Readonly<
  Record<TaskStatus, readonly TaskStatus[]>
> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
}
