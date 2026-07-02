import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth.context'
import type { UserRole } from './auth.types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: readonly UserRole[]
  loadingFallback?: ReactNode
  forbiddenFallback?: ReactNode
}

export function ProtectedRoute({
  children,
  allowedRoles,
  loadingFallback,
  forbiddenFallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div
          className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600"
          role="status"
        >
          Restoring your session...
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    )
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      forbiddenFallback ?? (
        <Navigate to="/admin/dashboard" replace />
      )
    )
  }

  return children
}
