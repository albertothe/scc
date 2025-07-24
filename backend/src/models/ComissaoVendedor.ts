export interface Vendedor {
    codvendedor: string
    codloja: string
    vendedor: string
    nome_completo: string
}

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
    created_at?: string
    updated_at?: string
}

export interface ComissaoVendedorCompleta extends ComissaoVendedor {
    vendedor: string
    nome_completo: string
    loja: string
}
