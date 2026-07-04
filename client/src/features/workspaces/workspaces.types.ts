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

export interface WorkspaceProfile {
  id: string
  name: string
  slug: string
  industry?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkspaceProfileData {
  workspace: WorkspaceProfile
}

export interface UpdateWorkspaceInput {
  name?: string
  slug?: string
  industry?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
}
