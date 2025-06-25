"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    Box,
    Button,
    Grid,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography,
    Alert,
    MenuItem,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useAuth } from "../contexts/AuthContext"
import * as autorizacaoCompraService from "../services/autorizacaoCompraService"
import type { AutorizacaoCompra } from "../types"
import { LOJAS } from "../utils/lojas"
import { SETORES } from "../utils/setores"

const AutorizacaoCompraFormulario: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const { usuario } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    })

    const opcoesLojas = LOJAS
    const opcoesSetores = SETORES

    const isEdicao = !!id

    const [formData, setFormData] = useState<Partial<AutorizacaoCompra>>({
        loja: "",
        setor: "",
        fornecedor: "",
        valor: 0,
        observacao: "",
    })

    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const carregarAutorizacao = async () => {
            if (isEdicao) {
                try {
                    setLoading(true)
                    const autorizacao = await autorizacaoCompraService.obterAutorizacao(Number(id))

                    // Verificar se o usuário tem permissão para editar
                    if (autorizacao.usuario !== usuario?.usuario && usuario?.nivel !== "00" && usuario?.nivel !== "06") {
                        setError("Você não tem permissão para editar esta autorização")
                        return
                    }

                    // Verificar se já foi autorizada
                    if (autorizacao.autorizado_controladoria || autorizacao.autorizado_diretoria) {
                        setError("Esta autorização já foi processada e não pode ser editada")
                        return
                    }

                    setFormData(autorizacao)
                } catch (error) {
                    console.error("Erro ao carregar autorização:", error)
                    setError("Erro ao carregar autorização")
                } finally {
                    setLoading(false)
                }
            }
        }

        carregarAutorizacao()
    }, [id, isEdicao, usuario])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target
        if (!name) return

        setFormData((prev) => ({
            ...prev,
            [name]: name === "valor" ? Number(value) : value,
        }))

        // Limpar erro do campo quando o usuário digitar
        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: "",
            }))
        }
    }

    const validarFormulario = (): boolean => {
        const errors: Record<string, string> = {}

        if (!formData.loja) {
            errors.loja = "Loja é obrigatória"
        }

        if (!formData.setor) {
            errors.setor = "Setor é obrigatório"
        }

        if (!formData.fornecedor) {
            errors.fornecedor = "Fornecedor é obrigatório"
        }

        if (!formData.valor || formData.valor <= 0) {
            errors.valor = "Valor deve ser maior que zero"
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validarFormulario()) {
            return
        }

        try {
            setLoading(true)

            // Preparar dados para salvar
            const dadosParaSalvar: Omit<AutorizacaoCompra, "id" | "data_criacao" | "hora_criacao"> = {
                loja: formData.loja || "",
                setor: formData.setor || "",
                fornecedor: formData.fornecedor || "",
                valor: formData.valor || 0,
                observacao: formData.observacao || "",
                usuario: usuario?.usuario || "",
                autorizado_controladoria: false,
                autorizado_diretoria: false,
                data_autorizacao_controladoria: undefined,
                data_autorizacao_diretoria: undefined,
                usuario_controladoria: undefined,
                usuario_diretoria: undefined,
                liberada: false,
            }

            if (isEdicao) {
                await autorizacaoCompraService.atualizarAutorizacao(Number(id), dadosParaSalvar)
                setSnackbar({
                    open: true,
                    message: "✅ Autorização de compra alterada com sucesso!",
                    severity: "success",
                })
            } else {
                await autorizacaoCompraService.criarAutorizacao(dadosParaSalvar)
                setSnackbar({
                    open: true,
                    message: "✅ Autorização de compra incluída com sucesso!",
                    severity: "success",
                })
            }

            // Redirecionar após 1 segundo
            setTimeout(() => {
                navigate("/controladoria/autorizacao-compra")
            }, 1000)
        } catch (error) {
            console.error("Erro ao salvar autorização:", error)
            setSnackbar({
                open: true,
                message: "Erro ao salvar autorização",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleVoltar = () => {
        navigate("/controladoria/autorizacao-compra")
    }

    if (error) {
        return (
            <Box p={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography color="error" gutterBottom>
                        {error}
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
                        {isEdicao ? "Editar Autorização de Compra" : "Nova Autorização de Compra"}
                    </Typography>
                    <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                        Voltar
                    </Button>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Loja"
                                name="loja"
                                value={formData.loja || ""}
                                onChange={handleChange}
                                error={!!formErrors.loja}
                                helperText={formErrors.loja}
                                disabled={loading}
                                required
                            >
                                {opcoesLojas.map((loja) => (
                                    <MenuItem key={loja} value={loja}>
                                        {loja}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Setor"
                                name="setor"
                                value={formData.setor || ""}
                                onChange={handleChange}
                                error={!!formErrors.setor}
                                helperText={formErrors.setor}
                                disabled={loading}
                                required
                            >
                                {opcoesSetores.map((setor) => (
                                    <MenuItem key={setor} value={setor}>
                                        {setor}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Fornecedor"
                                name="fornecedor"
                                value={formData.fornecedor || ""}
                                onChange={handleChange}
                                error={!!formErrors.fornecedor}
                                helperText={formErrors.fornecedor}
                                disabled={loading}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Valor"
                                name="valor"
                                type="number"
                                value={formData.valor || ""}
                                onChange={handleChange}
                                error={!!formErrors.valor}
                                helperText={formErrors.valor}
                                disabled={loading}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observação"
                                name="observacao"
                                value={formData.observacao || ""}
                                onChange={handleChange}
                                disabled={loading}
                                multiline
                                rows={4}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="flex-end">
                                <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={loading}>
                                    {loading ? "Salvando..." : "Salvar"}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Snackbar para mensagens */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default AutorizacaoCompraFormulario
