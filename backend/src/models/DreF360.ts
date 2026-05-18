export interface DreF360Registro {
  sequencial: string
  descricao: string
  subdescricao: string | null
  detalhamento: string | null
  codloja: string
  ano: number
  mes: number
  realizado: number | null
  orcado: number | null
  rlr: number | null
  rlo: number | null
}

export interface DreF360Filtros {
  ano?: number
  mes?: number
  codloja?: string
  descricao?: string
}

export interface AtualizarDreF360Input {
  realizado: number | null
  orcado: number | null
}
