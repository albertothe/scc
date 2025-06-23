export interface Produto {
  codproduto: string
  produto: string
  unidade: string
  dtcadastro: Date
  codbarra: string
  referencia: string
  codncm: string
  ativo: string
  especie: string
  status: string
}

export interface ProdutoEtiqueta {
  codproduto: string
  mes_ano: Date
  etiqueta: string
}

export interface ProdutoFora {
  codproduto: string
  mes_ano: Date
}

// Nova interface para Produtos Promoção
export interface ProdutoPromocao {
  codproduto: string
  codloja: string
  tabela: string
  valor_promocao: number
  data_validade: Date
  data_inclusao: Date
  hora_inclusao: string
  codusuario: string
  // Campos adicionais da view vs_pwb_dprodutos
  produto?: string
  unidade?: string
  status?: string
}
