import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './features/auth'
import { PortalAuthProvider } from './features/customerPortal'
import { normalizeLanguage } from './i18n/languages'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  }, [i18n.language, i18n.resolvedLanguage])

  return (
    <AuthProvider>
      <PortalAuthProvider>
        <AppRoutes />
      </PortalAuthProvider>
    </AuthProvider>
  )
}

export default App
