export type ActivitySort = 'newest' | 'oldest'

export interface ActivityPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ActivityActorSummary {
  id: string
  fullName: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'
}

export interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string | null
  description: string | null
  createdAt: string
  actor: ActivityActorSummary | null
}

export interface ActivityListParams {
  page: number
  limit: number
  action?: string
  entityType?: string
  actorUserId?: string
  search?: string
  fromDate?: string
  toDate?: string
  sort?: ActivitySort
}

export interface ActivityListResponse {
  items: ActivityItem[]
  meta: ActivityPaginationMeta
}

export interface ActivitySummaryResponse {
  totalToday: number
  documentEventsToday: number
  portalEventsToday: number
  caseEventsToday: number
  recentActivities: ActivityItem[]
}

export const activityActions = [
  'AI_CASE_SUMMARY_GENERATED',
  'AI_CASE_SUMMARY_FAILED',
  'AI_CASE_SUMMARY_SKIPPED',
  'CASE_CREATED',
  'CASE_ASSIGNED',
  'CASE_UPDATED',
  'CASE_STATUS_UPDATED',
  'CASE_STATUS_CHANGED',
  'CONSULTATION_REQUEST_CREATED',
  'CONSULTATION_FOLLOW_UP_TASK_CREATED',
  'CONSULTATION_FOLLOW_UP_TASK_FAILED',
  'CONSULTATION_AUTOMATION_EMAIL_SENT',
  'CONSULTATION_AUTOMATION_EMAIL_SKIPPED',
  'CONSULTATION_AUTOMATION_EMAIL_FAILED',
  'APPOINTMENT_CREATED',
  'TASK_CREATED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_DOWNLOADED',
  'CUSTOMER_PORTAL_DOCUMENT_UPLOADED',
  'DOCUMENT_PORTAL_VISIBILITY_UPDATED',
  'WORKSPACE_UPDATED',
  'WORKSPACE_CREATED',
  'INVITATION_CREATED',
  'INVITATION_RESENT',
  'INVITATION_REVOKED',
  'INVITATION_ACCEPTED',
  'CUSTOMER_PORTAL_ACCOUNT_CREATED',
  'CUSTOMER_PORTAL_PASSWORD_RESET',
  'CUSTOMER_PORTAL_ACCOUNT_ACTIVATED',
  'CUSTOMER_PORTAL_ACCOUNT_DEACTIVATED',
] as const

export const activityEntityTypes = [
  'ActivityLog',
  'Appointment',
  'CaseProfile',
  'ConsultationRequest',
  'CustomerPortalAccount',
  'Document',
  'Organization',
  'Task',
  'WorkspaceInvitation',
] as const
