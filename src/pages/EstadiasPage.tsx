import { Plus, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { EmptyState, InlineError, PageHeader, Panel, StatusBadge } from '../components/Ui'
import { formatDateTime, normalizePlate } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Estadia } from '../types'

const initialForm = {
  placa: '',
  tipo: 'a_lancar' as Estadia['tipo'],
  status: 'pendente' as Estadia['status'],
  prioridade: 'normal' as Estadia['prioridade'],
  controle: '',
  lote: '',
  nf: '',
  cte: '',
  observacao: '',
}

export function EstadiasPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Estadia[]>([])
  const [form, setForm] = useState(initialForm)
  const [query, setQuery] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('estadias')
      .select('id, placa, tipo, status, prioridade, controle, lote, nf, cte, emissao_cte, descarga_em, observacao, created_at')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(500)

    setError(loadError ? 'Não foi possível carregar as estadias.' : '')
    setRows((data as Estadia[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [row.placa, row.controle, row.lote, row.nf, row.cte]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    )
  }, [query, rows])

  async function createStay(event: FormEvent) {
    event.preventDefault()
    if (!profile?.filial_id) {
      setError('Seu usuário precisa estar vinculado a uma filial.')
      return
    }

    const { error: insertError } = await supabase.from('estadias').insert({
      filial_id: profile.filial_id,
      placa: normalizePlate(form.placa),
      tipo: form.tipo,
      status: form.status,
      prioridade: form.prioridade,
      controle: form.controle || null,
      lote: form.lote || null,
      nf: form.nf || null,
      cte: form.cte || null,
      observacao: form.observacao || null,
      created_by: profile.id,
      updated_by: profile.id,
    })

    if (insertError) {
      setError('Não foi possível salvar. Verifique os campos e as permissões.')
      return
    }
    setForm(initialForm)
    setOpenForm(false)
    await load()
  }

  return (
    <>
      <PageHeader
        eyebrow="CONTROLE DE ESTADIA"
        title="Estadias"
        description="Registre, acompanhe e finalize sem perder o histórico."
        action={
          <button className="primary-button compact-button" onClick={() => setOpenForm((value) => !value)}>
            <Plus size={17} /> Nova estadia
          </button>
        }
      />

      {openForm && (
        <Panel className="form-panel">
          <form className="record-form" onSubmit={createStay}>
            <label>Placa<input value={form.placa} onChange={(e) => setForm({ ...form, placa: normalizePlate(e.target.value) })} required /></label>
            <label>Tipo<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Estadia['tipo'] })}><option value="a_lancar">A lançar</option><option value="lancada">Lançada</option></select></label>
            <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Estadia['status'] })}><option value="pendente">Pendente</option><option value="nao_saiu">Não saiu</option><option value="saiu">Saiu</option><option value="finalizado">Finalizado</option></select></label>
            <label>Prioridade<select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as Estadia['prioridade'] })}><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
            <label>Controle<input value={form.controle} onChange={(e) => setForm({ ...form, controle: e.target.value })} /></label>
            <label>Lote<input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} /></label>
            <label>NF<input value={form.nf} onChange={(e) => setForm({ ...form, nf: e.target.value })} /></label>
            <label>CT-e<input value={form.cte} onChange={(e) => setForm({ ...form, cte: e.target.value })} /></label>
            <label className="span-2">Observação<textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></label>
            <div className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setOpenForm(false)}>Cancelar</button><button className="primary-button" type="submit">Salvar estadia</button></div>
          </form>
        </Panel>
      )}

      {error && <InlineError message={error} />}

      <Panel>
        <div className="table-toolbar">
          <div className="table-search"><Search size={17} /><input placeholder="Buscar placa, lote, NF ou CT-e" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <button className="secondary-button compact-button" onClick={() => void load()}><RefreshCw size={16} /> Atualizar</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Status</th><th>Placa</th><th>Tipo</th><th>Controle</th><th>Lote</th><th>NF / CT-e</th><th>Atualização</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td><StatusBadge value={row.status} /></td>
                  <td><strong>{row.placa}</strong></td>
                  <td>{row.tipo === 'a_lancar' ? 'A lançar' : 'Lançada'}</td>
                  <td>{row.controle || '—'}</td>
                  <td>{row.lote || '—'}</td>
                  <td>{[row.nf, row.cte].filter(Boolean).join(' / ') || '—'}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <EmptyState title="Nenhuma estadia encontrada" description="Cadastre a primeira estadia ou ajuste a busca." />}
          {loading && <div className="table-loading">Carregando estadias…</div>}
        </div>
      </Panel>
    </>
  )
}

