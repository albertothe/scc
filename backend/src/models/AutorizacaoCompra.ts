export interface AutorizacaoCompra {
    id?: number
    loja: string
    setor: string
    fornecedor: string
    valor: number
    observacao: string
    usuario: string
    data_criacao?: Date
    hora_criacao?: string
    autorizado_controladoria: boolean
    autorizado_diretoria: boolean
    data_autorizacao_controladoria?: Date
    data_autorizacao_diretoria?: Date
    usuario_controladoria?: string
    usuario_diretoria?: string
    liberada?: boolean
}
