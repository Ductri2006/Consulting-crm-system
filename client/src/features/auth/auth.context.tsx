import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AUTH_UNAUTHORIZED_EVENT,
  getAccessToken,
  setAccessToken,
} from '../../lib/apiClient'
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
} from './auth.api'
import type {
  AuthContextValue,
  AuthProviderProps,
  User,
} from './auth.types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    let isActive = true

    const handleUnauthorized = () => {
      if (isActive) {
        clearSession()
        setIsLoading(false)
      }
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)

    const restoreSession = async () => {
      if (!getAccessToken()) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getMe()

        if (isActive) {
          setUser(currentUser)
          setToken(getAccessToken())
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
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [clearSession])

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setIsLoading(true)

      try {
        const result = await loginRequest(email, password)
        setAccessToken(result.accessToken)
        setToken(result.accessToken)
        setUser(result.user)
        return result.user
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const acceptSession = useCallback((accessToken: string, nextUser: User) => {
    setAccessToken(accessToken)
    setToken(accessToken)
    setUser(nextUser)
    setIsLoading(false)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest()
    } catch {
      // The local session must still end if the server is unavailable.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      acceptSession,
      login,
      logout,
    }),
    [acceptSession, isLoading, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- The hook is the context's public consumer API.
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
