import { Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { EmptyState, InlineError, PageHeader, Panel, StatusBadge } from '../components/Ui'
import { formatDateTime, formatPhone, normalizePlate } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Embarque } from '../types'

export function EmbarquesPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Embarque[]>([])
  const [query, setQuery] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ placa: '', motorista: '', fabrica: '', lote: '', telefone: '', agendado_para: '', status: 'aguardando' as Embarque['status'] })

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('embarques').select('id, placa, motorista, fabrica, lote, status, agendado_para, telefone, created_at').is('deleted_at', null).order('updated_at', { ascending: false }).limit(500)
    setRows((data as Embarque[] | null) ?? [])
    setError(loadError ? 'Não foi possível carregar os embarques.' : '')
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return rows
    return rows.filter((row) => [row.placa, row.motorista, row.fabrica, row.lote].filter(Boolean).some((value) => value!.toLowerCase().includes(term)))
  }, [query, rows])

  async function createBoarding(event: FormEvent) {
    event.preventDefault()
    if (!profile?.filial_id) return setError('Seu usuário precisa estar vinculado a uma filial.')
    const { error: insertError } = await supabase.from('embarques').insert({
      filial_id: profile.filial_id,
      placa: normalizePlate(form.placa),
      motorista: form.motorista.trim(),
      fabrica: form.fabrica.trim(),
      lote: form.lote || null,
      telefone: form.telefone || null,
      agendado_para: form.agendado_para || null,
      status: form.status,
      created_by: profile.id,
      updated_by: profile.id,
    })
    if (insertError) return setError('Não foi possível salvar o embarque.')
    setOpenForm(false)
    setForm({ placa: '', motorista: '', fabrica: '', lote: '', telefone: '', agendado_para: '', status: 'aguardando' })
    await load()
  }

  return (
    <>
      <PageHeader eyebrow="PROGRAMAÇÃO LOGÍSTICA" title="Controle de embarque" description="Uma visão de planilha para acompanhar programação, agendamento e carregamento." action={<button className="primary-button compact-button" onClick={() => setOpenForm((v) => !v)}><Plus size={17} /> Novo embarque</button>} />
      {openForm && <Panel className="form-panel"><form className="record-form" onSubmit={createBoarding}>
        <label>Placa<input value={form.placa} onChange={(e) => setForm({ ...form, placa: normalizePlate(e.target.value) })} required /></label>
        <label>Motorista<input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} required /></label>
        <label>Fábrica<input value={form.fabrica} onChange={(e) => setForm({ ...form, fabrica: e.target.value })} required /></label>
        <label>Lote<input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} /></label>
        <label>Telefone<input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })} /></label>
        <label>Agendado para<input type="datetime-local" value={form.agendado_para} onChange={(e) => setForm({ ...form, agendado_para: e.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Embarque['status'] })}><option value="aguardando">Aguardando</option><option value="agendado">Agendado</option><option value="carregado">Carregado</option><option value="cancelado">Cancelado</option></select></label>
        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setOpenForm(false)}>Cancelar</button><button className="primary-button">Salvar</button></div>
      </form></Panel>}
      {error && <InlineError message={error} />}
      <Panel><div className="table-toolbar"><div className="table-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar placa, motorista, fábrica ou lote" /></div></div>
        <div className="table-wrap"><table><thead><tr><th>Status</th><th>Placa</th><th>Motorista</th><th>Fábrica</th><th>Lote</th><th>Agendamento</th><th>Telefone</th></tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.id}><td><StatusBadge value={row.status} /></td><td><strong>{row.placa}</strong></td><td>{row.motorista}</td><td>{row.fabrica}</td><td>{row.lote || '—'}</td><td>{formatDateTime(row.agendado_para)}</td><td>{row.telefone || '—'}</td></tr>)}</tbody></table>
          {filtered.length === 0 && <EmptyState title="Nenhum embarque encontrado" description="Cadastre a primeira programação ou ajuste a busca." />}</div>
      </Panel>
    </>
  )
}

