import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getPortalAccessToken,
  PORTAL_AUTH_UNAUTHORIZED_EVENT,
  setPortalAccessToken,
} from '../../lib/portalApiClient'
import {
  getPortalSession,
  loginCustomerPortal,
  logoutCustomerPortal,
} from './portalAuth.api'
import type {
  PortalAuthContextValue,
  PortalAuthProviderProps,
  PortalLoginCredentials,
  PortalSession,
} from './portalAuth.types'

const PortalAuthContext =
  createContext<PortalAuthContextValue | undefined>(undefined)

export function PortalAuthProvider({ children }: PortalAuthProviderProps) {
  const [session, setSession] = useState<PortalSession | null>(null)
  const [token, setToken] = useState<string | null>(() => getPortalAccessToken())
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setPortalAccessToken(null)
    setToken(null)
    setSession(null)
  }, [])

  useEffect(() => {
    let isActive = true

    const handleUnauthorized = () => {
      if (isActive) {
        clearSession()
        setIsLoading(false)
      }
    }

    window.addEventListener(
      PORTAL_AUTH_UNAUTHORIZED_EVENT,
      handleUnauthorized,
    )

    const restoreSession = async () => {
      if (!getPortalAccessToken()) {
        setIsLoading(false)
        return
      }

      try {
        const currentSession = await getPortalSession()

        if (isActive) {
          setSession(currentSession)
          setToken(getPortalAccessToken())
        }
      } catch {
        if (isActive) {
          clearSession()
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isActive = false
      window.removeEventListener(
        PORTAL_AUTH_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      )
    }
  }, [clearSession])

  const login = useCallback(
    async (credentials: PortalLoginCredentials): Promise<PortalSession> => {
      setIsLoading(true)

      try {
        const result = await loginCustomerPortal({
          workspaceSlug: credentials.workspaceSlug.trim().toLowerCase(),
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        })
        const nextSession = {
          portalAccount: result.portalAccount,
          customer: result.customer,
          organization: result.organization,
        }

        setPortalAccessToken(result.accessToken)
        setToken(result.accessToken)
        setSession(nextSession)
        return nextSession
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const refreshSession = useCallback(async (): Promise<PortalSession> => {
    const currentSession = await getPortalSession()
    setSession(currentSession)
    setToken(getPortalAccessToken())
    return currentSession
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutCustomerPortal()
    } catch {
      // The local portal session must still end if the server is unavailable.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      session,
      token,
      isAuthenticated: Boolean(session && token),
      isLoading,
      login,
      refreshSession,
      logout,
    }),
    [isLoading, login, logout, refreshSession, session, token],
  )

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components -- The hook is the context's public consumer API.
export const usePortalAuth = (): PortalAuthContextValue => {
  const context = useContext(PortalAuthContext)

  if (!context) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider.')
  }

  return context
}
