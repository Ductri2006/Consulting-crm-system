import type { ReactNode } from 'react'

export interface PortalAccount {
  id: string
  organizationId: string
  customerId: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PortalCustomer {
  id: string
  fullName: string
  phone: string
  email: string | null
  address: string | null
}

export interface PortalOrganization {
  id: string
  name: string
  slug: string
}

export interface PortalSession {
  portalAccount: PortalAccount
  customer: PortalCustomer
  organization: PortalOrganization
}

export interface PortalLoginCredentials {
  workspaceSlug: string
  email: string
  password: string
}

export interface PortalLoginData extends PortalSession {
  accessToken: string
}

export interface PortalProfileData extends PortalSession {
  overview: {
    message: string
    caseTrackingAvailable: boolean
    documentUploadAvailable: boolean
    messagingAvailable: boolean
  }
}

export interface PortalAuthContextValue {
  session: PortalSession | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    credentials: PortalLoginCredentials,
  ) => Promise<PortalSession>
  refreshSession: () => Promise<PortalSession>
  logout: () => Promise<void>
}

export interface PortalAuthProviderProps {
  children: ReactNode
}
