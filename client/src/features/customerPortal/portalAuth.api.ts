import { portalApiClient } from '../../lib/portalApiClient'
import type {
  PortalLoginCredentials,
  PortalLoginData,
  PortalProfileData,
  PortalSession,
} from './portalAuth.types'

export const loginCustomerPortal = async (
  credentials: PortalLoginCredentials,
): Promise<PortalLoginData> =>
  portalApiClient.post<PortalLoginData, PortalLoginCredentials>(
    '/portal/auth/login',
    credentials,
  )

export const getPortalSession = async (): Promise<PortalSession> =>
  portalApiClient.get<PortalSession>('/portal/auth/me')

export const getPortalProfile = async (): Promise<PortalProfileData> =>
  portalApiClient.get<PortalProfileData>('/portal/me')

export const logoutCustomerPortal = async (): Promise<void> => {
  await portalApiClient.post<Record<string, never>>('/portal/auth/logout')
}
