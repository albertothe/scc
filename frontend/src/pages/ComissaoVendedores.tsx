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
    CircularProgress,
    Alert,
    Snackbar,
} from "@mui/material"
import * as vendedorMetaService from "../services/vendedorMetaService"
import type { VendedorMetaCompleta } from "../types"
import FiltroCompetencia from "../components/FiltroCompetencia"

const ComissaoVendedores: React.FC = () => {
    const [metas, setMetas] = useState<VendedorMetaCompleta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [competencia, setCompetencia] = useState<string>(() => {
        const hoje = new Date()
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
    })
    const [snackbarOpen, setSnackbarOpen] = useState(false)

    useEffect(() => {
        carregarMetas()
    }, [competencia])

    const carregarMetas = async () => {
        try {
            setLoading(true)
            setError(null)
            const dados = await vendedorMetaService.getMetasPorCompetencia(competencia)
            setMetas(Array.isArray(dados) ? dados : [])
            if (Array.isArray(dados) && dados.length === 0) {
                setSnackbarOpen(true)
            }
        } catch (e) {
            console.error("Erro ao carregar metas:", e)
            setError("Não foi possível carregar as metas.")
        } finally {
            setLoading(false)
        }
    }

    const handleCompetenciaChange = (novaCompetencia: string) => {
        setCompetencia(novaCompetencia)
    }

    const formatarValor = (valor: number) => {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    const formatarPercentual = (valor: number) => {
        return (valor * 100).toFixed(2).replace(".", ",") + "%"
    }

    const formatarCompetencia = (data: string) => {
        const [ano, mes] = data.split("-")
        return `${mes}/${ano}`
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Comissão Vendedores - {formatarCompetencia(competencia)}
                </Typography>
                <FiltroCompetencia
                    competencia={competencia}
                    onChange={handleCompetenciaChange}
                    label="Competência"
                    sx={{ minWidth: 200 }}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Vendedor</TableCell>
                                <TableCell>Loja</TableCell>
                                <TableCell>Férias</TableCell>
                                <TableCell>Base Salarial</TableCell>
                                <TableCell>Meta Faturamento</TableCell>
                                <TableCell>Meta Lucro</TableCell>
                                <TableCell>Venda Bruta</TableCell>
                                <TableCell>Devolução</TableCell>
                                <TableCell>Venda Líquida</TableCell>
                                <TableCell>Fat. Mínimo</TableCell>
                                <TableCell>IncFat 90%</TableCell>
                                <TableCell>IncFat 100%</TableCell>
                                <TableCell>IncLuc 90%</TableCell>
                                <TableCell>IncLuc 100%</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {metas.map((meta) => (
                                <TableRow key={meta.codvendedor}>
                                    <TableCell>{meta.vendedor || meta.codvendedor}</TableCell>
                                    <TableCell>{meta.codloja}</TableCell>
                                    <TableCell>{meta.ferias ? "Sim" : "Não"}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.base_salarial) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.meta_faturamento) || 0)}</TableCell>
                                    <TableCell>{formatarPercentual(Number(meta.meta_lucra) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.venda_bruta) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.devolucao) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.valor_liquido) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.faturamento_minimo) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.incfat90) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.incfat100) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.incluc90) || 0)}</TableCell>
                                    <TableCell>{formatarValor(Number(meta.incluc100) || 0)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message="Nenhum registro encontrado para esta competência."
            />
        </Box>
    )
}

export default ComissaoVendedores
