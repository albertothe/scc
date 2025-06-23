export interface Vendedor {
    codvendedor: string
    codloja: string
    vendedor: string
    nome_completo: string
}

export interface VendedorMeta {
    codvendedor: string
    ferias: boolean
    competencia: string
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
