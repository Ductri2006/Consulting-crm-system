import { apiClient } from '../../lib/apiClient'
import type {
  UpdateWorkspaceInput,
  WorkspaceProfile,
  WorkspaceProfileData,
  WorkspaceSignupData,
  WorkspaceSignupInput,
} from './workspaces.types'

const cleanOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const cleanNullable = (value?: string | null): string | null | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export const signupWorkspace = (
  input: WorkspaceSignupInput,
): Promise<WorkspaceSignupData> =>
  apiClient.post<WorkspaceSignupData, WorkspaceSignupInput>(
    '/workspaces/signup',
    {
      workspaceName: input.workspaceName.trim(),
      workspaceSlug: cleanOptional(input.workspaceSlug),
      industry: cleanOptional(input.industry),
      website: cleanOptional(input.website),
      phone: cleanOptional(input.phone),
      email: cleanOptional(input.email),
      address: cleanOptional(input.address),
      ownerFullName: input.ownerFullName.trim(),
      ownerEmail: input.ownerEmail.trim().toLowerCase(),
      ownerPhone: cleanOptional(input.ownerPhone),
      password: input.password,
      confirmPassword: input.confirmPassword,
    },
  )

export const getCurrentWorkspace = async (): Promise<WorkspaceProfile> => {
  const result = await apiClient.get<WorkspaceProfileData>('/workspace/me')
  return result.workspace
}

export const updateCurrentWorkspace = async (
  input: UpdateWorkspaceInput,
): Promise<WorkspaceProfile> => {
  const result = await apiClient.patch<WorkspaceProfileData, UpdateWorkspaceInput>(
    '/workspace/me',
    {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: input.slug.trim() } : {}),
      ...(input.industry !== undefined
        ? { industry: cleanNullable(input.industry) }
        : {}),
      ...(input.website !== undefined
        ? { website: cleanNullable(input.website) }
        : {}),
      ...(input.phone !== undefined ? { phone: cleanNullable(input.phone) } : {}),
      ...(input.email !== undefined
        ? { email: cleanNullable(input.email)?.toLowerCase() ?? null }
        : {}),
      ...(input.address !== undefined
        ? { address: cleanNullable(input.address) }
        : {}),
      ...(input.logoUrl !== undefined
        ? { logoUrl: cleanNullable(input.logoUrl) }
        : {}),
    },
  )

  return result.workspace
}
