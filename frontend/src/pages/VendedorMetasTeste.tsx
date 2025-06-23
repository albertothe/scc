"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Typography, Paper, Button, CircularProgress } from "@mui/material"
import * as vendedorMetaService from "../services/vendedorMetaService"
import type { VendedorMetaCompleta } from "../types"

const VendedorMetasTeste: React.FC = () => {
    const [metas, setMetas] = useState<VendedorMetaCompleta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const carregarMetas = async () => {
        try {
            setLoading(true)
            setError(null)

            // Usar a data atual para a competência
            const hoje = new Date()
            const competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

            console.log("Carregando metas de teste...")
            const resultado = await vendedorMetaService.getMetasPorCompetencia(competencia)
            console.log("Metas carregadas:", resultado)

            setMetas(resultado)
        } catch (erro) {
            console.error("Erro ao carregar metas:", erro)
            setError("Não foi possível carregar as metas. Veja o console para mais detalhes.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarMetas()
    }, [])

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Teste de Carregamento de Metas
            </Typography>

            <Button variant="contained" color="primary" onClick={carregarMetas} disabled={loading} sx={{ mb: 3 }}>
                Recarregar Dados
            </Button>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Paper sx={{ p: 3, bgcolor: "error.light", color: "error.contrastText" }}>
                    <Typography>{error}</Typography>
                </Paper>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {metas.length} metas carregadas
                    </Typography>

                    <Paper sx={{ p: 2, bgcolor: "grey.100", overflowX: "auto" }}>
                        <pre>{JSON.stringify(metas, null, 2)}</pre>
                    </Paper>
                </Paper>
            )}
        </Box>
    )
}

export default VendedorMetasTeste
