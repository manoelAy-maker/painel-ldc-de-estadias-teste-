import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import { useState, type PropsWithChildren } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { AppLink, type AppPath } from '../router'

const navigation = [
  { to: '/' as AppPath, label: 'Visão geral', icon: LayoutDashboard },
  { to: '/estadias' as AppPath, label: 'Estadias', icon: ClipboardList },
  { to: '/embarques' as AppPath, label: 'Embarques', icon: Truck },
  { to: '/captacao' as AppPath, label: 'Captação', icon: Users },
  { to: '/relatorios' as AppPath, label: 'Relatórios', icon: BarChart3 },
  { to: '/administracao' as AppPath, label: 'Administração', icon: ShieldCheck, admin: true },
]

export function AppLayout({ children }: PropsWithChildren) {
  const { profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div className="brand-copy">
            <strong>AYRES</strong>
            <span>LOGÍSTICA OPERACIONAL</span>
          </div>
          <button
            className="icon-button collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="workspace-label">
          <Building2 size={15} />
          <span>{profile?.filiais?.nome ?? 'Todas as filiais'}</span>
        </div>

        <nav className="navigation" aria-label="Navegação principal">
          {navigation
            .filter((item) => !item.admin || profile?.role === 'admin')
            .map(({ to, label, icon: Icon }) => (
              <AppLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={(isActive) => (isActive ? 'nav-item nav-item--active' : 'nav-item')}
              >
                <Icon size={19} />
                <span>{label}</span>
              </AppLink>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{profile?.nome?.slice(0, 2).toUpperCase() ?? 'MA'}</div>
            <div>
              <strong>{profile?.nome ?? 'Manoel'}</strong>
              <span>{profile?.role ?? 'operador'}</span>
            </div>
          </div>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="content-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <button className="search-button">
            <Search size={17} />
            <span>Buscar placa, motorista, lote ou CT-e</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar-status">
            <span className="online-dot" />
            Sistema online
          </div>
          <button className="icon-button" aria-label="Notificações">
            <Bell size={19} />
          </button>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
