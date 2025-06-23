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
    IconButton,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress,
    Chip,
    Stack,
    InputAdornment,
} from "@mui/material"
import { Add as AddIcon, Save as SaveIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import * as comissaoService from "../services/comissaoService"
import type { ComissaoPercentual } from "../types"

type ModoFormulario = "criar" | "editar" | "visualizar"

const ComissaoFormulario: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { temPermissao } = useAuth()

    const [modo, setModo] = useState<ModoFormulario>("criar")
    const [loading, setLoading] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    // Estado do formulário
    const [faixaMin, setFaixaMin] = useState<number | string>("")
    const [faixaMax, setFaixaMax] = useState<number | string>("")
    const [lojas, setLojas] = useState<string>("")
    const [percentuais, setPercentuais] = useState<(ComissaoPercentual & { nova?: boolean })[]>([])

    // Estado para novo percentual
    const [novaEtiqueta, setNovaEtiqueta] = useState<string>("")
    const [novoPercentual, setNovoPercentual] = useState<number | string>("")

    // Erros de validação
    const [erros, setErros] = useState<{
        faixaMin?: string
        faixaMax?: string
        lojas?: string
        percentuais?: string
        novaEtiqueta?: string
        novoPercentual?: string
    }>({})

    // Determinar o modo do formulário e carregar dados se necessário
    useEffect(() => {
        if (id) {
            if (window.location.pathname.includes("/visualizar/")) {
                setModo("visualizar")
            } else {
                setModo("editar")
            }
            carregarFaixa(Number.parseInt(id, 10))
        } else {
            setModo("criar")
            // Inicializar com um percentual vazio para cada etiqueta
            setPercentuais([
                { id: -1, id_range: -1, etiqueta: "verde", percentual: 0, nova: true },
                { id: -2, id_range: -1, etiqueta: "vermelha", percentual: 0, nova: true },
                { id: -3, id_range: -1, etiqueta: "amarela", percentual: 0, nova: true },
            ])
        }
    }, [id])

    const carregarFaixa = async (faixaId: number) => {
        try {
            setLoading(true)
            setErro(null)

            const faixa = await comissaoService.getFaixaComissao(faixaId)

            setFaixaMin(faixa.faixa_min)
            setFaixaMax(faixa.faixa_max)
            setLojas(faixa.loja)
            setPercentuais(faixa.percentuais)
        } catch (error) {
            console.error("Erro ao carregar faixa:", error)
            setErro("Não foi possível carregar os dados da faixa. Tente novamente mais tarde.")
        } finally {
            setLoading(false)
        }
    }

    const validarFormulario = (): boolean => {
        const novosErros: {
            faixaMin?: string
            faixaMax?: string
            lojas?: string
            percentuais?: string
        } = {}

        if (!faixaMin) {
            novosErros.faixaMin = "Valor mínimo é obrigatório"
        } else if (typeof faixaMin === "string" && isNaN(Number.parseFloat(faixaMin))) {
            novosErros.faixaMin = "Valor mínimo deve ser um número"
        }

        if (!faixaMax) {
            novosErros.faixaMax = "Valor máximo é obrigatório"
        } else if (typeof faixaMax === "string" && isNaN(Number.parseFloat(faixaMax))) {
            novosErros.faixaMax = "Valor máximo deve ser um número"
        }

        if (faixaMin && faixaMax) {
            const min = typeof faixaMin === "string" ? Number.parseFloat(faixaMin) : faixaMin
            const max = typeof faixaMax === "string" ? Number.parseFloat(faixaMax) : faixaMax

            if (min >= max) {
                novosErros.faixaMin = "Valor mínimo deve ser menor que o valor máximo"
            }
        }

        if (!lojas) {
            novosErros.lojas = "Lojas são obrigatórias"
        }

        if (percentuais.length === 0) {
            novosErros.percentuais = "Pelo menos um percentual é obrigatório"
        }

        setErros(novosErros)
        return Object.keys(novosErros).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validarFormulario()) {
            return
        }

        try {
            setSalvando(true)

            const dadosFaixa = {
                faixa_min: typeof faixaMin === "string" ? Number.parseFloat(faixaMin) : faixaMin,
                faixa_max: typeof faixaMax === "string" ? Number.parseFloat(faixaMax) : faixaMax,
                loja: lojas,
                percentuais: percentuais.map((p) => ({
                    id: p.nova ? undefined : p.id,
                    etiqueta: p.etiqueta,
                    percentual: p.percentual,
                })),
            }

            if (modo === "criar") {
                await comissaoService.criarFaixaComissao(dadosFaixa)
            } else {
                await comissaoService.atualizarFaixaComissao(Number.parseInt(id!, 10), dadosFaixa as any)
            }

            navigate("/comissao/faixas")
        } catch (error) {
            console.error("Erro ao salvar faixa:", error)
            setErro("Não foi possível salvar a faixa. Tente novamente mais tarde.")
        } finally {
            setSalvando(false)
        }
    }

    const handleAdicionarPercentual = () => {
        // Validar novo percentual
        const novosErros: {
            novaEtiqueta?: string
            novoPercentual?: string
        } = {}

        if (!novaEtiqueta) {
            novosErros.novaEtiqueta = "Etiqueta é obrigatória"
        }

        if (!novoPercentual) {
            novosErros.novoPercentual = "Percentual é obrigatório"
        } else if (typeof novoPercentual === "string" && isNaN(Number.parseFloat(novoPercentual))) {
            novosErros.novoPercentual = "Percentual deve ser um número"
        }

        if (Object.keys(novosErros).length > 0) {
            setErros({ ...erros, ...novosErros })
            return
        }

        // Verificar se já existe um percentual para esta etiqueta
        const etiquetaExistente = percentuais.find((p) => p.etiqueta === novaEtiqueta)
        if (etiquetaExistente) {
            setErros({
                ...erros,
                novaEtiqueta: "Já existe um percentual para esta etiqueta",
            })
            return
        }

        // Adicionar novo percentual
        const novoId = Math.min(-1, ...percentuais.map((p) => p.id)) - 1
        setPercentuais([
            ...percentuais,
            {
                id: novoId,
                id_range: -1,
                etiqueta: novaEtiqueta,
                percentual: typeof novoPercentual === "string" ? Number.parseFloat(novoPercentual) : novoPercentual,
                nova: true,
            },
        ])

        // Limpar campos
        setNovaEtiqueta("")
        setNovoPercentual("")
        setErros({ ...erros, novaEtiqueta: undefined, novoPercentual: undefined })
    }

    const handleRemoverPercentual = (id: number) => {
        setPercentuais(percentuais.filter((p) => p.id !== id))
    }

    const handleVoltar = () => {
        navigate("/comissao/faixas")
    }

    // Formatar percentual para exibição
    const formatarPercentual = (valor: number) => {
        return (valor * 100).toFixed(4).replace(".", ",") + "%"
    }

    // Converter percentual de exibição para valor decimal
    const converterPercentual = (valor: string): number => {
        // Remover o símbolo % e substituir vírgula por ponto
        const valorLimpo = valor.replace("%", "").replace(",", ".")
        // Converter para número e dividir por 100
        return Number.parseFloat(valorLimpo) / 100
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        )
    }

    const titulo =
        modo === "criar"
            ? "Nova Faixa de Comissão"
            : modo === "editar"
                ? "Editar Faixa de Comissão"
                : "Detalhes da Faixa de Comissão"

    const somenteLeitura = modo === "visualizar"

    return (
        <Box p={3}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={handleVoltar} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1">
                        {titulo}
                    </Typography>
                </Box>

                {erro && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {erro}
                    </Typography>
                )}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Valor Mínimo"
                                fullWidth
                                required
                                value={faixaMin}
                                onChange={(e) => setFaixaMin(e.target.value)}
                                error={!!erros.faixaMin}
                                helperText={erros.faixaMin}
                                disabled={somenteLeitura}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Valor Máximo"
                                fullWidth
                                required
                                value={faixaMax}
                                onChange={(e) => setFaixaMax(e.target.value)}
                                error={!!erros.faixaMax}
                                helperText={erros.faixaMax}
                                disabled={somenteLeitura}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Lojas (separadas por hífen, ex: 01-02-03)"
                                fullWidth
                                required
                                value={lojas}
                                onChange={(e) => setLojas(e.target.value)}
                                error={!!erros.lojas}
                                helperText={erros.lojas || "Digite os códigos das lojas separados por hífen, ex: 01-02-03"}
                                disabled={somenteLeitura}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Percentuais por Etiqueta
                            </Typography>

                            {percentuais.length > 0 ? (
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                    {percentuais.map((p) => (
                                        <Chip
                                            key={p.id}
                                            label={`${p.etiqueta}: ${formatarPercentual(p.percentual)}`}
                                            color={
                                                p.etiqueta === "verde"
                                                    ? "success"
                                                    : p.etiqueta === "vermelha"
                                                        ? "error"
                                                        : p.etiqueta === "amarela"
                                                            ? "warning"
                                                            : "default"
                                            }
                                            onDelete={somenteLeitura ? undefined : () => handleRemoverPercentual(p.id)}
                                            sx={{ m: 0.5 }}
                                        />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Nenhum percentual cadastrado
                                </Typography>
                            )}

                            {!somenteLeitura && (
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={5}>
                                        <FormControl fullWidth error={!!erros.novaEtiqueta}>
                                            <InputLabel>Etiqueta</InputLabel>
                                            <Select value={novaEtiqueta} onChange={(e) => setNovaEtiqueta(e.target.value)} label="Etiqueta">
                                                <MenuItem value="verde">Verde</MenuItem>
                                                <MenuItem value="vermelha">Vermelha</MenuItem>
                                                <MenuItem value="amarela">Amarela</MenuItem>
                                                <MenuItem value="outra">Outra</MenuItem>
                                            </Select>
                                            {erros.novaEtiqueta && <FormHelperText>{erros.novaEtiqueta}</FormHelperText>}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={5}>
                                        <TextField
                                            label="Percentual"
                                            fullWidth
                                            value={novoPercentual}
                                            onChange={(e) => setNovoPercentual(e.target.value)}
                                            error={!!erros.novoPercentual}
                                            helperText={erros.novoPercentual}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={2}>
                                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdicionarPercentual} fullWidth>
                                            Adicionar
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>

                        {!somenteLeitura && (
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="flex-end" mt={2}>
                                    <Button variant="outlined" onClick={handleVoltar} sx={{ mr: 2 }} disabled={salvando}>
                                        Cancelar
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                        disabled={salvando}
                                    >
                                        {salvando ? <CircularProgress size={24} /> : "Salvar"}
                                    </Button>
                                </Box>
                            </Grid>
                        )}

                        {somenteLeitura && (
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="flex-end" mt={2}>
                                    <Button variant="outlined" onClick={handleVoltar}>
                                        Voltar
                                    </Button>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </form>
            </Paper>
        </Box>
    )
}

export default ComissaoFormulario
