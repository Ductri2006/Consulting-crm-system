import { lazy, Suspense, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout, LoadingState } from '../components/admin'
import { PublicLayout } from '../components/layout/PublicLayout'
import { PortalLayout } from '../components/portal'
import { ProtectedRoute, useAuth } from '../features/auth'
import {
  PortalProtectedRoute,
  usePortalAuth,
} from '../features/customerPortal'

const AboutPage = lazy(() =>
  import('../pages/AboutPage').then((module) => ({
    default: module.AboutPage,
  })),
)
const AppointmentPage = lazy(() =>
  import('../pages/AppointmentPage').then((module) => ({
    default: module.AppointmentPage,
  })),
)
const ConsultationPage = lazy(() =>
  import('../pages/ConsultationPage').then((module) => ({
    default: module.ConsultationPage,
  })),
)
const ContactPage = lazy(() =>
  import('../pages/ContactPage').then((module) => ({
    default: module.ContactPage,
  })),
)
const HomePage = lazy(() =>
  import('../pages/HomePage').then((module) => ({
    default: module.HomePage,
  })),
)
const NewsDetailPage = lazy(() =>
  import('../pages/NewsDetailPage').then((module) => ({
    default: module.NewsDetailPage,
  })),
)
const NewsPage = lazy(() =>
  import('../pages/NewsPage').then((module) => ({
    default: module.NewsPage,
  })),
)
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
)
const ProjectsPage = lazy(() =>
  import('../pages/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  })),
)
const ServiceDetailPage = lazy(() =>
  import('../pages/ServiceDetailPage').then((module) => ({
    default: module.ServiceDetailPage,
  })),
)
const ServicesPage = lazy(() =>
  import('../pages/ServicesPage').then((module) => ({
    default: module.ServicesPage,
  })),
)
const WorkspaceSignupPage = lazy(() =>
  import('../pages/WorkspaceSignupPage').then((module) => ({
    default: module.WorkspaceSignupPage,
  })),
)
const InviteAcceptPage = lazy(() =>
  import('../pages/InviteAcceptPage').then((module) => ({
    default: module.InviteAcceptPage,
  })),
)
const CustomerPortalDashboardPage = lazy(() =>
  import('../pages/portal/CustomerPortalDashboardPage').then((module) => ({
    default: module.CustomerPortalDashboardPage,
  })),
)
const CustomerPortalCaseDetailPage = lazy(() =>
  import('../pages/portal/CustomerPortalCaseDetailPage').then((module) => ({
    default: module.CustomerPortalCaseDetailPage,
  })),
)
const CustomerPortalCasesPage = lazy(() =>
  import('../pages/portal/CustomerPortalCasesPage').then((module) => ({
    default: module.CustomerPortalCasesPage,
  })),
)
const CustomerPortalDocumentsPage = lazy(() =>
  import('../pages/portal/CustomerPortalDocumentsPage').then((module) => ({
    default: module.CustomerPortalDocumentsPage,
  })),
)
const CustomerPortalUpdatesPage = lazy(() =>
  import('../pages/portal/CustomerPortalUpdatesPage').then((module) => ({
    default: module.CustomerPortalUpdatesPage,
  })),
)
const CustomerPortalLoginPage = lazy(() =>
  import('../pages/portal/CustomerPortalLoginPage').then((module) => ({
    default: module.CustomerPortalLoginPage,
  })),
)

const AdminAppointmentsPage = lazy(() =>
  import('../pages/admin/AdminAppointmentsPage').then((module) => ({
    default: module.AdminAppointmentsPage,
  })),
)
const AdminActivityPage = lazy(() =>
  import('../pages/admin/AdminActivityPage').then((module) => ({
    default: module.AdminActivityPage,
  })),
)
const AdminCasesPage = lazy(() =>
  import('../pages/admin/AdminCasesPage').then((module) => ({
    default: module.AdminCasesPage,
  })),
)
const AdminConsultationRequestsPage = lazy(() =>
  import('../pages/admin/AdminConsultationRequestsPage').then((module) => ({
    default: module.AdminConsultationRequestsPage,
  })),
)
const AdminCustomersPage = lazy(() =>
  import('../pages/admin/AdminCustomersPage').then((module) => ({
    default: module.AdminCustomersPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminDocumentsPage = lazy(() =>
  import('../pages/admin/AdminDocumentsPage').then((module) => ({
    default: module.AdminDocumentsPage,
  })),
)
const AdminInvitationsPage = lazy(() =>
  import('../pages/admin/AdminInvitationsPage').then((module) => ({
    default: module.AdminInvitationsPage,
  })),
)
const AdminLoginPage = lazy(() =>
  import('../pages/admin/AdminLoginPage').then((module) => ({
    default: module.AdminLoginPage,
  })),
)
const AdminNotFoundPage = lazy(() =>
  import('../pages/admin/AdminNotFoundPage').then((module) => ({
    default: module.AdminNotFoundPage,
  })),
)
const AdminReportsPage = lazy(() =>
  import('../pages/admin/AdminReportsPage').then((module) => ({
    default: module.AdminReportsPage,
  })),
)
const AdminWorkspaceSettingsPage = lazy(() =>
  import('../pages/admin/AdminWorkspaceSettingsPage').then((module) => ({
    default: module.AdminWorkspaceSettingsPage,
  })),
)
const AdminTasksPage = lazy(() =>
  import('../pages/admin/AdminTasksPage').then((module) => ({
    default: module.AdminTasksPage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('../pages/admin/AdminUsersPage').then((module) => ({
    default: module.AdminUsersPage,
  })),
)

function AdminIndexRoute() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState label={t('common.restoringSession')} />
  }

  return (
    <Navigate
      replace
      to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
    />
  )
}

function PortalIndexRoute() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading } = usePortalAuth()

  if (isLoading) {
    return <LoadingState label={t('common.restoringPortalSession')} />
  }

  return (
    <Navigate
      replace
      to={isAuthenticated ? '/portal/dashboard' : '/portal/login'}
    />
  )
}

function routeElement(element: ReactNode) {
  return (
    <Suspense fallback={<LoadingState label="Loading page..." />}>
      {element}
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="admin">
        <Route index element={<AdminIndexRoute />} />
        <Route path="login" element={routeElement(<AdminLoginPage />)} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={routeElement(<AdminDashboardPage />)}
          />
          <Route
            path="activity"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                {routeElement(<AdminActivityPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={routeElement(<AdminCustomersPage />)}
          />
          <Route path="cases" element={routeElement(<AdminCasesPage />)} />
          <Route
            path="appointments"
            element={routeElement(<AdminAppointmentsPage />)}
          />
          <Route path="tasks" element={routeElement(<AdminTasksPage />)} />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                {routeElement(<AdminUsersPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="invitations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                {routeElement(<AdminInvitationsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="documents"
            element={routeElement(<AdminDocumentsPage />)}
          />
          <Route
            path="reports"
            element={routeElement(<AdminReportsPage />)}
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                {routeElement(<AdminWorkspaceSettingsPage />)}
              </ProtectedRoute>
            }
          />
          <Route
            path="consultation-requests"
            element={routeElement(<AdminConsultationRequestsPage />)}
          />
          <Route path="*" element={routeElement(<AdminNotFoundPage />)} />
        </Route>
      </Route>

      <Route path="portal">
        <Route index element={<PortalIndexRoute />} />
        <Route
          path="login"
          element={routeElement(<CustomerPortalLoginPage />)}
        />
        <Route
          element={
            <PortalProtectedRoute>
              <PortalLayout />
            </PortalProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={routeElement(<CustomerPortalDashboardPage />)}
          />
          <Route
            path="cases"
            element={routeElement(<CustomerPortalCasesPage />)}
          />
          <Route
            path="cases/:id"
            element={routeElement(<CustomerPortalCaseDetailPage />)}
          />
          <Route
            path="documents"
            element={routeElement(<CustomerPortalDocumentsPage />)}
          />
          <Route
            path="updates"
            element={routeElement(<CustomerPortalUpdatesPage />)}
          />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route index element={routeElement(<HomePage />)} />
        <Route path="about" element={routeElement(<AboutPage />)} />
        <Route path="services" element={routeElement(<ServicesPage />)} />
        <Route
          path="services/:slug"
          element={routeElement(<ServiceDetailPage />)}
        />
        <Route path="projects" element={routeElement(<ProjectsPage />)} />
        <Route path="news" element={routeElement(<NewsPage />)} />
        <Route
          path="news/:slug"
          element={routeElement(<NewsDetailPage />)}
        />
        <Route path="contact" element={routeElement(<ContactPage />)} />
        <Route
          path="workspace-signup"
          element={routeElement(<WorkspaceSignupPage />)}
        />
        <Route path="invite/:token" element={routeElement(<InviteAcceptPage />)} />
        <Route
          path="consultation"
          element={routeElement(<ConsultationPage />)}
        />
        <Route
          path="appointment"
          element={routeElement(<AppointmentPage />)}
        />
        <Route path="*" element={routeElement(<NotFoundPage />)} />
      </Route>
    </Routes>
  )
}
