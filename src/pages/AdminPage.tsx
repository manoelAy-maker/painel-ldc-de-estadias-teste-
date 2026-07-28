import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { EmptyState, PageHeader, Panel, StatusBadge } from '../components/Ui'
import { supabase } from '../lib/supabase'

type AdminProfile = {
  id: string
  nome: string
  role: string
  ativo: boolean
  filiais: { nome: string } | null
}

export function AdminPage() {
  const { profile } = useAuth()
  const [profiles, setProfiles] = useState<AdminProfile[]>([])

  useEffect(() => {
    if (profile?.role !== 'admin') return
    supabase
      .from('profiles')
      .select('id, nome, role, ativo, filiais(nome)')
      .order('nome')
      .then(({ data }) => setProfiles((data as unknown as AdminProfile[] | null) ?? []))
  }, [profile?.role])

  if (profile?.role !== 'admin') return null

  return (
    <>
      <PageHeader eyebrow="GOVERNANÇA" title="Administração" description="Usuários, permissões e filiais sem compartilhar senhas." />
      <Panel title="Usuários cadastrados">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nome</th><th>Perfil</th><th>Filial</th><th>Situação</th></tr></thead>
            <tbody>{profiles.map((row) => <tr key={row.id}><td><strong>{row.nome}</strong></td><td>{row.role}</td><td>{row.filiais?.nome ?? 'Todas'}</td><td><StatusBadge value={row.ativo ? 'ativo' : 'bloqueado'} /></td></tr>)}</tbody>
          </table>
          {profiles.length === 0 && <EmptyState title="Nenhum perfil disponível" description="Crie os usuários no Supabase Auth e vincule-os a uma filial." />}
        </div>
      </Panel>
    </>
  )
}
