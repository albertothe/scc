import api from "./api"
import type { Vendedor, VendedorMeta, VendedorMetaCompleta } from "../types"

// Flag para usar dados de teste - vamos desativar para usar dados reais
const USAR_DADOS_TESTE = false

// Obter todas as metas de vendedores
export const getMetas = async () => {
    const response = await api.get("/vendedor-metas")
    return response.data
}

// Obter todos os vendedores ativos
export const getVendedores = async (): Promise<Vendedor[]> => {
    try {
        console.log("Frontend: Buscando vendedores ativos...")

        // Se estiver usando dados de teste, retornar dados fixos
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Usando dados de teste para vendedores")

            // Dados de teste para vendedores
            const vendedoresTeste: Vendedor[] = [
                { codvendedor: "715", vendedor: "ATA.BRUNO ROCHA", nome_completo: "ATA.BRUNO ROCHA DE SOUSA", codloja: "01" },
                {
                    codvendedor: "467",
                    vendedor: "ATA.GILSOLANY",
                    nome_completo: "ATA.GILSOLANY DE ANDRADE NOBRE",
                    codloja: "01",
                },
                { codvendedor: "563", vendedor: "ATA.NOEL ROCHA", nome_completo: "ATA.NOEL ROCHA CARVALHO", codloja: "01" },
                {
                    codvendedor: "222",
                    vendedor: "ATA.TADEU FILHO",
                    nome_completo: "ATA.TADEU SOARES DA SILVA FILHO",
                    codloja: "01",
                },
                { codvendedor: "834", vendedor: "BIA.CAREN FERHA", nome_completo: "BIA.CAREN FERNANDA NUNES", codloja: "01" },
            ]

            console.log(`Frontend: Retornando ${vendedoresTeste.length} vendedores de teste`)
            return vendedoresTeste
        }

        const response = await api.get("/vendedor-metas/vendedores")
        console.log("Frontend: Resposta da API (vendedores):", response.data)

        // Verificar se a resposta é um array
        if (!Array.isArray(response.data)) {
            console.error("Frontend: Resposta não é um array:", response.data)
            return []
        }

        return response.data
    } catch (error: any) {
        console.error("Frontend: Erro ao buscar vendedores:", error)
        console.error("Frontend: Detalhes do erro:", error.response?.data || error.message)

        // Em caso de erro, retornar um array vazio para evitar erros no componente
        return []
    }
}

// Obter metas de vendedores por competência (mês/ano)
export const getMetasPorCompetencia = async (competencia: string): Promise<VendedorMetaCompleta[]> => {
    try {
        console.log(`Frontend: Buscando metas para competência ${competencia}...`)

        // Se estiver usando dados de teste, retornar dados fixos
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Usando dados de teste fixos para metas")

            // Dados de teste baseados na imagem que você compartilhou
            const dadosTeste: VendedorMetaCompleta[] = [
                {
                    codvendedor: "715",
                    vendedor: "ATA.BRUNO ROCHA",
                    nome_completo: "ATA.BRUNO ROCHA DE SOUSA",
                    codloja: "01",
                    ferias: false,
                    competencia: "2025-05-01",
                    base_salarial: 1518.0,
                    meta_faturamento: 130000.0,
                    meta_lucra: 0.04,
                    faturamento_minimo: 130000.0,
                    incfat90: 0.07,
                    incfat100: 0.1,
                    incluc90: 100.0,
                    incluc100: 200.0,
                },
                // Outros dados de teste...
            ]

            console.log(`Frontend: Retornando ${dadosTeste.length} metas de teste`)
            return dadosTeste
        }

        // Garantir que a competência esteja no formato correto (YYYY-MM-DD)
        let dataFormatada = competencia
        if (!competencia.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Se não estiver no formato correto, adicionar o dia 01
            dataFormatada = `${competencia}-01`
        }

        console.log(`Frontend: Competência formatada: ${dataFormatada}`)
        console.log(`Frontend: Enviando requisição para API: /vendedor-metas/competencia/${dataFormatada}`)

        const response = await api.get(`/vendedor-metas/competencia/${dataFormatada}`)

        console.log(`Frontend: Resposta da API (metas):`, response.data)
        console.log(`Frontend: Tipo dos dados:`, typeof response.data)
        console.log(`Frontend: É array?`, Array.isArray(response.data))

        // Garantir que a resposta seja um array
        if (response.data && !Array.isArray(response.data)) {
            console.warn("Frontend: Resposta não é um array, tentando converter...")
            try {
                // Tentar converter string JSON para objeto
                if (typeof response.data === "string") {
                    const parsedData = JSON.parse(response.data)
                    return Array.isArray(parsedData) ? parsedData : []
                }
                return []
            } catch (parseError) {
                console.error("Frontend: Erro ao converter resposta:", parseError)
                return []
            }
        }

        // Se não houver dados, retornar um array vazio em vez de null
        return Array.isArray(response.data) ? response.data : []
    } catch (error: any) {
        console.error(`Frontend: Erro ao buscar metas para competência ${competencia}:`, error)
        console.error("Frontend: Detalhes do erro:", error.response?.data || error.message)

        // Em caso de erro, retornar um array vazio para evitar erros no componente
        return []
    }
}

// Obter meta específica de um vendedor
export const getMeta = async (codvendedor: string, competencia: string): Promise<VendedorMetaCompleta> => {
    try {
        console.log(`Frontend: Buscando meta para vendedor ${codvendedor} na competência ${competencia}...`)

        // Se estiver usando dados de teste, retornar dados fixos
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Usando dados de teste fixos para vendedor específico")

            // Dados de teste para um vendedor específico
            const dadosTeste: VendedorMetaCompleta = {
                codvendedor: codvendedor,
                vendedor: "Vendedor Teste",
                nome_completo: "Vendedor Completo Teste",
                codloja: "01",
                ferias: false,
                competencia: competencia,
                base_salarial: 1500,
                meta_faturamento: 50000,
                meta_lucra: 0.05,
                faturamento_minimo: 30000,
                incfat90: 200,
                incfat100: 500,
                incluc90: 200,
                incluc100: 500,
            }

            return dadosTeste
        }

        // Garantir que a competência esteja no formato correto (YYYY-MM-DD)
        let dataFormatada = competencia
        if (!competencia.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Se não estiver no formato correto, adicionar o dia 01
            dataFormatada = `${competencia}-01`
        }

        const response = await api.get(`/vendedor-metas/${codvendedor}/${dataFormatada}`)
        console.log(`Frontend: Resposta da API (meta específica):`, response.data)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao buscar meta para vendedor ${codvendedor}:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Criar nova meta
export const criarMeta = async (meta: VendedorMeta): Promise<VendedorMetaCompleta> => {
    try {
        console.log(`Frontend: Criando meta para vendedor ${meta.codvendedor}...`, meta)

        // Se estiver usando dados de teste, simular uma resposta
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Simulando criação de meta com dados de teste")

            // Simular uma resposta de sucesso
            const respostaTeste: VendedorMetaCompleta = {
                ...meta,
                vendedor: "Vendedor Teste",
                nome_completo: "Vendedor Completo Teste",
                codloja: "01",
            }

            // Simular um atraso de rede
            await new Promise((resolve) => setTimeout(resolve, 500))

            return respostaTeste
        }

        const response = await api.post("/vendedor-metas", meta)
        console.log(`Frontend: Resposta da API (criar meta):`, response.data)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao criar meta para vendedor ${meta.codvendedor}:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Atualizar meta existente
export const atualizarMeta = async (meta: VendedorMeta): Promise<VendedorMetaCompleta> => {
    try {
        console.log(`Frontend: Atualizando meta para vendedor ${meta.codvendedor}...`, meta)

        // Se estiver usando dados de teste, simular uma resposta
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Simulando atualização de meta com dados de teste")

            // Simular uma resposta de sucesso
            const respostaTeste: VendedorMetaCompleta = {
                ...meta,
                vendedor: "Vendedor Teste",
                nome_completo: "Vendedor Completo Teste",
                codloja: "01",
            }

            // Simular um atraso de rede
            await new Promise((resolve) => setTimeout(resolve, 500))

            return respostaTeste
        }

        const response = await api.put(`/vendedor-metas/${meta.codvendedor}/${meta.competencia}`, meta)
        console.log(`Frontend: Resposta da API (atualizar meta):`, response.data)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao atualizar meta para vendedor ${meta.codvendedor}:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Excluir meta de vendedor
export const excluirMetaVendedor = async (codvendedor: string, competencia: string): Promise<void> => {
    try {
        console.log(`Frontend: Excluindo meta para vendedor ${codvendedor} na competência ${competencia}...`)

        // Se estiver usando dados de teste, simular uma exclusão
        if (USAR_DADOS_TESTE) {
            console.log(`Frontend: Simulando exclusão de meta para vendedor ${codvendedor}`)

            // Simular um atraso de rede
            await new Promise((resolve) => setTimeout(resolve, 500))

            return
        }

        // Garantir que a competência esteja no formato correto (YYYY-MM-DD)
        let dataFormatada = competencia
        if (!competencia.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Se não estiver no formato correto, adicionar o dia 01
            dataFormatada = `${competencia}-01`
        }

        const response = await api.delete(`/vendedor-metas/${codvendedor}/${dataFormatada}`)
        console.log(`Frontend: Meta excluída com sucesso`)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao excluir meta para vendedor ${codvendedor}:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Copiar metas de uma competência para outra
export const copiarMetas = async (
    competenciaOrigem: string,
    competenciaDestino: string,
): Promise<{ quantidade: number }> => {
    try {
        console.log(`Frontend: Copiando metas de ${competenciaOrigem} para ${competenciaDestino}...`)

        // Se estiver usando dados de teste, simular uma cópia
        if (USAR_DADOS_TESTE) {
            console.log(`Frontend: Simulando cópia de metas de ${competenciaOrigem} para ${competenciaDestino}`)

            // Simular um atraso de rede
            await new Promise((resolve) => setTimeout(resolve, 1000))

            return {
                quantidade: 3,
            }
        }

        // Garantir que as competências estejam no formato correto (YYYY-MM-DD)
        let origemFormatada = competenciaOrigem
        if (!competenciaOrigem.match(/^\d{4}-\d{2}-\d{2}$/)) {
            origemFormatada = `${competenciaOrigem}-01`
        }

        let destinoFormatada = competenciaDestino
        if (!competenciaDestino.match(/^\d{4}-\d{2}-\d{2}$/)) {
            destinoFormatada = `${competenciaDestino}-01`
        }

        const response = await api.post("/vendedor-metas/copiar", {
            competenciaOrigem: origemFormatada,
            competenciaDestino: destinoFormatada,
        })
        console.log(`Frontend: Resposta da API (copiar metas):`, response.data)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao copiar metas:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Importar metas em lote
export const importarMetas = async (
    metas: VendedorMeta[],
): Promise<{
    success: VendedorMeta[]
    errors: { meta: VendedorMeta; motivo: string }[]
}> => {
    try {
        console.log(`Frontend: Importando ${metas.length} metas...`)

        // Se estiver usando dados de teste, simular uma importação
        if (USAR_DADOS_TESTE) {
            console.log("Frontend: Simulando importação de metas com dados de teste")

            // Simular um atraso de rede
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Simular alguns sucessos e alguns erros
            const success = metas.slice(0, Math.floor(metas.length * 0.8))
            const errors = metas.slice(Math.floor(metas.length * 0.8)).map((meta) => ({
                meta,
                motivo: "Erro simulado para teste",
            }))

            return { success, errors }
        }

        // Garantir que todas as competências estejam no formato correto (YYYY-MM-DD)
        const metasFormatadas = metas.map((meta) => {
            const metaFormatada = { ...meta }
            if (!meta.competencia.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Se não estiver no formato correto, adicionar o dia 01
                metaFormatada.competencia = `${meta.competencia}-01`
            }
            return metaFormatada
        })

        const response = await api.post("/vendedor-metas/importar", { metas: metasFormatadas })
        console.log(`Frontend: Resposta da API (importar metas):`, response.data)
        return response.data
    } catch (error: any) {
        console.error(`Erro ao importar metas:`, error)
        console.error("Detalhes do erro:", error.response?.data || error.message)
        throw error
    }
}

// Aliases para manter compatibilidade com código existente
export const getMetaVendedor = getMeta
export const salvarMetaVendedor = async (meta: VendedorMeta): Promise<VendedorMetaCompleta> => {
    // Determinar se é uma criação ou atualização
    try {
        // Tentar buscar a meta existente
        await getMeta(meta.codvendedor, meta.competencia)
        // Se não lançar erro, é uma atualização
        return atualizarMeta(meta)
    } catch (error) {
        // Se lançar erro, é uma criação
        return criarMeta(meta)
    }
}

// Exportar todas as funções
export { getMetasPorCompetencia as getMetasByCompetencia, excluirMetaVendedor as deleteMeta, copiarMetas as copyMeta }
