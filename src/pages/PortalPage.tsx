import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Clock3,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'
import { AyresLogo } from '../components/AyresLogo'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAppRouter, type AppPath } from '../router'

const modules: Array<{
  title: string
  label: string
  description: string
  details: string[]
  path: AppPath
  tone: string
  icon: typeof ClipboardList
  admin?: boolean
}> = [
  {
    title: 'Controle de Estadia',
    label: 'Operação',
    description: 'Lançamentos, pendências, documentos e acompanhamento das estadias.',
    details: ['Lançar estadia', 'Pendências', 'Finalizadas'],
    path: '/estadias',
    tone: 'blue',
    icon: ClipboardList,
  },
  {
    title: 'Controle de Embarque',
    label: 'Programação',
    description: 'Programação de veículos no formato de planilha usado pela operação.',
    details: ['Agendamentos', 'Lotes', 'Carregamentos'],
    path: '/embarques',
    tone: 'orange',
    icon: Truck,
  },
  {
    title: 'Captação de Veículos',
    label: 'Comercial',
    description: 'Motoristas, ligações, retornos, contratação e produtividade por usuário.',
    details: ['Captação rápida', 'Leads', 'Resultados'],
    path: '/captacao',
    tone: 'purple',
    icon: Users,
  },
  {
    title: 'Gestão e Relatórios',
    label: 'Administração',
    description: 'Indicadores, relatórios, usuários, filiais e trilha de auditoria.',
    details: ['Dashboard', 'Relatórios', 'Acessos'],
    path: '/dashboard',
    tone: 'cyan',
    icon: BarChart3,
    admin: true,
  },
]

export function PortalPage() {
  const { profile } = useAuth()
  const { navigate } = useAppRouter()
  const firstName = profile?.nome?.split(' ')[0] || 'Manoel'
  const branch = profile?.filiais?.nome || 'Jataí - GO'
  const visibleModules = modules.filter((module) => !module.admin || profile?.role === 'admin' || !profile)

  return (
    <main className="ayres-portal">
      <div className="portal-shell">
        <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-brand-logo"><AyresLogo size={44} /></span>
          <div>
            <strong>AYRES</strong>
            <span>CONTROLE LOGÍSTICO</span>
          </div>
        </div>
        <div className="portal-userbar">
          <span className={`portal-online ${isSupabaseConfigured ? '' : 'portal-online--local'}`}><i /> {isSupabaseConfigured ? 'Sistema configurado' : 'Modo local'}</span>
          <button className="portal-user"><span>MA</span><strong>{firstName}</strong><Settings size={16} /></button>
        </div>
        </header>

        <section className="portal-body">
        <div className="portal-intro">
          <span className="portal-access"><ShieldCheck size={15} /> Central de operações · {branch}</span>
          <h1>Bem-vindo, <em>{firstName}.</em></h1>
          <p>Escolha uma área para entrar. Cada módulo abre somente as ferramentas necessárias para aquela operação.</p>
          <div className="portal-note"><Clock3 size={16} /><span>Sessão segura e dados separados por filial.</span></div>
        </div>

        <div className="portal-modules">
          {visibleModules.map(({ title, label, description, details, path, tone, icon: Icon }) => (
            <button className={`portal-module portal-module--${tone}`} key={title} onClick={() => navigate(path)}>
              <span className="portal-module-icon"><Icon size={24} /></span>
              <span className="portal-module-copy">
                <small>{label}</small>
                <strong>{title}</strong>
                <p>{description}</p>
                <span className="portal-module-tags">{details.map((detail) => <i key={detail}>{detail}</i>)}</span>
              </span>
              <span className="portal-module-arrow"><ArrowRight size={19} /></span>
            </button>
          ))}
        </div>
        </section>

        <footer className="portal-footer">
        <span>AYRES · Central de operações</span>
        <span>Filial ativa: <strong>{branch}</strong></span>
        </footer>
      </div>
    </main>
  )
}
