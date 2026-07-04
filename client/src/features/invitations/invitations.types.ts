import type { User } from '../auth'

export type InvitationRole = 'ADMIN' | 'MANAGER' | 'STAFF'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface InvitationOrganization {
  id: string
  name: string
  slug: string
}

export interface InvitationUserSummary {
  id: string
  fullName: string
  email: string
  role: InvitationRole
}

export interface WorkspaceInvitation {
  id: string
  organizationId: string
  email: string
  role: InvitationRole
  status: InvitationStatus
  invitedById: string | null
  acceptedById: string | null
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
  organization: InvitationOrganization
  invitedBy: InvitationUserSummary | null
  acceptedBy: InvitationUserSummary | null
}

export interface InvitationListResponse {
  items: WorkspaceInvitation[]
  meta: PaginationMeta
}

export interface InvitationListParams {
  page: number
  limit: number
  search?: string
  role?: InvitationRole | ''
  status?: InvitationStatus | ''
}

export interface CreateInvitationInput {
  email: string
  role: InvitationRole
  expiresInDays: number
}

export interface CreateInvitationResult {
  invitation: WorkspaceInvitation
  inviteUrl: string
}

export interface InvitationPreview {
  email: string
  role: InvitationRole
  expiresAt: string
  organization: InvitationOrganization
}

export interface AcceptInvitationInput {
  fullName: string
  phone?: string
  password: string
  confirmPassword?: string
}

export interface AcceptInvitationResult {
  accessToken: string
  user: User
  organization: InvitationOrganization
}
