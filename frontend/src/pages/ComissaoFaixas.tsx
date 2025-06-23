"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Box,
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
    CircularProgress,
    Tooltip,
    Chip,
    Alert,
    Snackbar,
    Grid,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Checkbox,
    ListItemText,
} from "@mui/material"
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Refresh as RefreshIcon,
    FilterAlt as FilterAltIcon,
    Clear as ClearIcon,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import * as comissaoService from "../services/comissaoService"
import type { ComissaoRangeCompleta } from "../types"
import ConfirmacaoExclusao from "../components/ConfirmacaoExclusao"
// Adicionar os imports necessários para paginação
import Paginacao from "../components/Paginacao"

const ComissaoFaixas: React.FC = () => {
    // Modificar o estado para incluir paginação
    const [faixas, setFaixas] = useState<ComissaoRangeCompleta[]>([])
    const [faixasFiltradas, setFaixasFiltradas] = useState<ComissaoRangeCompleta[]>([])
    const [faixasPaginadas, setFaixasPaginadas] = useState<ComissaoRangeCompleta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [faixaParaExcluir, setFaixaParaExcluir] = useState<number | null>(null)
    const [dialogoExclusaoAberto, setDialogoExclusaoAberto] = useState(false)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info" | "warning",
    })

    // Adicionar estado para paginação
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Adicionar estados para filtros
    const [lojasDisponiveis, setLojasDisponiveis] = useState<string[]>([])
    const [lojasSelecionadas, setLojasSelecionadas] = useState<string[]>([])
    const [faixaMinFiltro, setFaixaMinFiltro] = useState<string>("")
    const [faixaMaxFiltro, setFaixaMaxFiltro] = useState<string>("")
    const [filtroAberto, setFiltroAberto] = useState(false)

    const navigate = useNavigate()
    const { temPermissao } = useAuth()
    const podeEditar = temPermissao(["00"])

    // Carregar faixas ao montar o componente
    useEffect(() => {
        carregarFaixas()
    }, [])

    // Adicionar useEffect para extrair lojas disponíveis após o carregamento das faixas
    useEffect(() => {
        if (faixas.length > 0) {
            // Extrair todas as lojas únicas de todas as faixas
            const todasLojas = new Set<string>()
            faixas.forEach((faixa) => {
                faixa.loja.split("-").forEach((loja) => {
                    todasLojas.add(loja.trim())
                })
            })
            setLojasDisponiveis(Array.from(todasLojas).sort())
        }
    }, [faixas])

    // Adicionar função para aplicar filtros
    const aplicarFiltros = () => {
        let resultado = [...faixas]

        // Filtrar por lojas selecionadas
        if (lojasSelecionadas.length > 0) {
            resultado = resultado.filter((faixa) => {
                const lojasArray = faixa.loja.split("-").map((l) => l.trim())
                return lojasSelecionadas.some((lojaSelecionada) => lojasArray.includes(lojaSelecionada))
            })
        }

        // Filtrar por faixa mínima
        if (faixaMinFiltro) {
            const valorMin = Number.parseFloat(faixaMinFiltro)
            if (!isNaN(valorMin)) {
                resultado = resultado.filter((faixa) => faixa.faixa_min >= valorMin)
            }
        }

        // Filtrar por faixa máxima
        if (faixaMaxFiltro) {
            const valorMax = Number.parseFloat(faixaMaxFiltro)
            if (!isNaN(valorMax)) {
                resultado = resultado.filter((faixa) => faixa.faixa_max <= valorMax)
            }
        }

        setFaixasFiltradas(resultado)
        atualizarPaginacao(resultado, 1)
    }

    // Adicionar função para limpar filtros
    const limparFiltros = () => {
        setLojasSelecionadas([])
        setFaixaMinFiltro("")
        setFaixaMaxFiltro("")
        setFaixasFiltradas(faixas)
        atualizarPaginacao(faixas, 1)
    }

    // Modificar o método carregarFaixas para resetar os filtros
    const carregarFaixas = async () => {
        try {
            setLoading(true)
            setError(null)
            console.log("Carregando faixas de comissão...")
            const resultado = await comissaoService.getFaixasComissao()
            console.log("Faixas carregadas:", resultado)

            // Ordenar por loja e depois por faixa_min
            const faixasOrdenadas = [...resultado].sort((a, b) => {
                // Primeiro ordenar por loja
                if (a.loja < b.loja) return -1
                if (a.loja > b.loja) return 1

                // Se as lojas forem iguais, ordenar por faixa_min
                return a.faixa_min - b.faixa_min
            })

            setFaixas(faixasOrdenadas)
            setFaixasFiltradas(faixasOrdenadas)
            atualizarPaginacao(faixasOrdenadas, 1)

            // Resetar filtros
            setLojasSelecionadas([])
            setFaixaMinFiltro("")
            setFaixaMaxFiltro("")

            if (faixasOrdenadas.length === 0) {
                setSnackbar({
                    open: true,
                    message: "Nenhuma faixa de comissão encontrada.",
                    severity: "info",
                })
            }
        } catch (erro) {
            console.error("Erro ao carregar faixas de comissão:", erro)
            setError("Não foi possível carregar as faixas de comissão. Tente novamente mais tarde.")
            setSnackbar({
                open: true,
                message: "Erro ao carregar faixas de comissão. Verifique a conexão com o servidor.",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    // Adicionar função para atualizar paginação
    const atualizarPaginacao = (items: ComissaoRangeCompleta[], currentPage: number) => {
        const startIndex = (currentPage - 1) * rowsPerPage
        const endIndex = startIndex + rowsPerPage
        setFaixasPaginadas(items.slice(startIndex, endIndex))
        setPage(currentPage)
    }

    // Adicionar handlers para paginação
    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        atualizarPaginacao(faixasFiltradas, newPage)
    }

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage)
        setPage(1)
        atualizarPaginacao(faixasFiltradas, 1)
    }

    const handleAdicionarFaixa = () => {
        navigate("/comissao/faixas/nova")
    }

    const handleEditarFaixa = (id: number) => {
        navigate(`/comissao/faixas/editar/${id}`)
    }

    const handleVisualizarFaixa = (id: number) => {
        navigate(`/comissao/faixas/visualizar/${id}`)
    }

    const handleExcluirFaixa = (id: number) => {
        setFaixaParaExcluir(id)
        setDialogoExclusaoAberto(true)
    }

    const confirmarExclusao = async () => {
        if (faixaParaExcluir === null) return

        try {
            await comissaoService.excluirFaixaComissao(faixaParaExcluir)
            setDialogoExclusaoAberto(false)
            setFaixaParaExcluir(null)
            // Recarregar a lista após excluir
            carregarFaixas()
            setSnackbar({
                open: true,
                message: "Faixa de comissão excluída com sucesso.",
                severity: "success",
            })
        } catch (erro) {
            console.error("Erro ao excluir faixa:", erro)
            setError("Não foi possível excluir a faixa. Tente novamente mais tarde.")
            setSnackbar({
                open: true,
                message: "Erro ao excluir faixa de comissão.",
                severity: "error",
            })
        }
    }

    const cancelarExclusao = () => {
        setDialogoExclusaoAberto(false)
        setFaixaParaExcluir(null)
    }

    // Formatar valor monetário
    const formatarValor = (valor: number) => {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    // Formatar percentual
    const formatarPercentual = (valor: number) => {
        return (valor * 100).toFixed(4).replace(".", ",") + "%"
    }

    // Formatar lojas
    const formatarLojas = (lojas: string) => {
        return lojas
            .split("-")
            .map((loja) => (
                <Chip key={loja} label={loja} size="small" color="primary" variant="outlined" sx={{ margin: "2px" }} />
            ))
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Faixas de Comissão
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={carregarFaixas}
                        sx={{ mr: 2 }}
                    >
                        Atualizar
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={filtroAberto ? <ClearIcon /> : <FilterAltIcon />}
                        onClick={() => setFiltroAberto(!filtroAberto)}
                        sx={{ mr: 2 }}
                    >
                        {filtroAberto ? "Ocultar Filtros" : "Mostrar Filtros"}
                    </Button>
                    {podeEditar && (
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAdicionarFaixa}>
                            Nova Faixa
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Área de filtros */}
            {filtroAberto && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Filtros
                    </Typography>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel id="lojas-filtro-label">Lojas</InputLabel>
                                <Select
                                    labelId="lojas-filtro-label"
                                    multiple
                                    value={lojasSelecionadas}
                                    onChange={(e) =>
                                        setLojasSelecionadas(
                                            typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value,
                                        )
                                    }
                                    input={<OutlinedInput label="Lojas" />}
                                    renderValue={(selected) => selected.join(", ")}
                                >
                                    {lojasDisponiveis.map((loja) => (
                                        <MenuItem key={loja} value={loja}>
                                            <Checkbox checked={lojasSelecionadas.indexOf(loja) > -1} />
                                            <ListItemText primary={loja} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Valor Mínimo"
                                fullWidth
                                value={faixaMinFiltro}
                                onChange={(e) => setFaixaMinFiltro(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Valor Máximo"
                                fullWidth
                                value={faixaMaxFiltro}
                                onChange={(e) => setFaixaMaxFiltro(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Box display="flex" gap={1}>
                                <Button variant="contained" color="primary" onClick={aplicarFiltros} fullWidth>
                                    Filtrar
                                </Button>
                                <Button variant="outlined" onClick={limparFiltros} fullWidth>
                                    Limpar
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                    <Button color="inherit" size="small" onClick={carregarFaixas} sx={{ ml: 2 }}>
                        Tentar Novamente
                    </Button>
                </Alert>
            )}

            {faixas.length === 0 && !loading && !error ? (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1">Nenhuma faixa de comissão cadastrada.</Typography>
                    {podeEditar && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAdicionarFaixa}
                            sx={{ mt: 2 }}
                        >
                            Adicionar Faixa
                        </Button>
                    )}
                </Paper>
            ) : (
                !error && (
                    // Modificar a renderização da tabela para usar faixasPaginadas e reorganizar as colunas
                    // Substituir a tabela existente por:
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Lojas</TableCell>
                                    <TableCell>Faixa</TableCell>
                                    <TableCell>Percentuais</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {faixasPaginadas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            Nenhuma faixa de comissão encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    faixasPaginadas.map((faixa) => (
                                        <TableRow key={faixa.id}>
                                            <TableCell>{formatarLojas(faixa.loja)}</TableCell>
                                            <TableCell>
                                                {formatarValor(faixa.faixa_min)} até {formatarValor(faixa.faixa_max)}
                                            </TableCell>
                                            <TableCell>
                                                {faixa.percentuais.map((p) => (
                                                    <Chip
                                                        key={p.id}
                                                        label={`${p.etiqueta}: ${formatarPercentual(p.percentual)}`}
                                                        size="small"
                                                        color={
                                                            p.etiqueta === "verde"
                                                                ? "success"
                                                                : p.etiqueta === "vermelha"
                                                                    ? "error"
                                                                    : p.etiqueta === "amarela"
                                                                        ? "warning"
                                                                        : "default"
                                                        }
                                                        sx={{ margin: "2px" }}
                                                    />
                                                ))}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Visualizar">
                                                    <IconButton onClick={() => handleVisualizarFaixa(faixa.id)} color="info">
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                {podeEditar && (
                                                    <>
                                                        <Tooltip title="Editar">
                                                            <IconButton onClick={() => handleEditarFaixa(faixa.id)} color="primary">
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Excluir">
                                                            <IconButton onClick={() => handleExcluirFaixa(faixa.id)} color="error">
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}

            <ConfirmacaoExclusao
                open={dialogoExclusaoAberto}
                titulo="Excluir Faixa de Comissão"
                mensagem="Tem certeza que deseja excluir esta faixa de comissão? Esta ação não pode ser desfeita."
                onConfirm={confirmarExclusao}
                onClose={cancelarExclusao}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
            {faixasFiltradas.length > 0 && (
                <Paginacao
                    count={faixasFiltradas.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            )}
        </Box>
    )
}

export default ComissaoFaixas
