export interface Chamado {
  id?: number
  titulo: string
  descricao?: string
  tipo: "INCIDENTE" | "REQUISICAO"
  status?: "ABERTO" | "EM ANDAMENTO" | "RESOLVIDO" | "FECHADO"
  prioridade: "BAIXO" | "MÉDIO" | "ALTA" | "URGENTE"
  loja?: string | null
  setor: string
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
  tipo?: "COMENTARIO" | "INTERNO" | "STATUS"
  status_novo?: "ABERTO" | "EM ANDAMENTO" | "RESOLVIDO" | "FECHADO" | null
  responsavel?: "ALBERTO" | "WALLYSON" | null
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
