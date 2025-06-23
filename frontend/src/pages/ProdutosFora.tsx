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
  Button,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import FileDownloadIcon from "@mui/icons-material/FileDownload"
import FileUploadIcon from "@mui/icons-material/FileUpload"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import FiltroCompetencia from "../components/FiltroCompetencia"
import MesAtualIndicator from "../components/MesAtualIndicator"
import ContadorItens from "../components/ContadorItens"
import FiltroBusca from "../components/FiltroBusca"
import FiltroSelect from "../components/FiltroSelect"
import BuscaProduto from "../components/BuscaProduto"
import ConfirmacaoExclusao from "../components/ConfirmacaoExclusao"
import Paginacao from "../components/Paginacao"
import ImportacaoPlanilha from "../components/ImportacaoPlanilha"
import SeletorColunas, { type ColunasConfig } from "../components/SeletorColunas"
import { getProdutos, adicionarProdutoFora, removerProdutoFora, importarProdutosFora } from "../services/produtoService"
import { exportarModeloPlanilha, exportarProdutos } from "../services/excelService"
import type { Produto } from "../types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const ProdutosFora: React.FC = () => {
  // Inicializar com maio de 2025 como padrão
  const dataPadrao = new Date(2025, 4, 1) // Maio é mês 4 (0-indexed)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([])
  const [produtosPaginados, setProdutosPaginados] = useState<Produto[]>([])
  const [mesAno, setMesAno] = useState<string>(format(dataPadrao, "yyyy-MM-dd"))
  const [dataCompetencia, setDataCompetencia] = useState<Date>(dataPadrao)
  const [termoBusca, setTermoBusca] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openBusca, setOpenBusca] = useState(false)
  const [openImportacao, setOpenImportacao] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

  // Novos estados para os filtros adicionais
  const [filtroFornecedor, setFiltroFornecedor] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("")
  const [fornecedores, setFornecedores] = useState<string[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [subcategorias, setSubcategorias] = useState<string[]>([])

  // Estado para o menu de opções
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchorEl)

  // Estado para paginação
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Estado para o modal de confirmação de exclusão
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState({
    open: false,
    produtoId: "",
    produtoNome: "",
  })

  // Configuração de colunas
  const [colunas, setColunas] = useState<ColunasConfig[]>([
    { id: "codproduto", label: "Código", visible: true, required: true },
    { id: "produto", label: "Produto", visible: true, required: true },
    { id: "unidade", label: "Unidade", visible: true },
    { id: "fornecedor", label: "Fornecedor", visible: true },
    { id: "categoria", label: "Categoria", visible: true },
    { id: "subcategoria", label: "Subcategoria", visible: true },
    { id: "competencia", label: "Competência", visible: true },
    { id: "status", label: "Status", visible: true },
  ])

  // Função para atualizar os produtos paginados
  const atualizarPaginacao = useCallback(
    (items: Produto[], currentPage: number) => {
      const startIndex = (currentPage - 1) * rowsPerPage
      const endIndex = startIndex + rowsPerPage
      setProdutosPaginados(items.slice(startIndex, endIndex))
      setPage(currentPage)
    },
    [rowsPerPage],
  )

  // Função para extrair valores únicos de um campo
  const extrairValoresUnicos = useCallback((produtos: Produto[], campo: keyof Produto): string[] => {
    const valores = produtos.map((produto) => produto[campo] as string).filter((valor): valor is string => !!valor)

    // Remover duplicatas e ordenar
    return Array.from(new Set(valores)).sort()
  }, [])

  // Função para carregar produtos com tratamento de erros aprimorado
  const carregarProdutos = useCallback(async () => {
    if (loading) return // Evitar múltiplas chamadas simultâneas

    setLoading(true)
    setError(null)

    try {
      console.log("ProdutosFora - Carregando produtos para:", mesAno)
      const resultado = await getProdutos(mesAno)
      console.log(`ProdutosFora - Produtos carregados: ${resultado.length}`)

      setProdutos(resultado)

      // Extrair valores únicos para os filtros
      setFornecedores(extrairValoresUnicos(resultado, "fornecedor"))
      setCategorias(extrairValoresUnicos(resultado, "categoria"))
      setSubcategorias(extrairValoresUnicos(resultado, "subcategoria"))

      // Aplicar filtros
      aplicarFiltros(resultado)
    } catch (err) {
      console.error("ProdutosFora - Erro ao carregar produtos:", err)
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
  }, [mesAno, extrairValoresUnicos])

  // Função para aplicar todos os filtros
  const aplicarFiltros = useCallback(
    (produtosBase: Produto[] = produtos) => {
      let filtrados = [...produtosBase]

      // Aplicar filtro de busca
      if (termoBusca) {
        const termoLowerCase = termoBusca.toLowerCase()
        filtrados = filtrados.filter(
          (produto) =>
            produto.codproduto.toLowerCase().includes(termoLowerCase) ||
            produto.produto.toLowerCase().includes(termoLowerCase),
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

      setProdutosFiltrados(filtrados)
      atualizarPaginacao(filtrados, 1) // Resetar para a primeira página ao filtrar
    },
    [termoBusca, filtroFornecedor, filtroCategoria, filtroSubcategoria, produtos, atualizarPaginacao],
  )

  // Efeito para carregar produtos quando o componente montar ou mesAno mudar
  useEffect(() => {
    carregarProdutos()
  }, [carregarProdutos])

  // Efeito para aplicar filtros quando qualquer filtro mudar
  useEffect(() => {
    aplicarFiltros()
  }, [termoBusca, filtroFornecedor, filtroCategoria, filtroSubcategoria, aplicarFiltros])

  // Atualizar paginação quando mudar a página ou itens por página
  useEffect(() => {
    atualizarPaginacao(produtosFiltrados, page)
  }, [page, rowsPerPage, produtosFiltrados, atualizarPaginacao])

  const handleFiltrar = (novoMesAno: string, novaDataCompetencia: Date) => {
    console.log("ProdutosFora - Filtro alterado para:", novoMesAno)
    console.log("ProdutosFora - Nova data competência:", novaDataCompetencia)
    console.log("ProdutosFora - Mês da nova data:", novaDataCompetencia.getMonth() + 1) // +1 porque getMonth() retorna 0-11

    setMesAno(novoMesAno)
    setDataCompetencia(novaDataCompetencia)
    setTermoBusca("") // Limpar busca ao mudar o mês
    setFiltroFornecedor("") // Limpar filtro de fornecedor
    setFiltroCategoria("") // Limpar filtro de categoria
    setFiltroSubcategoria("") // Limpar filtro de subcategoria
    setPage(1) // Resetar para a primeira página

    // Carregar produtos com o novo filtro
    setTimeout(() => {
      carregarProdutos()
    }, 0)
  }

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

  const handleAdicionarProduto = async (produto: Produto) => {
    try {
      // Verificar se o produto já existe na lista atual
      const produtoExistente = produtos.find((p) => p.codproduto === produto.codproduto)

      if (produtoExistente) {
        setSnackbar({
          open: true,
          message: `O produto ${produto.codproduto} - ${produto.produto} já existe nesta competência`,
          severity: "error",
        })
        setOpenBusca(false)
        return
      }

      await adicionarProdutoFora(produto.codproduto, mesAno)
      setSnackbar({
        open: true,
        message: "Produto adicionado com sucesso",
        severity: "success",
      })
      carregarProdutos()
    } catch (error) {
      console.error("ProdutosFora - Erro ao adicionar produto:", error)

      // Verificar se é um erro de produto duplicado
      const errorMessage = error instanceof Error ? error.message : "Erro ao adicionar produto"

      if (errorMessage.includes("já existe")) {
        setSnackbar({
          open: true,
          message: `O produto ${produto.codproduto} já existe nesta competência`,
          severity: "error",
        })
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
        })
      }
    }
    setOpenBusca(false)
  }

  // Abrir modal de confirmação de exclusão
  const handleConfirmarExclusao = (codproduto: string, nomeProduto: string) => {
    setConfirmacaoExclusao({
      open: true,
      produtoId: codproduto,
      produtoNome: nomeProduto,
    })
  }

  // Fechar modal de confirmação sem excluir
  const handleCancelarExclusao = () => {
    setConfirmacaoExclusao({
      open: false,
      produtoId: "",
      produtoNome: "",
    })
  }

  // Executar a exclusão após confirmação
  const handleRemoverProduto = async () => {
    try {
      await removerProdutoFora(confirmacaoExclusao.produtoId, mesAno)
      setSnackbar({
        open: true,
        message: "Produto removido com sucesso",
        severity: "success",
      })
      carregarProdutos()
    } catch (error) {
      console.error("ProdutosFora - Erro ao remover produto:", error)
      setSnackbar({
        open: true,
        message: "Erro ao remover produto",
        severity: "error",
      })
    }
    // Fechar o modal de confirmação
    setConfirmacaoExclusao({
      open: false,
      produtoId: "",
      produtoNome: "",
    })
  }

  // Funções para o menu de opções
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  // Exportar modelo de planilha
  const handleExportarModelo = () => {
    exportarModeloPlanilha()
    handleMenuClose()
  }

  // Exportar produtos atuais
  const handleExportarProdutos = () => {
    const produtosParaExportar = produtosFiltrados.map((p) => ({
      codproduto: p.codproduto,
      produto: p.produto,
      fornecedor: p.fornecedor || "",
      categoria: p.categoria || "",
      subcategoria: p.subcategoria || "",
    }))
    exportarProdutos(produtosParaExportar)
    handleMenuClose()
  }

  // Abrir modal de importação
  const handleAbrirImportacao = () => {
    console.log("ProdutosFora - Abrindo modal de importação com mesAno:", mesAno)
    console.log("ProdutosFora - Data atual de competência:", dataCompetencia)
    setOpenImportacao(true)
    handleMenuClose()
  }

  // Função para importar produtos
  const handleImportarProdutos = async (codigos: string[]) => {
    try {
      const resultado = await importarProdutosFora(codigos, mesAno)

      // Se houver produtos importados com sucesso, recarregar a lista
      if (resultado.success.length > 0) {
        await carregarProdutos()
      }

      return resultado
    } catch (error) {
      console.error("ProdutosFora - Erro ao importar produtos:", error)
      throw error
    }
  }

  // Função para tentar novamente em caso de erro
  const handleTentarNovamente = () => {
    carregarProdutos()
  }

  // Função para atualizar configuração de colunas
  const handleColunasChange = (novasColunas: ColunasConfig[]) => {
    setColunas(novasColunas)
  }

  const formatarData = (data: Date | string) => {
    if (typeof data === "string") {
      return data // Se já for uma string formatada, retorna como está
    }
    return format(data, "dd/MM/yyyy", { locale: ptBR })
  }

  return (
    <Container maxWidth="lg" style={{ marginTop: 24, marginBottom: 24 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Produtos Enco-Fora
      </Typography>

      <FiltroCompetencia onFiltrar={handleFiltrar} dataInicial={dataCompetencia} />

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <MesAtualIndicator dataCompetencia={dataCompetencia} />
        </Grid>
        <Grid item xs={12} md={6} style={{ textAlign: "right" }}>
          <ContadorItens quantidade={produtosFiltrados.length} />
        </Grid>
      </Grid>

      <Paper elevation={3} style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <FiltroBusca onBuscar={handleBuscar} placeholder="Buscar por código ou nome do produto..." />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenBusca(true)}
              fullWidth
            >
              Adicionar Produto
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
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
              <Divider />
              <MenuItem onClick={handleExportarProdutos} disabled={produtosFiltrados.length === 0}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exportar Produtos Atuais</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>

        {/* Novos filtros */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <FiltroSelect
              label="Fornecedor"
              valor={filtroFornecedor}
              opcoes={fornecedores}
              onChange={setFiltroFornecedor}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FiltroSelect label="Categoria" valor={filtroCategoria} opcoes={categorias} onChange={setFiltroCategoria} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FiltroSelect
              label="Subcategoria"
              valor={filtroSubcategoria}
              opcoes={subcategorias}
              onChange={setFiltroSubcategoria}
            />
          </Grid>
        </Grid>

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
              <SeletorColunas colunas={colunas} onChange={handleColunasChange} storageKey="produtos-fora-colunas" />
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
                    {colunas.find((c) => c.id === "competencia")?.visible && <TableCell>Competência</TableCell>}
                    {colunas.find((c) => c.id === "status")?.visible && <TableCell>Status</TableCell>}
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {produtosPaginados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={colunas.filter((c) => c.visible).length + 1} align="center">
                        Nenhum produto encontrado para esta competência
                      </TableCell>
                    </TableRow>
                  ) : (
                    produtosPaginados.map((produto) => (
                      <TableRow key={produto.codproduto}>
                        {colunas.find((c) => c.id === "codproduto")?.visible && (
                          <TableCell>{produto.codproduto}</TableCell>
                        )}
                        {colunas.find((c) => c.id === "produto")?.visible && <TableCell>{produto.produto}</TableCell>}
                        {colunas.find((c) => c.id === "unidade")?.visible && <TableCell>{produto.unidade}</TableCell>}
                        {colunas.find((c) => c.id === "fornecedor")?.visible && (
                          <TableCell>{produto.fornecedor || "-"}</TableCell>
                        )}
                        {colunas.find((c) => c.id === "categoria")?.visible && (
                          <TableCell>{produto.categoria || "-"}</TableCell>
                        )}
                        {colunas.find((c) => c.id === "subcategoria")?.visible && (
                          <TableCell>{produto.subcategoria || "-"}</TableCell>
                        )}
                        {colunas.find((c) => c.id === "competencia")?.visible && (
                          <TableCell>{produto.data_competencia || formatarData(dataCompetencia)}</TableCell>
                        )}
                        {colunas.find((c) => c.id === "status")?.visible && <TableCell>{produto.status}</TableCell>}
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleConfirmarExclusao(produto.codproduto, produto.produto)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
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

      <BuscaProduto
        open={openBusca}
        onClose={() => setOpenBusca(false)}
        onSelect={handleAdicionarProduto}
        title="Adicionar Produto Enco-Fora"
      />

      <ImportacaoPlanilha
        open={openImportacao}
        onClose={() => setOpenImportacao(false)}
        onImport={handleImportarProdutos}
        mesAno={mesAno} // Garantir que estamos usando o mesAno atual
      />

      <ConfirmacaoExclusao
        open={confirmacaoExclusao.open}
        onClose={handleCancelarExclusao}
        onConfirm={handleRemoverProduto}
        titulo="Confirmar Exclusão"
        mensagem="Tem certeza que deseja excluir o produto:"
        itemNome={confirmacaoExclusao.produtoNome}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default ProdutosFora
