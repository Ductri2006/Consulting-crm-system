import { apiClient } from '../../lib/apiClient'
import type {
  WorkspaceSignupData,
  WorkspaceSignupInput,
} from './workspaces.types'

const cleanOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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
