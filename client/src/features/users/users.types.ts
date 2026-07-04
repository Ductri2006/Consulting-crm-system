export type TeamMemberRole = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TeamMember {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: TeamMemberRole
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TeamMemberListResponse {
  items: TeamMember[]
  meta: PaginationMeta
}

export interface TeamMemberListParams {
  page: number
  limit: number
  search?: string
  role?: TeamMemberRole | ''
  isActive?: boolean | ''
}

export interface CreateTeamMemberInput {
  fullName: string
  email: string
  phone?: string
  role: TeamMemberRole
  password: string
  isActive?: boolean
}

export interface UpdateTeamMemberInput {
  fullName: string
  phone?: string
  avatarUrl?: string
  role: TeamMemberRole
  isActive: boolean
}

export interface ResetTeamMemberPasswordInput {
  newPassword: string
}
