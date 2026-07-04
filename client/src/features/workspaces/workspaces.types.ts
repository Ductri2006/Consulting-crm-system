import type { User } from '../auth'

export interface WorkspaceSignupInput {
  workspaceName: string
  workspaceSlug?: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  ownerFullName: string
  ownerEmail: string
  ownerPhone?: string
  password: string
  confirmPassword: string
}

export interface WorkspaceSignupOrganization {
  id: string
  name: string
  slug: string
}

export interface WorkspaceSignupData {
  accessToken: string
  user: User
  organization: WorkspaceSignupOrganization
}
