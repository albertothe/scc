import * as XLSX from "xlsx"

// Função para exportar o modelo de planilha para produtos fora
export const exportarModeloPlanilha = () => {
    // Criar uma planilha com apenas o cabeçalho
    const data = [{ codproduto: "" }]
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos")

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(workbook, "modelo_importacao_produtos.xlsx")
}

// Função para exportar produtos existentes
export const exportarProdutos = (produtos: { codproduto: string; produto: string }[]) => {
    // Criar uma planilha com os dados
    const worksheet = XLSX.utils.json_to_sheet(produtos)

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos")

    // Gerar o arquivo e fazer o download
    const dataAtual = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `produtos_exportados_${dataAtual}.xlsx`)
}

// Função para exportar modelo de planilha para promoções
export const exportarModeloPromocao = () => {
    // Criar uma planilha com exemplo de dados
    const hoje = new Date()
    const dataFutura = new Date(hoje)
    dataFutura.setDate(hoje.getDate() + 30) // Data atual + 30 dias

    const data = [
        {
            codproduto: "00001",
            codloja: "01",
            tabela: "01",
            valor_promocao: 10.99,
            data_validade: dataFutura,
        },
        {
            codproduto: "00002",
            codloja: "01",
            tabela: "01",
            valor_promocao: 15.5,
            data_validade: dataFutura,
        },
    ]

    const worksheet = XLSX.utils.json_to_sheet(data)

    // Configurar formatação para a coluna de data
    const dataValidade = XLSX.utils.encode_cell({ r: 0, c: 4 }) // Coluna E, linha 1 (cabeçalho)
    if (worksheet[dataValidade]) {
        worksheet[dataValidade].z = "dd/mm/yyyy"
    }

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Promoções")

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(workbook, "modelo_importacao_promocoes.xlsx")
}

// Função para exportar metas de vendedores para Excel
export const exportarMetasVendedores = (metas: any[], competencia: string) => {
    // Formatar os dados para exportação
    const dadosExportacao = metas.map((meta) => ({
        Código: meta.codvendedor,
        Vendedor: meta.vendedor || meta.nome_completo || "",
        Loja: meta.codloja || "",
        "Em Férias": meta.ferias ? "Sim" : "Não",
        "Base Salarial": meta.base_salarial,
        "Meta Faturamento": meta.meta_faturamento,
        "Meta Lucro (%)": meta.meta_lucra,
        "Faturamento Mínimo": meta.faturamento_minimo,
        "Inc. Fat. 90%": meta.incfat90,
        "Inc. Fat. 100%": meta.incfat100,
        "Inc. Lucro 90%": meta.incluc90,
        "Inc. Lucro 100%": meta.incluc100,
    }))

    // Criar uma planilha com os dados
    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao)

    // Ajustar largura das colunas
    const wscols = [
        { wch: 10 }, // Código
        { wch: 25 }, // Vendedor
        { wch: 8 }, // Loja
        { wch: 10 }, // Em Férias
        { wch: 15 }, // Base Salarial
        { wch: 15 }, // Meta Faturamento
        { wch: 15 }, // Meta Lucro
        { wch: 15 }, // Faturamento Mínimo
        { wch: 15 }, // Inc. Fat. 90%
        { wch: 15 }, // Inc. Fat. 100%
        { wch: 15 }, // Inc. Lucro 90%
        { wch: 15 }, // Inc. Lucro 100%
    ]
    worksheet["!cols"] = wscols

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Metas")

    // Formatar a competência para o nome do arquivo
    const [ano, mes] = competencia.split("-")
    const competenciaFormatada = `${mes}_${ano}`

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(workbook, `metas_vendedores_${competenciaFormatada}.xlsx`)
}

// Função para exportar modelo de planilha para importação de metas
export const exportarModeloMetasVendedores = (vendedores: any[], competencia: string) => {
    // Criar dados de exemplo para o modelo
    const dadosModelo = vendedores.map((vendedor) => ({
        codvendedor: vendedor.codvendedor,
        vendedor: vendedor.vendedor || "",
        codloja: vendedor.codloja || "",
        ferias: false,
        base_salarial: 0,
        meta_faturamento: 0,
        meta_lucra: 0,
        faturamento_minimo: 0,
        incfat90: 0,
        incfat100: 0,
        incluc90: 0,
        incluc100: 0,
        competencia: competencia,
    }))

    // Criar uma planilha com os dados
    const worksheet = XLSX.utils.json_to_sheet(dadosModelo)

    // Ajustar largura das colunas
    const wscols = [
        { wch: 12 }, // codvendedor
        { wch: 25 }, // vendedor
        { wch: 8 }, // codloja
        { wch: 8 }, // ferias
        { wch: 15 }, // base_salarial
        { wch: 15 }, // meta_faturamento
        { wch: 15 }, // meta_lucra
        { wch: 15 }, // faturamento_minimo
        { wch: 15 }, // incfat90
        { wch: 15 }, // incfat100
        { wch: 15 }, // incluc90
        { wch: 15 }, // incluc100
        { wch: 15 }, // competencia
    ]
    worksheet["!cols"] = wscols

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo_Metas")

    // Formatar a competência para o nome do arquivo
    const [ano, mes] = competencia.split("-")
    const competenciaFormatada = `${mes}_${ano}`

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(workbook, `modelo_importacao_metas_${competenciaFormatada}.xlsx`)
}

// Função genérica para exportar dados para Excel
export const exportarParaExcel = (dados: any[], nomeArquivo: string) => {
    // Criar uma planilha com os dados
    const worksheet = XLSX.utils.json_to_sheet(dados)

    // Criar um workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados")

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(workbook, nomeArquivo)
}
