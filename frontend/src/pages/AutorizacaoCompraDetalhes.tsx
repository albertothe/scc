"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Box, Paper, Typography, Button, CircularProgress, Grid, Chip } from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import PrintIcon from "@mui/icons-material/Print"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import * as autorizacaoCompraService from "../services/autorizacaoCompraService"
import { formatarData, formatarMoeda } from "../utils/formatters"
import type { AutorizacaoCompra } from "../types"

const styles = `
  @media print {
    .no-print {
      display: none !important;
    }
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    .recibo-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .recibo-content {
      line-height: 1.6;
    }
    .recibo-footer {
      margin-top: 40px;
      border-top: 1px solid #ccc;
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  }
`

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

    const pdfRef = useRef<HTMLDivElement>(null)

    const handleVoltar = () => {
        navigate("/controladoria/autorizacao-compra")
    }

    const handleImprimir = async () => {
        if (!pdfRef.current) return

        // Configurações para melhor qualidade e evitar elementos indesejados
        const canvas = await html2canvas(pdfRef.current, {
            scale: 2, // Melhor qualidade
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff", // Fundo branco
            width: pdfRef.current.scrollWidth,
            height: pdfRef.current.scrollHeight,
            ignoreElements: (element) => {
                // Ignora elementos com classe no-print
                return element.classList.contains("no-print")
            },
        })

        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF("p", "mm", "a4")

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const imgX = (pdfWidth - imgWidth * ratio) / 2
        const imgY = 0

        pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
        pdf.save(`autorizacao-compra-${autorizacao?.id || "documento"}.pdf`)
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
            <style>{styles}</style>
            {/* Botões - só aparecem na tela */}
            <Box className="no-print" display="flex" justifyContent="flex-end" mb={3}>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handleImprimir} sx={{ mr: 1 }}>
                    Gerar PDF
                </Button>
                <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                    Voltar
                </Button>
            </Box>
            <div ref={pdfRef}>
                <Paper
                    sx={{
                        p: 4,
                        backgroundColor: "#ffffff",
                        maxWidth: "210mm", // Largura A4
                        margin: "0 auto",
                        boxShadow: "none", // Remove sombra para o PDF
                    }}
                >
                    {/* Cabeçalho do Recibo */}
                    <Box className="recibo-header" sx={{ textAlign: "center", borderBottom: "2px solid #333", pb: 3, mb: 4 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
                            AUTORIZAÇÃO DE COMPRA
                        </Typography>
                        <Typography variant="h6" sx={{ color: "text.secondary" }}>
                            Protocolo Nº {autorizacao.id?.toString().padStart(6, "0")}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Emitido em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
                        </Typography>
                    </Box>

                    <Box className="recibo-content">
                        {/* Status da Autorização */}
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Chip
                                label={statusLabel}
                                sx={{
                                    backgroundColor: statusColor,
                                    color: "#fff",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    px: 3,
                                    py: 1,
                                    height: "40px", // Adiciona altura para simular o tamanho large
                                }}
                            />
                        </Box>

                        {/* Dados da Solicitação */}
                        <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", borderBottom: "1px solid #eee", pb: 1 }}>
                                📋 DADOS DA SOLICITAÇÃO
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Solicitante:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {autorizacao.usuario}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Loja:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {autorizacao.loja}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Setor:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {autorizacao.setor}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Fornecedor:
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {autorizacao.fornecedor}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            textAlign: "center",
                                            p: 2,
                                            backgroundColor: "#f5f5f5",
                                            borderRadius: 2,
                                            border: "2px solid #e0e0e0",
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Valor Total:
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            {formatarMoeda(autorizacao.valor)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                {autorizacao.observacao && (
                                    <Grid item xs={12}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Observações:
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontStyle: "italic", p: 1, backgroundColor: "#f9f9f9", borderRadius: 1 }}
                                            >
                                                {autorizacao.observacao}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        {/* Histórico de Aprovações */}
                        <Box component={Paper} variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", borderBottom: "1px solid #eee", pb: 1 }}>
                                ✅ HISTÓRICO DE APROVAÇÕES
                            </Typography>

                            {/* Criação */}
                            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f0f8ff", borderRadius: 1, borderLeft: "4px solid #2196f3" }}>
                                <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                                    📝 Solicitação Criada
                                </Typography>
                                <Typography variant="body2">
                                    Data: {formatarData(autorizacao.data_criacao || "")} às {autorizacao.hora_criacao}
                                </Typography>
                                <Typography variant="body2">Por: {autorizacao.usuario}</Typography>
                            </Box>

                            {/* Controladoria */}
                            <Box
                                sx={{
                                    mb: 3,
                                    p: 2,
                                    backgroundColor: autorizacao.autorizado_controladoria ? "#f0fff0" : "#fff8f0",
                                    borderRadius: 1,
                                    borderLeft: `4px solid ${autorizacao.autorizado_controladoria ? "#4caf50" : "#ff9800"}`,
                                }}
                            >
                                <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                                    🏢 Controladoria
                                </Typography>
                                {autorizacao.autorizado_controladoria ? (
                                    <>
                                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                                            ✅ APROVADO
                                        </Typography>
                                        <Typography variant="body2">
                                            Data: {formatarData(autorizacao.data_autorizacao_controladoria || "")}
                                        </Typography>
                                        <Typography variant="body2">Por: {autorizacao.usuario_controladoria}</Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" sx={{ color: "warning.main", fontWeight: "bold" }}>
                                        ⏳ PENDENTE
                                    </Typography>
                                )}
                            </Box>

                            {/* Diretoria */}
                            <Box
                                sx={{
                                    mb: 2,
                                    p: 2,
                                    backgroundColor: autorizacao.autorizado_diretoria ? "#f0fff0" : "#fff8f0",
                                    borderRadius: 1,
                                    borderLeft: `4px solid ${autorizacao.autorizado_diretoria ? "#4caf50" : "#ff9800"}`,
                                }}
                            >
                                <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                                    👔 Diretoria
                                </Typography>
                                {autorizacao.autorizado_diretoria ? (
                                    <>
                                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                                            ✅ APROVADO
                                        </Typography>
                                        <Typography variant="body2">
                                            Data: {formatarData(autorizacao.data_autorizacao_diretoria || "")}
                                        </Typography>
                                        <Typography variant="body2">Por: {autorizacao.usuario_diretoria}</Typography>
                                    </>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: autorizacao.autorizado_controladoria ? "warning.main" : "text.secondary",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {autorizacao.autorizado_controladoria ? "⏳ AGUARDANDO APROVAÇÃO" : "⏳ PENDENTE"}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Rodapé do Recibo */}
                    <Box
                        className="recibo-footer"
                        sx={{
                            mt: 4,
                            pt: 2,
                            borderTop: "1px solid #ccc",
                            textAlign: "center",
                            color: "text.secondary",
                        }}
                    >
                        <Typography variant="body2">
                            Este documento foi gerado automaticamente pelo Sistema de Gestão J Monte
                        </Typography>
                        <Typography variant="caption">
                            Documento válido sem assinatura • Gerado em {new Date().toLocaleString("pt-BR")}
                        </Typography>
                    </Box>
                </Paper>
            </div>
        </Box>
    )
}

export default AutorizacaoCompraDetalhes
