import { AuthProvider } from './features/auth'
import { PortalAuthProvider } from './features/customerPortal'
import { AppRoutes } from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <PortalAuthProvider>
        <AppRoutes />
      </PortalAuthProvider>
    </AuthProvider>
  )
}

export default App
