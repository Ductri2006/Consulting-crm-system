import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { usePortalAuth } from './portalAuth.context'

interface PortalProtectedRouteProps {
  children: ReactNode
  loadingFallback?: ReactNode
}

export function PortalProtectedRoute({
  children,
  loadingFallback,
}: PortalProtectedRouteProps) {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading } = usePortalAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div
          className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-slate-200"
          role="status"
        >
          {t('common.restoringPortalSession')}
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/portal/login"
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

  return children
}
