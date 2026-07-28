import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ClipboardList,
  Cloud,
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
import { isSupabaseConfigured } from '../lib/supabase'
import { AppLink, type AppPath } from '../router'
import { AyresLogo } from './AyresLogo'

const navigation = [
  {
    label: 'Operação',
    items: [
      { to: '/dashboard' as AppPath, label: 'Dashboard', icon: LayoutDashboard },
      { to: '/estadias' as AppPath, label: 'Lançar estadia', icon: ClipboardList },
      { to: '/embarques' as AppPath, label: 'Controle de embarque', icon: Truck },
    ],
  },
  {
    label: 'Comercial',
    items: [{ to: '/captacao' as AppPath, label: 'Captação de veículos', icon: Users }],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/relatorios' as AppPath, label: 'Relatórios', icon: BarChart3 },
      { to: '/administracao' as AppPath, label: 'Usuários e cargos', icon: ShieldCheck, admin: true },
    ],
  },
]

export function AppLayout({ children }: PropsWithChildren) {
  const { profile, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-logo"><AyresLogo size={39} /></div>
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
          {navigation.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items
                .filter((item) => !item.admin || profile?.role === 'admin' || !profile)
                .map(({ to, label, icon: Icon }) => (
                  <AppLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={(isActive) => (isActive ? 'nav-item nav-item--active' : 'nav-item')}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </AppLink>
                ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-today">
          <span className="nav-group-label">Hoje</span>
          <div><strong>0</strong><span>Lançadas</span></div>
          <div><strong>0</strong><span>Pendentes</span></div>
          <div><strong>0</strong><span>Urgentes</span></div>
        </div>

        <div className={`cloud-status ${isSupabaseConfigured ? '' : 'cloud-status--local'}`}><Cloud size={15} /><span><strong>{isSupabaseConfigured ? 'Nuvem configurada' : 'Modo local'}</strong><small>{isSupabaseConfigured ? 'Supabase disponível' : 'Banco aguardando configuração'}</small></span></div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{profile?.nome?.slice(0, 2).toUpperCase() ?? 'MA'}</div>
            <div>
              <strong>{profile?.nome ?? 'Manoel'}</strong>
              <span>{profile?.role ?? 'operador'}</span>
            </div>
          </div>
          <button className="icon-button" onClick={() => profile ? void signOut() : window.location.assign('/')} aria-label="Sair">
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
          <div className="topbar-page">
            <strong>Central logística</strong>
            <span>Operação Ayres</span>
          </div>
          <button className="search-button">
            <Search size={17} />
            <span>Buscar placa, motorista, lote ou CT-e</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="topbar-status">
            <span className={`online-dot ${isSupabaseConfigured ? '' : 'online-dot--local'}`} />
            {isSupabaseConfigured ? 'Sistema configurado' : 'Modo local'}
          </div>
          <button className="icon-button" aria-label="Notificações">
            <Bell size={19} />
          </button>
          <AppLink to="/" className="portal-return">Portal</AppLink>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
