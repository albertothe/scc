"use client"

import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Grid,
    Chip,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import PrintIcon from "@mui/icons-material/Print"
import VisibilityIcon from "@mui/icons-material/Visibility"
import PersonIcon from "@mui/icons-material/Person"
import StoreIcon from "@mui/icons-material/Store"
import WorkIcon from "@mui/icons-material/Work"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import MoneyIcon from "@mui/icons-material/AttachMoney"
import NotesIcon from "@mui/icons-material/Notes"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import * as autorizacaoCompraService from "../services/autorizacaoCompraService"
import { formatarData, formatarMoeda } from "../utils/formatters"
import type { AutorizacaoCompra } from "../types"

const AutorizacaoCompraDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [autorizacao, setAutorizacao] = useState<AutorizacaoCompra | null>(null)

    useEffect(() => {
        const carregar = async () => {
            if (!id) return
            try {
                const data = await autorizacaoCompraService.obterAutorizacao(Number(id))
                setAutorizacao(data)
            } catch (error) {
                console.error("Erro ao obter autorização:", error)
            } finally {
                setLoading(false)
            }
        }

        carregar()
    }, [id])

    const handleVoltar = () => {
        navigate("/controladoria/autorizacao-compra")
    }

    const handleImprimir = () => {
        window.print()
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        )
    }

    if (!autorizacao) {
        return (
            <Box p={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography color="error" gutterBottom>
                        Autorização não encontrada
                    </Typography>
                    <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                        Voltar
                    </Button>
                </Paper>
            </Box>
        )
    }

    const statusLabel =
        autorizacao.autorizado_controladoria && autorizacao.autorizado_diretoria
            ? "Aprovado"
            : autorizacao.autorizado_controladoria
            ? "Aguardando diretoria"
            : "Pendente"

    const statusColor =
        autorizacao.autorizado_controladoria && autorizacao.autorizado_diretoria
            ? "success.main"
            : autorizacao.autorizado_controladoria
            ? "info.main"
            : "text.secondary"

    return (
        <Box p={3}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center">
                        <VisibilityIcon sx={{ mr: 1 }} />
                        <Typography variant="h5" component="h1">
                            Detalhes da Autorização de Compra
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={handleImprimir}
                            sx={{ mr: 1 }}
                        >
                            Imprimir
                        </Button>
                        <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                            Voltar
                        </Button>
                    </Box>
                </Box>

                <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Dados da Solicitação
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <PersonIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Usuário:</strong> {autorizacao.usuario}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <StoreIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Loja:</strong> {autorizacao.loja}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <WorkIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Setor:</strong> {autorizacao.setor}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <LocalShippingIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Fornecedor:</strong> {autorizacao.fornecedor}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <MoneyIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Valor:</strong>{" "}
                                    <Box component="span" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                        {formatarMoeda(autorizacao.valor)}
                                    </Box>
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <NotesIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Observação:</strong> {autorizacao.observacao || "-"}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Box component={Paper} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Datas e Horários
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <AccessTimeIcon sx={{ mr: 1 }} />
                                <Typography>
                                    <strong>Data/Hora Criação:</strong> {formatarData(autorizacao.data_criacao || "")} {autorizacao.hora_criacao}
                                </Typography>
                            </Box>
                        </Grid>
                        {autorizacao.data_autorizacao_controladoria && (
                            <Grid item xs={12} md={6}>
                                <Box display="flex" alignItems="center">
                                    <AccessTimeIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        <strong>Data Liberação Controladoria:</strong> {formatarData(autorizacao.data_autorizacao_controladoria)}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                        {autorizacao.data_autorizacao_diretoria && (
                            <Grid item xs={12} md={6}>
                                <Box display="flex" alignItems="center">
                                    <AccessTimeIcon sx={{ mr: 1 }} />
                                    <Typography>
                                        <strong>Data Liberação Diretoria:</strong> {formatarData(autorizacao.data_autorizacao_diretoria)}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>

                <Box component={Paper} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Status da Aprovação
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <Typography>
                                    <strong>Controladoria:</strong>
                                </Typography>
                                {autorizacao.autorizado_controladoria ? (
                                    <Typography sx={{ color: "success.main", ml: 1, display: "flex", alignItems: "center" }}>
                                        <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        Liberado em {formatarData(autorizacao.data_autorizacao_controladoria || "")} por {autorizacao.usuario_controladoria}
                                    </Typography>
                                ) : (
                                    <Typography sx={{ color: "error.main", ml: 1, display: "flex", alignItems: "center" }}>
                                        <CancelIcon fontSize="small" sx={{ mr: 0.5 }} /> Pendente
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center">
                                <Typography>
                                    <strong>Diretoria:</strong>
                                </Typography>
                                {autorizacao.autorizado_diretoria ? (
                                    <Typography sx={{ color: "success.main", ml: 1, display: "flex", alignItems: "center" }}>
                                        <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        Liberado em {formatarData(autorizacao.data_autorizacao_diretoria || "")} por {autorizacao.usuario_diretoria}
                                    </Typography>
                                ) : (
                                    <Typography sx={{ color: "error.main", ml: 1, display: "flex", alignItems: "center" }}>
                                        <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        {autorizacao.autorizado_controladoria ? "Aguardando Diretoria" : "Pendente"}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                    <Box mt={2}>
                        <Chip label={statusLabel} sx={{ backgroundColor: statusColor, color: "#fff" }} />
                    </Box>
                </Box>
            </Paper>
        </Box>
    )
}

export default AutorizacaoCompraDetalhes
