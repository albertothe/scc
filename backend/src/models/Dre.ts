export interface DreRegistro {
  sequencial: number
  descricao: string
  subdescricao: string | null
  ano: number
  mes: number
  realizado: number | null
  orcado: number | null
}

export interface DreFiltros {
  ano?: number
  mes?: number
  descricao?: string
}

export interface AtualizarDreInput {
  realizado: number | null
  orcado: number | null
}
