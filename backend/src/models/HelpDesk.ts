export interface Chamado {
  id?: number
  titulo: string
  descricao?: string
  tipo: "incidente" | "requisicao"
  status?: "aberto" | "em_andamento" | "resolvido" | "fechado"
  prioridade: "baixa" | "media" | "alta" | "urgente"
  categoria?: string
  nome_usuario_abertura: string
  responsavel?: "ALBERTO" | "WALLYSON" | null
  data_abertura?: string
  data_atualizacao?: string | null
  data_fechamento?: string | null
}

export interface InteracaoChamado {
  id?: number
  id_chamado: number
  nome_usuario: string
  mensagem: string
  tipo?: "comentario" | "interno" | "status"
  status_novo?: "aberto" | "em_andamento" | "resolvido" | "fechado" | null
  data_criacao?: string
}

export interface ChamadoDetalhado extends Chamado {
  interacoes: InteracaoChamado[]
}

export interface Ativo {
  id?: number
  nome: string
  nome_pc?: string
  nome_estacao_erp?: string
  ip?: string
  tipo?: "computador" | "notebook" | "impressora" | string
  marca?: string
  modelo?: string
  numero_serie?: string
  status?: "ativo" | "manutencao" | "baixado"
  usuario_responsavel?: string
  localizacao?: string
  data_compra?: string | null
  valor?: number | null
  observacoes?: string
  data_criacao?: string
}
