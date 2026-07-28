import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Panel, StatusBadge } from '../components/Ui'
import { supabase } from '../lib/supabase'

type ReportRow = { status: string; created_at: string }

export function ReportsPage() {
  const [estadias, setEstadias] = useState<ReportRow[]>([])
  const [embarques, setEmbarques] = useState<ReportRow[]>([])
  const [captacoes, setCaptacoes] = useState<ReportRow[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('estadias').select('status, created_at').is('deleted_at', null).limit(2000),
      supabase.from('embarques').select('status, created_at').is('deleted_at', null).limit(2000),
      supabase.from('captacoes').select('status, created_at').is('deleted_at', null).limit(2000),
    ]).then(([stays, boardings, leads]) => {
      setEstadias((stays.data as ReportRow[] | null) ?? [])
      setEmbarques((boardings.data as ReportRow[] | null) ?? [])
      setCaptacoes((leads.data as ReportRow[] | null) ?? [])
    })
  }, [])

  const summaries = useMemo(
    () => [
      { title: 'Estadias', rows: estadias },
      { title: 'Embarques', rows: embarques },
      { title: 'Captações', rows: captacoes },
    ],
    [estadias, embarques, captacoes],
  )

  return (
    <>
      <PageHeader eyebrow="ANÁLISE OPERACIONAL" title="Relatórios" description="Resumo dos dados que o seu perfil tem permissão para visualizar." />
      <section className="report-grid">
        {summaries.map(({ title, rows }) => {
          const groups = Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.status] = (acc[row.status] ?? 0) + 1
            return acc
          }, {}))
          return (
            <Panel title={title} key={title}>
              <strong className="report-total">{rows.length}</strong>
              <span className="report-label">registros ativos</span>
              <div className="report-breakdown">
                {groups.map(([status, total]) => <div key={status}><StatusBadge value={status} /><strong>{total}</strong></div>)}
              </div>
            </Panel>
          )
        })}
      </section>
    </>
  )
}

