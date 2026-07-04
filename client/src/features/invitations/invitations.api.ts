import { apiClient } from '../../lib/apiClient'
import type {
  AcceptInvitationInput,
  AcceptInvitationResult,
  CreateInvitationInput,
  CreateInvitationResult,
  InvitationListParams,
  InvitationListResponse,
  InvitationPreview,
  WorkspaceInvitation,
} from './invitations.types'

interface InvitationResponse {
  invitation: WorkspaceInvitation
}

interface InvitationPreviewResponse {
  invitation: InvitationPreview
}

const cleanOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function listInvitations(
  params: InvitationListParams,
): Promise<InvitationListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  if (params.role) {
    query.set('role', params.role)
  }

  if (params.status) {
    query.set('status', params.status)
  }

  return apiClient.get<InvitationListResponse>(
    `/invitations?${query.toString()}`,
  )
}

export function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  return apiClient.post<CreateInvitationResult, CreateInvitationInput>(
    '/invitations',
    {
      email: input.email.trim().toLowerCase(),
      role: input.role,
      expiresInDays: input.expiresInDays,
    },
  )
}

export async function revokeInvitation(
  id: string,
): Promise<WorkspaceInvitation> {
  const result = await apiClient.patch<InvitationResponse>(
    `/invitations/${id}/revoke`,
  )
  return result.invitation
}

export async function previewInvitation(
  token: string,
): Promise<InvitationPreview> {
  const result = await apiClient.get<InvitationPreviewResponse>(
    `/invitations/public/${encodeURIComponent(token)}`,
  )
  return result.invitation
}

export function acceptInvitation(
  token: string,
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
  return apiClient.post<AcceptInvitationResult, AcceptInvitationInput>(
    `/invitations/public/${encodeURIComponent(token)}/accept`,
    {
      fullName: input.fullName.trim(),
      phone: cleanOptional(input.phone),
      password: input.password,
      confirmPassword: input.confirmPassword,
    },
  )
}
