export type UserRole = 'admin' | 'gestor' | 'operador' | 'visualizador'

export type Profile = {
  id: string
  nome: string
  role: UserRole
  filial_id: string | null
  ativo: boolean
  filiais?: {
    nome: string
    codigo: string
  } | null
}

export type Estadia = {
  id: string
  placa: string
  tipo: 'a_lancar' | 'lancada'
  status: 'pendente' | 'nao_saiu' | 'saiu' | 'finalizado'
  prioridade: 'normal' | 'alta' | 'urgente'
  controle: string | null
  chamado: string | null
  motorista: string | null
  transportadora: string | null
  lote: string | null
  nf: string | null
  cte: string | null
  peso_toneladas: number | null
  emissao_cte: string | null
  descarga_em: string | null
  tolerancia_horas: number
  periodo_diaria_horas: number
  valor_diaria: number | null
  fator: number | null
  valor_calculado: number | null
  pago_por: string | null
  observacao: string | null
  finalizado_at: string | null
  created_at: string
}

export type Embarque = {
  id: string
  placa: string
  motorista: string
  fabrica: string
  lote: string | null
  status: 'aguardando' | 'agendado' | 'carregado' | 'cancelado'
  agendado_para: string | null
  telefone: string | null
  created_at: string
}

export type Captacao = {
  id: string
  motorista: string
  telefone: string | null
  placa: string | null
  eixos: string | null
  destino: string | null
  empresa: string | null
  status: 'captado' | 'sem_retorno' | 'agendado' | 'carregou' | 'nao_carregou'
  lembrete_em: string | null
  observacao: string | null
  created_at: string
}
