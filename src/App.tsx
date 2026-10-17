import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/AuthProvider'
import { AppLayout } from './components/AppLayout'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { EstadiasPage } from './pages/EstadiasPage'
import { ReportsPage } from './pages/ReportsPage'
import { PortalPage } from './pages/PortalPage'
import { AppRouter, useAppRouter } from './router'

export default function App() {
  return (
    <AppRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppRouter>
  )
}

function AppContent() {
  const { profile } = useAuth()
  const { path } = useAppRouter()

  if (path === '/') return <PortalPage />

  const pages = {
    '/dashboard': <DashboardPage />,
    '/estadias': <EstadiasPage />,
    '/relatorios': <ReportsPage />,
    '/administracao': profile?.role === 'admin' || !profile ? <AdminPage /> : <DashboardPage />,
  } as const

  return <AppLayout>{pages[path]}</AppLayout>
}
