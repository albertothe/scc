"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    FormControlLabel,
    Checkbox,
    MenuItem,
    InputAdornment,
    Divider,
} from "@mui/material"
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import * as vendedorMetaService from "../services/vendedorMetaService"
import type { Vendedor, VendedorMeta } from "../types"

const VendedorMetaFormulario: React.FC = () => {
    const [meta, setMeta] = useState<VendedorMeta>({
        codvendedor: "",
        ferias: false,
        competencia: "",
        base_salarial: 0,
        meta_faturamento: 0,
        meta_lucra: 0,
        faturamento_minimo: 0,
        incfat90: 0,
        incfat100: 0,
        incluc90: 0,
        incluc100: 0,
    })

    const [vendedores, setVendedores] = useState<Vendedor[]>([])
    const [loading, setLoading] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info" | "warning",
    })

    const navigate = useNavigate()
    const { codvendedor } = useParams<{ codvendedor: string }>()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const competenciaParam = queryParams.get("competencia")

    // Determinar o modo (criar ou editar)
    const modo = codvendedor ? "editar" : "criar"

    // Carregar dados iniciais
    useEffect(() => {
        const carregarDados = async () => {
            try {
                setLoading(true)
                setError(null)

                // Carregar lista de vendedores
                const listaVendedores = await vendedorMetaService.getVendedores()
                setVendedores(listaVendedores)

                // Definir competência padrão se não for fornecida
                const competenciaInicial =
                    competenciaParam ||
                    (() => {
                        const hoje = new Date()
                        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
                    })()

                if (modo === "editar" && codvendedor) {
                    // Carregar meta existente para edição
                    const metaExistente = await vendedorMetaService.getMetaVendedor(codvendedor, competenciaInicial)
                    setMeta(metaExistente)
                } else {
                    // Inicializar nova meta com a competência
                    setMeta((prev) => ({
                        ...prev,
                        competencia: competenciaInicial,
                    }))
                }
            } catch (erro) {
                console.error("Erro ao carregar dados:", erro)
                setError("Não foi possível carregar os dados necessários. Tente novamente mais tarde.")
                setSnackbar({
                    open: true,
                    message: "Erro ao carregar dados. Verifique a conexão com o servidor.",
                    severity: "error",
                })
            } finally {
                setLoading(false)
            }
        }

        carregarDados()
    }, [modo, codvendedor, competenciaParam])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target

        if (type === "checkbox") {
            setMeta((prev) => ({ ...prev, [name]: checked }))
        } else if (name === "meta_lucra") {
            // Converter percentual para decimal (ex: 5% -> 0.05)
            const percentualDecimal = Number.parseFloat(value) / 100
            setMeta((prev) => ({ ...prev, [name]: isNaN(percentualDecimal) ? 0 : percentualDecimal }))
        } else if (type === "number") {
            setMeta((prev) => ({ ...prev, [name]: value === "" ? 0 : Number.parseFloat(value) }))
        } else {
            setMeta((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSalvando(true)
            setError(null)

            // Validar campos obrigatórios
            if (!meta.codvendedor) {
                setError("Selecione um vendedor.")
                setSnackbar({
                    open: true,
                    message: "Selecione um vendedor.",
                    severity: "error",
                })
                return
            }

            if (!meta.competencia) {
                setError("A competência é obrigatória.")
                setSnackbar({
                    open: true,
                    message: "A competência é obrigatória.",
                    severity: "error",
                })
                return
            }

            // Verificar se já existe uma meta para este vendedor nesta competência (apenas no modo criar)
            if (modo === "criar") {
                try {
                    const metaExistente = await vendedorMetaService.getMetaVendedor(meta.codvendedor, meta.competencia)

                    if (metaExistente && metaExistente.codvendedor) {
                        setError("Já existe uma meta cadastrada para este vendedor nesta competência.")
                        setSnackbar({
                            open: true,
                            message: "Já existe uma meta cadastrada para este vendedor nesta competência.",
                            severity: "error",
                        })
                        return
                    }
                } catch (erro) {
                    // Se o erro for 404 (não encontrado), significa que não existe meta, então podemos continuar
                    // Outros erros serão tratados normalmente
                    if ((erro as any).response?.status !== 404) {
                        throw erro
                    }
                }
            }

            // Salvar meta
            await vendedorMetaService.salvarMetaVendedor(meta)

            setSnackbar({
                open: true,
                message: `Meta ${modo === "criar" ? "criada" : "atualizada"} com sucesso.`,
                severity: "success",
            })

            // Redirecionar após salvar
            setTimeout(() => {
                navigate("/comissao/metas")
            }, 1500)
        } catch (erro) {
            console.error("Erro ao salvar meta:", erro)
            setError(`Não foi possível ${modo === "criar" ? "criar" : "atualizar"} a meta. Tente novamente mais tarde.`)
            setSnackbar({
                open: true,
                message: `Erro ao ${modo === "criar" ? "criar" : "atualizar"} meta.`,
                severity: "error",
            })
        } finally {
            setSalvando(false)
        }
    }

    const handleVoltar = () => {
        navigate("/comissao/metas")
    }

    // Formatar competência para exibição
    const formatarCompetencia = (data: string) => {
        if (!data) return ""
        const [ano, mes] = data.split("-")
        return `${mes}/${ano}`
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
                    {modo === "criar" ? "Nova Meta de Vendedor" : "Editar Meta de Vendedor"}
                    {meta.competencia && ` - ${formatarCompetencia(meta.competencia)}`}
                </Typography>
                <Button startIcon={<ArrowBackIcon />} onClick={handleVoltar}>
                    Voltar
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                label="Vendedor"
                                name="codvendedor"
                                value={meta.codvendedor}
                                onChange={handleChange}
                                fullWidth
                                required
                                disabled={modo === "editar"}
                                error={vendedores.length === 0}
                                helperText={
                                    vendedores.length === 0 ? "Nenhum vendedor disponível. Verifique a conexão com o servidor." : ""
                                }
                            >
                                {vendedores.length === 0 ? (
                                    <MenuItem value="" disabled>
                                        Carregando vendedores...
                                    </MenuItem>
                                ) : (
                                    vendedores.map((vendedor) => (
                                        <MenuItem key={vendedor.codvendedor} value={vendedor.codvendedor}>
                                            {vendedor.vendedor} ({vendedor.codvendedor}) - {vendedor.codloja}
                                        </MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Competência"
                                type="date"
                                name="competencia"
                                value={meta.competencia}
                                onChange={handleChange}
                                fullWidth
                                required
                                disabled={modo === "editar"}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ max: "9999-12-31" }}
                                helperText="Selecione o primeiro dia do mês (ex: 01/05/2025)"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Checkbox checked={meta.ferias} onChange={handleChange} name="ferias" color="primary" />}
                                label="Vendedor em férias neste mês"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Valores Base
                                </Typography>
                            </Divider>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Base Salarial"
                                type="number"
                                name="base_salarial"
                                value={meta.base_salarial}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Meta de Faturamento"
                                type="number"
                                name="meta_faturamento"
                                value={meta.meta_faturamento}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Meta de Lucro (%)"
                                type="number"
                                name="meta_lucra"
                                // Converter de decimal para percentual para exibição (ex: 0.05 -> 5)
                                value={meta.meta_lucra * 100}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0", max: "100" }}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                label="Faturamento Mínimo"
                                type="number"
                                name="faturamento_minimo"
                                value={meta.faturamento_minimo}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Incentivos de Faturamento
                                </Typography>
                            </Divider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Incentivo 90% Faturamento"
                                type="number"
                                name="incfat90"
                                value={meta.incfat90}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                                helperText="Valor recebido ao atingir 90% da meta de faturamento"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Incentivo 100% Faturamento"
                                type="number"
                                name="incfat100"
                                value={meta.incfat100}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                                helperText="Valor recebido ao atingir 100% da meta de faturamento"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Incentivos de Lucro
                                </Typography>
                            </Divider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Incentivo 90% Lucro"
                                type="number"
                                name="incluc90"
                                value={meta.incluc90}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                                helperText="Valor recebido ao atingir 90% da meta de lucro"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Incentivo 100% Lucro"
                                type="number"
                                name="incluc100"
                                value={meta.incluc100}
                                onChange={handleChange}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: "0.01", min: "0" }}
                                helperText="Valor recebido ao atingir 100% da meta de lucro"
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Box display="flex" justifyContent="flex-end">
                                <Button variant="outlined" color="inherit" onClick={handleVoltar} sx={{ mr: 2 }} disabled={salvando}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={salvando}>
                                    {salvando ? <CircularProgress size={24} /> : "Salvar"}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default VendedorMetaFormulario
