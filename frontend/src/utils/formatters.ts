export const formatarData = (data: string): string => {
    if (!data) return ""
    const date = new Date(data)
    return date.toLocaleDateString("pt-BR")
}

export const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    })
}

export const formatarDataHora = (data: string): string => {
    if (!data) return ""
    const date = new Date(data)
    return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR")
}
