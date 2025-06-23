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
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import { useAuth } from "../contexts/AuthContext"
import * as autorizacaoCompraService from "../services/autorizacaoCompraService"
import { formatarData, formatarMoeda } from "../utils/formatters"
import type { AutorizacaoCompra } from "../types"
import ContadorItens from "../components/ContadorItens"

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

    const carregarAutorizacoes = async () => {
        try {
            setLoading(true)
            const data = await autorizacaoCompraService.listarAutorizacoes()
            setAutorizacoes(data)
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
    }, [])

    const handleNovo = () => {
        navigate("/controladoria/autorizacao-compra/novo")
    }

    const handleEditar = (id: number | undefined) => {
        if (id) {
            navigate(`/controladoria/autorizacao-compra/editar/${id}`)
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

    const getStatusChip = (autorizacao: AutorizacaoCompra) => {
        if (autorizacao.autorizado_diretoria) {
            return <Chip label="Liberada" color="success" size="small" />
        } else if (autorizacao.autorizado_controladoria) {
            return <Chip label="Aguardando Diretoria" color="primary" size="small" />
        } else {
            return <Chip label="Aguardando Controladoria" color="warning" size="small" />
        }
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
        // Só pode excluir se for o próprio usuário que criou e não estiver autorizada
        // Ou se for nível 00 ou 06
        return (
            (autorizacao.usuario === usuario?.usuario &&
                !autorizacao.autorizado_controladoria &&
                !autorizacao.autorizado_diretoria) ||
            usuario?.nivel === "00" ||
            usuario?.nivel === "06"
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
                                                                onClick={() => handleAutorizarControladoria(autorizacao.id)}
                                                            >
                                                                <CheckCircleIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {podeAutorizarDiretoria(autorizacao) && (
                                                        <Tooltip title="Autorizar (Diretoria)">
                                                            <IconButton
                                                                size="small"
                                                                color="secondary"
                                                                onClick={() => handleAutorizarDiretoria(autorizacao.id)}
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
