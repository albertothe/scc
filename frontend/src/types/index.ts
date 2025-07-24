export interface Produto {
  codproduto: string
  produto: string
  unidade: string
  dtcadastro?: string
  codbarra?: string
  referencia?: string
  codncm?: string
  ativo?: string
  especie?: string
  status: string
  fornecedor?: string
  categoria?: string
  subcategoria?: string
  data_competencia?: string
  data_original?: Date
  etiqueta?: string
  bandeira?: string // Mantido para compatibilidade com código existente
}

export interface FiltroCompetencia {
  mesAno: string
}

export interface ProdutoPromocao {
  id?: number
  codproduto: string
  codloja: string
  tabela: string
  valor_promocao: number
  data_validade: Date | string
  data_inclusao?: Date | string
  hora_inclusao?: string
  codusuario?: string
  produto?: string
  unidade?: string
  status?: string
  fornecedor?: string
  categoria?: string
  subcategoria?: string
}

// Tipos existentes...

// Tipos para o módulo de Comissões
export interface ComissaoRange {
  id: number
  faixa_min: number
  faixa_max: number
  loja: string
}

export interface ComissaoPercentual {
  id: number
  id_range: number
  etiqueta: string
  percentual: number
}

export interface ComissaoRangeCompleta extends ComissaoRange {
  percentuais: ComissaoPercentual[]
}

// Tipos para o módulo de Vendedor Metas
export interface Vendedor {
  codvendedor: string
  codloja: string
  vendedor: string
  nome_completo: string
}

export interface VendedorMeta {
  codvendedor: string
  ferias: boolean
  competencia: string // formato ISO (YYYY-MM-DD)
  base_salarial: number
  meta_faturamento: number
  meta_lucra: number
  faturamento_minimo: number
  incfat90: number
  incfat100: number
  incluc90: number
  incluc100: number
}

export interface VendedorMetaCompleta extends VendedorMeta {
  vendedor?: string
  nome_completo?: string
  codloja?: string
}

// Tipos para o módulo de Comissões de Vendedores
export interface Loja {
  codloja: string
  loja: string
}

export interface ComissaoVendedor {
  id?: number
  codvendedor: string
  vendedor?: string
  nome_completo?: string
  codloja: string
  loja?: string
  percentual_base: number
  percentual_extra: number
  meta_mensal: number
  ativo: boolean
  data_inicio: string
  data_fim?: string
  observacoes?: string
}

// Tipos para o módulo de Autorização de Compra
export interface AutorizacaoCompra {
  id?: number
  loja: string
  setor: string
  fornecedor: string
  valor: number
  observacao: string
  usuario: string
  data_criacao?: string
  hora_criacao?: string
  autorizado_controladoria: boolean
  autorizado_diretoria: boolean
  data_autorizacao_controladoria?: string
  data_autorizacao_diretoria?: string
  usuario_controladoria?: string
  usuario_diretoria?: string
  liberada?: boolean
}

// Tipos para o módulo de Controle de Acesso
export interface Modulo {
  id: number
  nome: string
  rota: string
  icone?: string
  ordem?: number
  ativo: boolean
}

export interface NivelAcesso {
  codigo: string
  descricao: string
  ativo: boolean
}

export interface PermissaoNivel {
  codigo_nivel: string
  id_modulo: number
  visualizar: boolean
  incluir: boolean
  editar: boolean
  excluir: boolean
}
