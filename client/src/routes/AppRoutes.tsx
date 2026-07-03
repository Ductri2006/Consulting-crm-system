import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout, LoadingState } from '../components/admin'
import { PublicLayout } from '../components/layout/PublicLayout'
import { ProtectedRoute, useAuth } from '../features/auth'
import { AboutPage } from '../pages/AboutPage'
import { AppointmentPage } from '../pages/AppointmentPage'
import { ConsultationPage } from '../pages/ConsultationPage'
import { ContactPage } from '../pages/ContactPage'
import { HomePage } from '../pages/HomePage'
import { NewsDetailPage } from '../pages/NewsDetailPage'
import { NewsPage } from '../pages/NewsPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import {
  AdminCasesPage,
  AdminConsultationRequestsPage,
  AdminCustomersPage,
  AdminDashboardPage,
  AdminLoginPage,
  AdminNotFoundPage,
} from '../pages/admin'

function AdminIndexRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState label="Restoring your session" />
  }

  return (
    <Navigate
      replace
      to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
    />
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="admin">
        <Route index element={<AdminIndexRoute />} />
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="cases" element={<AdminCasesPage />} />
          <Route
            path="consultation-requests"
            element={<AdminConsultationRequestsPage />}
          />
          <Route path="*" element={<AdminNotFoundPage />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/:slug" element={<ServiceDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:slug" element={<NewsDetailPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="consultation" element={<ConsultationPage />} />
        <Route path="appointment" element={<AppointmentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
