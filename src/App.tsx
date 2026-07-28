import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/AuthProvider'
import { AppLayout } from './components/AppLayout'
import { AdminPage } from './pages/AdminPage'
import { CaptacaoPage } from './pages/CaptacaoPage'
import { DashboardPage } from './pages/DashboardPage'
import { EmbarquesPage } from './pages/EmbarquesPage'
import { EstadiasPage } from './pages/EstadiasPage'
import { LoginPage } from './pages/LoginPage'
import { ReportsPage } from './pages/ReportsPage'
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
  const { session, profile, loading } = useAuth()
  const { path } = useAppRouter()

  if (loading) {
    return (
      <div className="full-loader">
        <div className="loader-mark">A</div>
        <span>Preparando operação…</span>
      </div>
    )
  }

  if (!session) return <LoginPage />

  if (!profile || !profile.ativo) {
    return (
      <div className="access-pending">
        <strong>Acesso aguardando liberação</strong>
        <p>Seu usuário existe, mas ainda não foi vinculado a uma filial ativa.</p>
      </div>
    )
  }

  const pages = {
    '/': <DashboardPage />,
    '/estadias': <EstadiasPage />,
    '/embarques': <EmbarquesPage />,
    '/captacao': <CaptacaoPage />,
    '/relatorios': <ReportsPage />,
    '/administracao': profile.role === 'admin' ? <AdminPage /> : <DashboardPage />,
  } as const

  return <AppLayout>{pages[path]}</AppLayout>
}
