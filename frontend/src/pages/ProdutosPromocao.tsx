"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Grid,
    Snackbar,
    Alert,
    Box,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import FileUploadIcon from "@mui/icons-material/FileUpload"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import FiltroBusca from "../components/FiltroBusca"
import FiltroSelect from "../components/FiltroSelect"
import FiltroDataIntervalo from "../components/FiltroDataIntervalo"
import Paginacao from "../components/Paginacao"
import ContadorItens from "../components/ContadorItens"
import SeletorColunas, { type ColunasConfig } from "../components/SeletorColunas"
import ImportacaoPromocao from "../components/ImportacaoPromocao"
import { getProdutosPromocao, importarProdutosPromocao } from "../services/promocaoService"
import { exportarModeloPromocao } from "../services/excelService"
import type { ProdutoPromocao } from "../types"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

const ProdutosPromocao: React.FC = () => {
    const [produtos, setProdutos] = useState<ProdutoPromocao[]>([])
    const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoPromocao[]>([])
    const [produtosPaginados, setProdutosPaginados] = useState<ProdutoPromocao[]>([])
    const [termoBusca, setTermoBusca] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

    // Estados para os filtros
    const [filtroFornecedor, setFiltroFornecedor] = useState("")
    const [filtroCategoria, setFiltroCategoria] = useState("")
    const [filtroSubcategoria, setFiltroSubcategoria] = useState("")
    const [filtroLoja, setFiltroLoja] = useState("")

    // Novo estado para filtro de data de validade
    const [filtroDataInicio, setFiltroDataInicio] = useState<Date | null>(null)
    const [filtroDataFim, setFiltroDataFim] = useState<Date | null>(null)

    // Listas de valores para os filtros
    const [fornecedores, setFornecedores] = useState<string[]>([])
    const [categorias, setCategorias] = useState<string[]>([])
    const [subcategorias, setSubcategorias] = useState<string[]>([])
    const [lojas, setLojas] = useState<string[]>([])

    // Estado para o menu de opções
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
    const menuOpen = Boolean(menuAnchorEl)

    // Estado para o modal de importação
    const [openImportacao, setOpenImportacao] = useState(false)

    // Estado para paginação
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Configuração de colunas
    const [colunas, setColunas] = useState<ColunasConfig[]>([
        { id: "codproduto", label: "Código", visible: true, required: true },
        { id: "produto", label: "Produto", visible: true, required: true },
        { id: "unidade", label: "Unidade", visible: true },
        { id: "fornecedor", label: "Fornecedor", visible: true },
        { id: "categoria", label: "Categoria", visible: true },
        { id: "subcategoria", label: "Subcategoria", visible: true },
        { id: "codloja", label: "Loja", visible: true },
        { id: "valor_promocao", label: "Valor Promoção", visible: true },
        { id: "data_validade", label: "Validade", visible: true },
        { id: "data_inclusao", label: "Data Inclusão", visible: true },
        { id: "codusuario", label: "Usuário", visible: true },
    ])

    // Função para atualizar os produtos paginados
    const atualizarPaginacao = useCallback(
        (items: ProdutoPromocao[], currentPage: number) => {
            const startIndex = (currentPage - 1) * rowsPerPage
            const endIndex = startIndex + rowsPerPage
            setProdutosPaginados(items.slice(startIndex, endIndex))
            setPage(currentPage)
        },
        [rowsPerPage],
    )

    // Função para extrair valores únicos de um campo
    const extrairValoresUnicos = useCallback((produtos: ProdutoPromocao[], campo: string): string[] => {
        const valores = produtos
            .map((produto) => produto[campo as keyof ProdutoPromocao] as string)
            .filter((valor): valor is string => !!valor && valor !== "-" && valor !== "")

        // Remover duplicatas e ordenar
        return Array.from(new Set(valores)).sort()
    }, [])

    // Função para carregar produtos
    const carregarProdutos = useCallback(async () => {
        if (loading) return // Evitar múltiplas chamadas simultâneas

        setLoading(true)
        setError(null)

        try {
            const resultado = await getProdutosPromocao()
            console.log(`Produtos em promoção carregados: ${resultado.length}`)

            // Log para debug
            if (resultado.length > 0) {
                console.log("Exemplo de produto:", resultado[0])
            }

            setProdutos(resultado)

            // Extrair valores únicos para os filtros
            const fornecedoresUnicos = extrairValoresUnicos(resultado, "fornecedor")
            const categoriasUnicas = extrairValoresUnicos(resultado, "categoria")
            const subcategoriasUnicas = extrairValoresUnicos(resultado, "subcategoria")
            const lojasUnicas = extrairValoresUnicos(resultado, "codloja")

            setFornecedores(fornecedoresUnicos)
            setCategorias(categoriasUnicas)
            setSubcategorias(subcategoriasUnicas)
            setLojas(lojasUnicas)

            // Aplicar filtros
            aplicarFiltros(resultado)
        } catch (err) {
            console.error("Erro ao carregar produtos em promoção:", err)
            setError("Falha ao carregar produtos. Por favor, tente novamente.")
            setProdutos([])
            setProdutosFiltrados([])
            setProdutosPaginados([])

            setSnackbar({
                open: true,
                message: "Erro ao carregar produtos. Verifique a conexão com o servidor.",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [extrairValoresUnicos])

    // Função para aplicar todos os filtros
    const aplicarFiltros = useCallback(
        (produtosBase: ProdutoPromocao[] = produtos) => {
            let filtrados = [...produtosBase]

            // Aplicar filtro de busca
            if (termoBusca) {
                const termoLowerCase = termoBusca.toLowerCase()
                filtrados = filtrados.filter(
                    (produto) =>
                        produto.codproduto.toLowerCase().includes(termoLowerCase) ||
                        (produto.produto && produto.produto.toLowerCase().includes(termoLowerCase)),
                )
            }

            // Aplicar filtro de fornecedor
            if (filtroFornecedor) {
                filtrados = filtrados.filter((produto) => produto.fornecedor === filtroFornecedor)
            }

            // Aplicar filtro de categoria
            if (filtroCategoria) {
                filtrados = filtrados.filter((produto) => produto.categoria === filtroCategoria)
            }

            // Aplicar filtro de subcategoria
            if (filtroSubcategoria) {
                filtrados = filtrados.filter((produto) => produto.subcategoria === filtroSubcategoria)
            }

            // Aplicar filtro de loja
            if (filtroLoja) {
                filtrados = filtrados.filter((produto) => produto.codloja === filtroLoja)
            }

            // Aplicar filtro de data de validade
            if (filtroDataInicio || filtroDataFim) {
                filtrados = filtrados.filter((produto) => {
                    // Converter a data de validade para um objeto Date
                    let dataValidade: Date

                    if (produto.data_validade instanceof Date) {
                        dataValidade = produto.data_validade
                    } else if (typeof produto.data_validade === "string") {
                        try {
                            dataValidade = parseISO(produto.data_validade)
                        } catch (error) {
                            console.error("Erro ao converter data:", error)
                            return false
                        }
                    } else {
                        return false
                    }

                    // Verificar se está dentro do intervalo
                    if (filtroDataInicio && filtroDataFim) {
                        return isAfter(dataValidade, filtroDataInicio) && isBefore(dataValidade, filtroDataFim)
                    } else if (filtroDataInicio) {
                        return isAfter(dataValidade, filtroDataInicio)
                    } else if (filtroDataFim) {
                        return isBefore(dataValidade, filtroDataFim)
                    }

                    return true
                })
            }

            setProdutosFiltrados(filtrados)
            atualizarPaginacao(filtrados, 1) // Resetar para a primeira página ao filtrar
        },
        [
            termoBusca,
            filtroFornecedor,
            filtroCategoria,
            filtroSubcategoria,
            filtroLoja,
            filtroDataInicio,
            filtroDataFim,
            produtos,
            atualizarPaginacao,
        ],
    )

    // Efeito para carregar produtos quando o componente montar
    useEffect(() => {
        carregarProdutos()
    }, [carregarProdutos])

    // Efeito para aplicar filtros quando qualquer filtro mudar
    useEffect(() => {
        aplicarFiltros()
    }, [
        termoBusca,
        filtroFornecedor,
        filtroCategoria,
        filtroSubcategoria,
        filtroLoja,
        filtroDataInicio,
        filtroDataFim,
        aplicarFiltros,
    ])

    // Atualizar paginação quando mudar a página ou itens por página
    useEffect(() => {
        atualizarPaginacao(produtosFiltrados, page)
    }, [page, rowsPerPage, produtosFiltrados, atualizarPaginacao])

    const handleBuscar = (termo: string) => {
        setTermoBusca(termo)
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage)
        setPage(1) // Resetar para a primeira página ao mudar itens por página
    }

    // Função para tentar novamente em caso de erro
    const handleTentarNovamente = () => {
        carregarProdutos()
    }

    // Função para atualizar configuração de colunas
    const handleColunasChange = (novasColunas: ColunasConfig[]) => {
        setColunas(novasColunas)
    }

    // Funções para o menu de opções
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setMenuAnchorEl(null)
    }

    // Exportar modelo de planilha para promoções
    const handleExportarModelo = () => {
        exportarModeloPromocao()
        handleMenuClose()
    }

    // Abrir modal de importação
    const handleAbrirImportacao = () => {
        setOpenImportacao(true)
        handleMenuClose()
    }

    // Função para importar produtos em promoção
    const handleImportarProdutos = async (
        produtos: {
            codproduto: string
            codloja: string
            tabela: string
            valor_promocao: number
            data_validade: string
        }[],
    ) => {
        try {
            const resultado = await importarProdutosPromocao(produtos)

            // Se houver produtos importados com sucesso, recarregar a lista
            if (resultado.success.length > 0) {
                await carregarProdutos()
            }

            return resultado
        } catch (error) {
            console.error("Erro ao importar produtos em promoção:", error)
            throw error
        }
    }

    // Função para formatar data
    const formatarData = (data: Date | string | null | undefined): string => {
        if (!data) return "-"
        try {
            if (typeof data === "string") {
                return format(new Date(data), "dd/MM/yyyy", { locale: ptBR })
            }
            return format(data, "dd/MM/yyyy", { locale: ptBR })
        } catch (error) {
            console.error("Erro ao formatar data:", error)
            return String(data)
        }
    }

    // Função para formatar valor
    const formatarValor = (valor: number | null | undefined): string => {
        if (valor === null || valor === undefined) {
            return "R$ 0,00"
        }
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    // Função para contar produtos distintos
    const contarProdutosDistintos = (produtos: ProdutoPromocao[]): number => {
        const produtosUnicos = new Set(produtos.map((p) => p.codproduto))
        return produtosUnicos.size
    }

    // Função para lidar com o filtro de data
    const handleFiltrarPorData = (dataInicio: Date | null, dataFim: Date | null) => {
        setFiltroDataInicio(dataInicio)
        setFiltroDataFim(dataFim)
    }

    return (
        <Container maxWidth="lg" style={{ marginTop: 24, marginBottom: 24 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Produtos em Promoção
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                    <ContadorItens
                        quantidade={contarProdutosDistintos(produtosFiltrados)}
                        label="produtos distintos encontrados"
                    />
                </Grid>
                <Grid item xs={12} md={3} style={{ textAlign: "right" }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<MoreVertIcon />}
                        onClick={handleMenuClick}
                        fullWidth
                        aria-controls={menuOpen ? "opcoes-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? "true" : undefined}
                    >
                        Opções
                    </Button>
                    <Menu
                        id="opcoes-menu"
                        anchorEl={menuAnchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        MenuListProps={{
                            "aria-labelledby": "opcoes-button",
                        }}
                    >
                        <MenuItem onClick={handleExportarModelo}>
                            <ListItemIcon>
                                <FileDownloadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Exportar Modelo de Planilha</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleAbrirImportacao}>
                            <ListItemIcon>
                                <FileUploadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Importar Planilha</ListItemText>
                        </MenuItem>
                    </Menu>
                </Grid>
                <Grid item xs={12} md={3} style={{ textAlign: "right" }}>
                    <Button variant="contained" color="primary" onClick={carregarProdutos} disabled={loading} fullWidth>
                        {loading ? "Carregando..." : "Atualizar"}
                    </Button>
                </Grid>
            </Grid>

            <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
                <FiltroBusca onBuscar={handleBuscar} placeholder="Buscar por código ou nome do produto..." />

                {/* Filtros de seleção */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={3}>
                        <FiltroSelect label="Loja" valor={filtroLoja} opcoes={lojas} onChange={setFiltroLoja} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FiltroSelect
                            label="Fornecedor"
                            valor={filtroFornecedor}
                            opcoes={fornecedores}
                            onChange={setFiltroFornecedor}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FiltroSelect label="Categoria" valor={filtroCategoria} opcoes={categorias} onChange={setFiltroCategoria} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FiltroSelect
                            label="Subcategoria"
                            valor={filtroSubcategoria}
                            opcoes={subcategorias}
                            onChange={setFiltroSubcategoria}
                        />
                    </Grid>
                </Grid>

                {/* Novo filtro de data de validade */}
                <Paper elevation={1} sx={{ p: 2, mt: 2, mb: 2, bgcolor: "background.default" }}>
                    <FiltroDataIntervalo onFiltrar={handleFiltrarPorData} />
                </Paper>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                        <CircularProgress />
                    </div>
                ) : error ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                        <Typography color="error" paragraph>
                            {error}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleTentarNovamente}>
                            Tentar Novamente
                        </Button>
                    </div>
                ) : (
                    <>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, mt: 2 }}>
                            <SeletorColunas colunas={colunas} onChange={handleColunasChange} storageKey="produtos-promocao-colunas" />
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {colunas.find((c) => c.id === "codproduto")?.visible && <TableCell>Código</TableCell>}
                                        {colunas.find((c) => c.id === "produto")?.visible && <TableCell>Produto</TableCell>}
                                        {colunas.find((c) => c.id === "unidade")?.visible && <TableCell>Unidade</TableCell>}
                                        {colunas.find((c) => c.id === "fornecedor")?.visible && <TableCell>Fornecedor</TableCell>}
                                        {colunas.find((c) => c.id === "categoria")?.visible && <TableCell>Categoria</TableCell>}
                                        {colunas.find((c) => c.id === "subcategoria")?.visible && <TableCell>Subcategoria</TableCell>}
                                        {colunas.find((c) => c.id === "codloja")?.visible && <TableCell>Loja</TableCell>}
                                        {colunas.find((c) => c.id === "valor_promocao")?.visible && <TableCell>Valor Promoção</TableCell>}
                                        {colunas.find((c) => c.id === "data_validade")?.visible && <TableCell>Validade</TableCell>}
                                        {colunas.find((c) => c.id === "data_inclusao")?.visible && <TableCell>Data Inclusão</TableCell>}
                                        {colunas.find((c) => c.id === "codusuario")?.visible && <TableCell>Usuário</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {produtosPaginados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={colunas.filter((c) => c.visible).length} align="center">
                                                Nenhum produto em promoção encontrado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        produtosPaginados.map((produto, index) => (
                                            <TableRow key={`${produto.codproduto}-${produto.codloja}-${produto.tabela}-${index}`}>
                                                {colunas.find((c) => c.id === "codproduto")?.visible && (
                                                    <TableCell>{produto.codproduto}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "produto")?.visible && (
                                                    <TableCell>{produto.produto || "-"}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "unidade")?.visible && (
                                                    <TableCell>{produto.unidade || "-"}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "fornecedor")?.visible && (
                                                    <TableCell>{produto.fornecedor || "-"}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "categoria")?.visible && (
                                                    <TableCell>{produto.categoria || "-"}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "subcategoria")?.visible && (
                                                    <TableCell>{produto.subcategoria || "-"}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "codloja")?.visible && <TableCell>{produto.codloja}</TableCell>}
                                                {colunas.find((c) => c.id === "valor_promocao")?.visible && (
                                                    <TableCell>{formatarValor(produto.valor_promocao)}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "data_validade")?.visible && (
                                                    <TableCell>{formatarData(produto.data_validade)}</TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "data_inclusao")?.visible && (
                                                    <TableCell>
                                                        {formatarData(produto.data_inclusao)} {produto.hora_inclusao}
                                                    </TableCell>
                                                )}
                                                {colunas.find((c) => c.id === "codusuario")?.visible && (
                                                    <TableCell>{produto.codusuario}</TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {produtosFiltrados.length > 0 && (
                            <Paginacao
                                count={produtosFiltrados.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={handlePageChange}
                                onRowsPerPageChange={handleRowsPerPageChange}
                            />
                        )}
                    </>
                )}
            </Paper>

            <ImportacaoPromocao
                open={openImportacao}
                onClose={() => setOpenImportacao(false)}
                onImport={handleImportarProdutos}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    )
}

export default ProdutosPromocao
