import { apiClient } from '../../lib/apiClient'
import type {
  CreateTeamMemberInput,
  ResetTeamMemberPasswordInput,
  TeamMember,
  TeamMemberListParams,
  TeamMemberListResponse,
  UpdateTeamMemberInput,
} from './users.types'

interface TeamMemberResponse {
  user: TeamMember
}

export function listUsers(
  params: TeamMemberListParams,
): Promise<TeamMemberListResponse> {
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

  if (typeof params.isActive === 'boolean') {
    query.set('isActive', String(params.isActive))
  }

  return apiClient.get<TeamMemberListResponse>(`/users?${query.toString()}`)
}

export async function getUser(id: string): Promise<TeamMember> {
  const result = await apiClient.get<TeamMemberResponse>(`/users/${id}`)
  return result.user
}

export async function createUser(
  input: CreateTeamMemberInput,
): Promise<TeamMember> {
  const result = await apiClient.post<
    TeamMemberResponse,
    CreateTeamMemberInput
  >('/users', input)
  return result.user
}

export async function updateUser(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  const result = await apiClient.patch<
    TeamMemberResponse,
    UpdateTeamMemberInput
  >(`/users/${id}`, input)
  return result.user
}

export async function resetUserPassword(
  id: string,
  input: ResetTeamMemberPasswordInput,
): Promise<TeamMember> {
  const result = await apiClient.patch<
    TeamMemberResponse,
    ResetTeamMemberPasswordInput
  >(`/users/${id}/password`, input)
  return result.user
}
