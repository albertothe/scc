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
