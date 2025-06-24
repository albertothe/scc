"use client"

import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
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

    return (
        <Box p={3}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h1">
                        Detalhes da Autorização de Compra
                    </Typography>
                    <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                        Voltar
                    </Button>
                </Box>
                <Typography gutterBottom>
                    <strong>Usuário:</strong> {autorizacao.usuario}
                </Typography>
                <Typography gutterBottom>
                    <strong>Loja:</strong> {autorizacao.loja}
                </Typography>
                <Typography gutterBottom>
                    <strong>Setor:</strong> {autorizacao.setor}
                </Typography>
                <Typography gutterBottom>
                    <strong>Fornecedor:</strong> {autorizacao.fornecedor}
                </Typography>
                <Typography gutterBottom>
                    <strong>Valor:</strong> {formatarMoeda(autorizacao.valor)}
                </Typography>
                <Typography gutterBottom>
                    <strong>Observação:</strong> {autorizacao.observacao || "-"}
                </Typography>
                <Typography gutterBottom>
                    <strong>Data/Hora Criação:</strong> {formatarData(autorizacao.data_criacao || "")} {autorizacao.hora_criacao}
                </Typography>
                <Typography gutterBottom>
                    <strong>Controladoria:</strong>
                    {" "}
                    {autorizacao.autorizado_controladoria
                        ? `Liberado em ${formatarData(autorizacao.data_autorizacao_controladoria || "")} por ${autorizacao.usuario_controladoria}`
                        : "Aguardando"}
                </Typography>
                <Typography gutterBottom>
                    <strong>Diretoria:</strong>
                    {" "}
                    {autorizacao.autorizado_diretoria
                        ? `Liberado em ${formatarData(autorizacao.data_autorizacao_diretoria || "")} por ${autorizacao.usuario_diretoria}`
                        : autorizacao.autorizado_controladoria
                        ? "Aguardando Diretoria"
                        : "Aguardando"}
                </Typography>
            </Paper>
        </Box>
    )
}

export default AutorizacaoCompraDetalhes
