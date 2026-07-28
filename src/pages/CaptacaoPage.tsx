import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { EmptyState, InlineError, PageHeader, Panel, StatusBadge } from '../components/Ui'
import { formatDateTime, formatPhone, normalizePlate } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Captacao } from '../types'

export function CaptacaoPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Captacao[]>([])
  const [query, setQuery] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ motorista: '', telefone: '', placa: '', eixos: 'LS', destino: '', empresa: '', status: 'captado' as Captacao['status'], lembrete_em: '', observacao: '' })

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('captacoes').select('id, motorista, telefone, placa, eixos, destino, empresa, status, lembrete_em, observacao, created_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(500)
    setRows((data as Captacao[] | null) ?? [])
    setError(loadError ? 'Não foi possível carregar as captações.' : '')
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return rows
    return rows.filter((row) => [row.motorista, row.telefone, row.placa, row.destino, row.empresa].filter(Boolean).some((value) => value!.toLowerCase().includes(term)))
  }, [query, rows])

  async function createLead(event: FormEvent) {
    event.preventDefault()
    if (!profile?.filial_id) return setError('Seu usuário precisa estar vinculado a uma filial.')
    const { error: insertError } = await supabase.from('captacoes').insert({
      filial_id: profile.filial_id,
      captador_id: profile.id,
      motorista: form.motorista.trim(),
      telefone: form.telefone || null,
      placa: form.placa ? normalizePlate(form.placa) : null,
      eixos: form.eixos || null,
      destino: form.destino || null,
      empresa: form.empresa || null,
      status: form.status,
      lembrete_em: form.lembrete_em || null,
      observacao: form.observacao || null,
      created_by: profile.id,
      updated_by: profile.id,
    })
    if (insertError) return setError('Não foi possível salvar a captação.')
    setOpenForm(false)
    setForm({ motorista: '', telefone: '', placa: '', eixos: 'LS', destino: '', empresa: '', status: 'captado', lembrete_em: '', observacao: '' })
    await load()
  }

  return (
    <>
      <PageHeader eyebrow="RELACIONAMENTO COM MOTORISTAS" title="Captação de veículos" description="Registre contatos, retornos e resultados por captador e filial." action={<button className="primary-button compact-button" onClick={() => setOpenForm((v) => !v)}><Plus size={17} /> Nova captação</button>} />
      {openForm && <Panel className="form-panel"><form className="record-form" onSubmit={createLead}>
        <label>Motorista<input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} required /></label>
        <label>Telefone<input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} /></label>
        <label>Placa<input value={form.placa} onChange={(e) => setForm({ ...form, placa: normalizePlate(e.target.value) })} /></label>
        <label>Eixos<select value={form.eixos} onChange={(e) => setForm({ ...form, eixos: e.target.value })}><option>4x2</option><option>LS</option><option>Bitrem</option><option>4º eixo</option><option>9 eixos</option></select></label>
        <label>Destino<input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} /></label>
        <label>Empresa<input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Captacao['status'] })}><option value="captado">Captado</option><option value="sem_retorno">Sem retorno</option><option value="agendado">Agendado</option><option value="carregou">Carregou</option><option value="nao_carregou">Não carregou</option></select></label>
        <label>Lembrete<input type="datetime-local" value={form.lembrete_em} onChange={(e) => setForm({ ...form, lembrete_em: e.target.value })} /></label>
        <label className="span-2">Observação<textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></label>
        <div className="form-actions span-2"><button className="secondary-button" type="button" onClick={() => setOpenForm(false)}>Cancelar</button><button className="primary-button">Salvar</button></div>
      </form></Panel>}
      {error && <InlineError message={error} />}
      <Panel><div className="table-toolbar"><div className="table-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar motorista, telefone, placa ou destino" /></div></div>
        <div className="table-wrap"><table><thead><tr><th>Status</th><th>Motorista</th><th>Telefone</th><th>Placa</th><th>Conjunto</th><th>Destino</th><th>Lembrete</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.id}><td><StatusBadge value={row.status} /></td><td><strong>{row.motorista}</strong></td><td>{row.telefone || '—'}</td><td>{row.placa || '—'}</td><td>{row.eixos || '—'}</td><td>{row.destino || '—'}</td><td>{formatDateTime(row.lembrete_em)}</td></tr>)}</tbody></table>
          {filtered.length === 0 && <EmptyState title="Nenhuma captação encontrada" description="Registre o primeiro contato ou ajuste a busca." />}</div>
      </Panel>
    </>
  )
}

