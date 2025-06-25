"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Alert,
    TextField,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { Visibility as VisibilityIcon } from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext"
import * as autorizacaoCompraService from "../services/autorizacaoCompraService"
import type { ListarAutorizacoesParams } from "../services/autorizacaoCompraService"
import { formatarData, formatarMoeda } from "../utils/formatters"
import type { AutorizacaoCompra } from "../types"
import ContadorItens from "../components/ContadorItens"
import FiltroSelect from "../components/FiltroSelect"
import FiltroBusca from "../components/FiltroBusca"
import Paginacao from "../components/Paginacao"
import { LOJAS } from "../utils/lojas"
import { SETORES } from "../utils/setores"

const AutorizacaoCompraPage: React.FC = () => {
    const navigate = useNavigate()
    const { usuario } = useAuth()
    const [autorizacoes, setAutorizacoes] = useState<AutorizacaoCompra[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [autorizacaoParaExcluir, setAutorizacaoParaExcluir] = useState<number | null>(null)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    })
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        id?: number
        action?: "autorizarControladoria" | "autorizarDiretoria" | "reverterControladoria"
    }>({ open: false })

    const [filtroLoja, setFiltroLoja] = useState("")
    const [filtroSetor, setFiltroSetor] = useState("")
    const [filtroBusca, setFiltroBusca] = useState("")
    const [filtroDataInicio, setFiltroDataInicio] = useState<Date | null>(null)
    const [filtroDataFim, setFiltroDataFim] = useState<Date | null>(null)

    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [total, setTotal] = useState(0)

    const carregarAutorizacoes = async () => {
        try {
            setLoading(true)
            const params: ListarAutorizacoesParams = {
                loja: filtroLoja || undefined,
                setor: filtroSetor || undefined,
                busca: filtroBusca || undefined,
                dataInicio: filtroDataInicio ? filtroDataInicio.toISOString().slice(0, 10) : undefined,
                dataFim: filtroDataFim ? filtroDataFim.toISOString().slice(0, 10) : undefined,
                page,
                limit: rowsPerPage,
            }

            const data = await autorizacaoCompraService.listarAutorizacoes(params)
            setAutorizacoes(data.dados)
            setTotal(data.total)
        } catch (error) {
            console.error("Erro ao carregar autorizações:", error)
            setSnackbar({
                open: true,
                message: "Erro ao carregar autorizações",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarAutorizacoes()
    }, [filtroLoja, filtroSetor, filtroBusca, filtroDataInicio, filtroDataFim, page, rowsPerPage])

    const handleNovo = () => {
        navigate("/controladoria/autorizacao-compra/novo")
    }

    const handleEditar = (id: number | undefined) => {
        if (id) {
            navigate(`/controladoria/autorizacao-compra/editar/${id}`)
        }
    }

    const handleVisualizar = (id: number | undefined) => {
        if (id) {
            navigate(`/controladoria/autorizacao-compra/visualizar/${id}`)
        }
    }

    const handleExcluir = (id: number | undefined) => {
        if (id) {
            setAutorizacaoParaExcluir(id)
            setDeleteDialogOpen(true)
        }
    }

    const confirmarExclusao = async () => {
        if (autorizacaoParaExcluir) {
            try {
                await autorizacaoCompraService.excluirAutorizacao(autorizacaoParaExcluir)
                setSnackbar({
                    open: true,
                    message: "Autorização excluída com sucesso",
                    severity: "success",
                })
                carregarAutorizacoes()
            } catch (error) {
                console.error("Erro ao excluir autorização:", error)
                setSnackbar({
                    open: true,
                    message: "Erro ao excluir autorização",
                    severity: "error",
                })
            }
        }
        setDeleteDialogOpen(false)
        setAutorizacaoParaExcluir(null)
    }

    const abrirConfirmacao = (
        id: number | undefined,
        action: "autorizarControladoria" | "autorizarDiretoria" | "reverterControladoria",
    ) => {
        if (!id) return
        setConfirmDialog({ open: true, id, action })
    }

    const executarConfirmacao = async () => {
        if (!confirmDialog.id || !confirmDialog.action) {
            setConfirmDialog({ open: false })
            return
        }

        switch (confirmDialog.action) {
            case "autorizarControladoria":
                await handleAutorizarControladoria(confirmDialog.id)
                break
            case "autorizarDiretoria":
                await handleAutorizarDiretoria(confirmDialog.id)
                break
            case "reverterControladoria":
                await handleReverterControladoria(confirmDialog.id)
                break
        }

        setConfirmDialog({ open: false })
    }

    const handleAutorizarControladoria = async (id: number | undefined) => {
        if (!id) return

        try {
            await autorizacaoCompraService.autorizarControladoria(id)
            setSnackbar({
                open: true,
                message: "Autorização da controladoria realizada com sucesso",
                severity: "success",
            })
            carregarAutorizacoes()
        } catch (error) {
            console.error("Erro ao autorizar pela controladoria:", error)
            setSnackbar({
                open: true,
                message: "Erro ao autorizar pela controladoria",
                severity: "error",
            })
        }
    }

    const handleAutorizarDiretoria = async (id: number | undefined) => {
        if (!id) return

        try {
            await autorizacaoCompraService.autorizarDiretoria(id)
            setSnackbar({
                open: true,
                message: "Autorização da diretoria realizada com sucesso",
                severity: "success",
            })
            carregarAutorizacoes()
        } catch (error) {
            console.error("Erro ao autorizar pela diretoria:", error)
            setSnackbar({
                open: true,
                message: "Erro ao autorizar pela diretoria",
                severity: "error",
            })
        }
    }

    const handleReverterControladoria = async (id: number | undefined) => {
        if (!id) return

        try {
            await autorizacaoCompraService.reverterControladoria(id)
            setSnackbar({
                open: true,
                message: "Autorização revertida",
                severity: "success",
            })
            carregarAutorizacoes()
        } catch (error) {
            console.error("Erro ao reverter autorização:", error)
            setSnackbar({
                open: true,
                message: "Erro ao reverter autorização",
                severity: "error",
            })
        }
    }

    const getStatusChip = (autorizacao: AutorizacaoCompra) => {
        const chips: React.ReactNode[] = []

        if (autorizacao.autorizado_controladoria) {
            chips.push(
                <Tooltip
                    key="ctrl"
                    title={`Liberado em ${formatarData(
                        autorizacao.data_autorizacao_controladoria || "",
                    )} por ${autorizacao.usuario_controladoria || ""}`}
                >
                    <Chip
                        label="Liberado Controladoria"
                        color="primary"
                        size="small"
                        sx={{ mr: 0.5 }}
                        onClick={() =>
                            usuario?.nivel === "06" && !autorizacao.autorizado_diretoria
                                ? abrirConfirmacao(autorizacao.id, "reverterControladoria")
                                : undefined
                        }
                        clickable={usuario?.nivel === "06" && !autorizacao.autorizado_diretoria}
                    />
                </Tooltip>,
            )
        } else {
            chips.push(
                <Chip
                    key="aguarda"
                    label="Aguardando Controladoria"
                    color="warning"
                    size="small"
                    sx={{ mr: 0.5 }}
                    onClick={() =>
                        usuario?.nivel === "06" ? abrirConfirmacao(autorizacao.id, "autorizarControladoria") : undefined
                    }
                    clickable={usuario?.nivel === "06"}
                />,
            )
        }
        if (autorizacao.autorizado_diretoria) {
            chips.push(
                <Tooltip
                    key="dir"
                    title={`Liberado em ${formatarData(
                        autorizacao.data_autorizacao_diretoria || "",
                    )} por ${autorizacao.usuario_diretoria || ""}`}
                >
                    <Chip label="Liberado Diretoria" color="success" size="small" />
                </Tooltip>,
            )
        } else if (autorizacao.autorizado_controladoria) {
            chips.push(
                <Chip
                    key="aguarda_dir"
                    label="Aguardando Diretoria"
                    color="warning"
                    size="small"
                    sx={{ mr: 0.5 }}
                    onClick={() => (usuario?.nivel === "00" ? abrirConfirmacao(autorizacao.id, "autorizarDiretoria") : undefined)}
                    clickable={usuario?.nivel === "00"}
                />,
            )
        }

        return (
            <Box display="flex" flexWrap="wrap">
                {chips}
            </Box>
        )
    }

    // Verifica se o usuário pode editar a autorização
    const podeEditar = (autorizacao: AutorizacaoCompra) => {
        // Só pode editar se for o próprio usuário que criou e não estiver autorizada
        return (
            autorizacao.usuario === usuario?.usuario &&
            !autorizacao.autorizado_controladoria &&
            !autorizacao.autorizado_diretoria
        )
    }

    // Verifica se o usuário pode excluir a autorização
    const podeExcluir = (autorizacao: AutorizacaoCompra) => {
        // Apenas o usuário que criou e enquanto não houver liberação
        return (
            autorizacao.usuario === usuario?.usuario &&
            !autorizacao.autorizado_controladoria &&
            !autorizacao.autorizado_diretoria
        )
    }

    // Verifica se o usuário pode autorizar pela controladoria
    const podeAutorizarControladoria = (autorizacao: AutorizacaoCompra) => {
        // Só pode autorizar se for nível 06 (controladoria) e não estiver autorizada pela controladoria
        return usuario?.nivel === "06" && !autorizacao.autorizado_controladoria
    }

    // Verifica se o usuário pode autorizar pela diretoria
    const podeAutorizarDiretoria = (autorizacao: AutorizacaoCompra) => {
        // Só pode autorizar se for nível 00 (diretoria), já estiver autorizada pela controladoria e não estiver autorizada pela diretoria
        return usuario?.nivel === "00" && autorizacao.autorizado_controladoria && !autorizacao.autorizado_diretoria
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Autorização de Compra
                </Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleNovo}>
                    Nova Autorização
                </Button>
            </Box>

            {loading ? (
                <Typography>Carregando...</Typography>
            ) : (
                <>
                    <Box mb={2}>
                        <ContadorItens quantidade={autorizacoes.length} label="autorizações" />
                    </Box>

                    <Box component={Paper} sx={{ p: 2, mb: 2 }}>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "1fr 1fr",
                                    md: "2fr 1fr 1fr 1fr 1fr 1fr",
                                },
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <FiltroBusca
                                    size="small"
                                    onBuscar={(termo) => {
                                        setFiltroBusca(termo)
                                        setPage(1)
                                    }}
                                    placeholder="Buscar por usuário ou fornecedor..."
                                />
                            </Box>
                            <Box>
                                <FiltroSelect
                                    size="small"
                                    label="Loja"
                                    valor={filtroLoja}
                                    opcoes={LOJAS as unknown as string[]}
                                    onChange={(v) => {
                                        setFiltroLoja(v)
                                        setPage(1)
                                    }}
                                />
                            </Box>
                            <Box>
                                <FiltroSelect
                                    size="small"
                                    label="Setor"
                                    valor={filtroSetor}
                                    opcoes={SETORES as unknown as string[]}
                                    onChange={(v) => {
                                        setFiltroSetor(v)
                                        setPage(1)
                                    }}
                                />
                            </Box>
                            <Box>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Data inicial"
                                    value={filtroDataInicio ? filtroDataInicio.toISOString().slice(0, 10) : ""}
                                    onChange={(e) => {
                                        setFiltroDataInicio(e.target.value ? new Date(e.target.value) : null)
                                        setPage(1)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Box>
                            <Box>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Data final"
                                    value={filtroDataFim ? filtroDataFim.toISOString().slice(0, 10) : ""}
                                    onChange={(e) => {
                                        setFiltroDataFim(e.target.value ? new Date(e.target.value) : null)
                                        setPage(1)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                            </Box>
                            <Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setFiltroLoja("")
                                        setFiltroSetor("")
                                        setFiltroBusca("")
                                        setFiltroDataInicio(null)
                                        setFiltroDataFim(null)
                                        setPage(1)
                                    }}
                                    fullWidth
                                >
                                    Limpar
                                </Button>
                            </Box>
                        </Box>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuário</TableCell>
                                    <TableCell>Loja</TableCell>
                                    <TableCell>Setor</TableCell>
                                    <TableCell>Fornecedor</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {autorizacoes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            Nenhuma autorização encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    autorizacoes.map((autorizacao) => (
                                        <TableRow key={autorizacao.id}>
                                            <TableCell>{autorizacao.usuario}</TableCell>
                                            <TableCell>{autorizacao.loja}</TableCell>
                                            <TableCell>{autorizacao.setor}</TableCell>
                                            <TableCell>{autorizacao.fornecedor}</TableCell>
                                            <TableCell>{formatarMoeda(autorizacao.valor)}</TableCell>
                                            <TableCell>{formatarData(autorizacao.data_criacao || "")}</TableCell>
                                            <TableCell>{getStatusChip(autorizacao)}</TableCell>
                                            <TableCell>
                                                <Box display="flex">
                                                    <Tooltip title="Visualizar">
                                                        <IconButton size="small" color="info" onClick={() => handleVisualizar(autorizacao.id)}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {podeEditar(autorizacao) && (
                                                        <Tooltip title="Editar">
                                                            <IconButton size="small" onClick={() => handleEditar(autorizacao.id)}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {podeExcluir(autorizacao) && (
                                                        <Tooltip title="Excluir">
                                                            <IconButton size="small" onClick={() => handleExcluir(autorizacao.id)}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {podeAutorizarControladoria(autorizacao) && (
                                                        <Tooltip title="Autorizar (Controladoria)">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => abrirConfirmacao(autorizacao.id, "autorizarControladoria")}
                                                            >
                                                                <CheckCircleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {usuario?.nivel === "06" &&
                                                        autorizacao.autorizado_controladoria &&
                                                        !autorizacao.autorizado_diretoria && (
                                                            <Tooltip title="Reverter (Controladoria)">
                                                                <IconButton
                                                                    size="small"
                                                                    color="warning"
                                                                    onClick={() => abrirConfirmacao(autorizacao.id, "reverterControladoria")}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    {podeAutorizarDiretoria(autorizacao) && (
                                                        <Tooltip title="Autorizar (Diretoria)">
                                                            <IconButton
                                                                size="small"
                                                                color="secondary"
                                                                onClick={() => abrirConfirmacao(autorizacao.id, "autorizarDiretoria")}
                                                            >
                                                                <CheckCircleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {total > 0 && (
                        <Paginacao
                            count={total}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={(p) => setPage(p)}
                            onRowsPerPageChange={(r) => {
                                setRowsPerPage(r)
                                setPage(1)
                            }}
                        />
                    )}
                </>
            )}

            {/* Dialog de confirmação de exclusão */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>Tem certeza que deseja excluir esta autorização de compra?</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={confirmarExclusao} color="error" autoFocus>
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialogo de confirmação de ações */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false })}>
                <DialogTitle>Confirmar Ação</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.action === "autorizarControladoria" && "Deseja autorizar pela Controladoria?"}
                        {confirmDialog.action === "reverterControladoria" && "Deseja reverter a autorização da Controladoria?"}
                        {confirmDialog.action === "autorizarDiretoria" && "Deseja autorizar pela Diretoria?"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false })} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={executarConfirmacao} color="secondary" autoFocus>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para mensagens */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default AutorizacaoCompraPage
