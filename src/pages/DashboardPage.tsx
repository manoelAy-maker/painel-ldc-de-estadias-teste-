import { AlertTriangle, CheckCircle2, Clock3, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader, Panel } from '../components/Ui'
import { supabase } from '../lib/supabase'

type Metrics = {
  estadiasPendentes: number
  embarquesAtivos: number
  captacoesHoje: number
  finalizadas: number
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    estadiasPendentes: 0,
    embarquesAtivos: 0,
    captacoesHoje: 0,
    finalizadas: 0,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    Promise.all([
      supabase
        .from('estadias')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'nao_saiu'])
        .is('deleted_at', null),
      supabase
        .from('embarques')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aguardando', 'agendado'])
        .is('deleted_at', null),
      supabase
        .from('captacoes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .is('deleted_at', null),
      supabase
        .from('estadias')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'finalizado')
        .is('deleted_at', null),
    ]).then((results) => {
      const firstError = results.find((result) => result.error)?.error
      if (firstError) {
        setError('O banco ainda não foi preparado para esta versão.')
        return
      }
      setMetrics({
        estadiasPendentes: results[0].count ?? 0,
        embarquesAtivos: results[1].count ?? 0,
        captacoesHoje: results[2].count ?? 0,
        finalizadas: results[3].count ?? 0,
      })
    })
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="CENTRO OPERACIONAL"
        title="Visão geral"
        description="Acompanhe os pontos que exigem decisão agora."
        action={<span className="date-chip">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span>}
      />

      {error && <div className="setup-notice"><AlertTriangle size={18} /> {error}</div>}

      <section className="metric-grid">
        <MetricCard
          label="Estadias pendentes"
          value={metrics.estadiasPendentes}
          detail="Aguardando atualização"
          icon={<Clock3 />}
          tone="warning"
        />
        <MetricCard
          label="Embarques ativos"
          value={metrics.embarquesAtivos}
          detail="Aguardando ou agendados"
          icon={<Truck />}
          tone="info"
        />
        <MetricCard
          label="Captações hoje"
          value={metrics.captacoesHoje}
          detail="Registradas desde 00:00"
          icon={<Users />}
          tone="accent"
        />
        <MetricCard
          label="Estadias finalizadas"
          value={metrics.finalizadas}
          detail="Histórico preservado"
          icon={<CheckCircle2 />}
          tone="success"
        />
      </section>

      <section className="dashboard-grid">
        <Panel title="Prioridades da operação">
          <div className="priority-list">
            <div><span className="priority-dot priority-dot--danger" /><strong>Urgente</strong><p>Estadias sem saída e prazos vencidos.</p></div>
            <div><span className="priority-dot priority-dot--warning" /><strong>Atenção</strong><p>Embarques próximos do horário agendado.</p></div>
            <div><span className="priority-dot priority-dot--success" /><strong>Em dia</strong><p>Registros atualizados e finalizados.</p></div>
          </div>
        </Panel>
        <Panel title="Estrutura da nova versão">
          <ul className="check-list">
            <li><CheckCircle2 size={17} /> Login pelo Supabase Auth</li>
            <li><CheckCircle2 size={17} /> Isolamento de dados por filial</li>
            <li><CheckCircle2 size={17} /> Histórico sem apagar registros</li>
            <li><CheckCircle2 size={17} /> Um padrão visual em todo o painel</li>
          </ul>
        </Panel>
      </section>
    </>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string
  value: number
  detail: string
  icon: React.ReactNode
  tone: string
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value.toLocaleString('pt-BR')}</strong>
      <small>{detail}</small>
    </article>
  )
}

