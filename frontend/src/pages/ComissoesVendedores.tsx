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
    Button,
    IconButton,
    CircularProgress,
    Alert,
    Snackbar,
    TextField,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    InputAdornment,
} from "@mui/material"
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Store as StoreIcon,
    AttachMoney as MoneyIcon,
} from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext"
import * as comissaoVendedorService from "../services/comissaoVendedorService"

// Tipagens compartilhadas
import type { Vendedor, Loja, ComissaoVendedor } from "../types"

const ComissoesVendedores: React.FC = () => {
    // Estados
    const [comissoes, setComissoes] = useState<ComissaoVendedor[]>([])
    const [vendedores, setVendedores] = useState<Vendedor[]>([])
    const [lojas, setLojas] = useState<Loja[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filtros
    const [busca, setBusca] = useState("")
    const [filtroLoja, setFiltroLoja] = useState("")

    // Modais
    const [modalFormulario, setModalFormulario] = useState(false)
    const [modalExclusao, setModalExclusao] = useState(false)
    const [comissaoSelecionada, setComissaoSelecionada] = useState<ComissaoVendedor | null>(null)

    // Formulário
    const [formulario, setFormulario] = useState<ComissaoVendedor>({
        codvendedor: "",
        codloja: "",
        percentual_base: 0,
        percentual_extra: 0,
        meta_mensal: 0,
        ativo: true,
        data_inicio: new Date().toISOString().split("T")[0],
    })

    // Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info" | "warning",
    })

    const { temPermissao } = useAuth()
    const podeEditar = temPermissao(["00"])


    // Carregar dados
    useEffect(() => {
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setLoading(true)
            setError(null)

            const [vendedoresData, lojasData, comissoesData] = await Promise.all([
                comissaoVendedorService.getVendedores(),
                comissaoVendedorService.getLojas(),
                comissaoVendedorService.getComissoesVendedores(),
            ])

            setVendedores(vendedoresData)
            setLojas(lojasData)
            setComissoes(comissoesData)
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro)
            setError("Não foi possível carregar os dados. Tente novamente.")
            setSnackbar({
                open: true,
                message: "Erro ao carregar dados.",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    // Filtrar comissões
    const comissoesFiltradas = comissoes.filter((comissao) => {
        const matchBusca =
            !busca ||
            comissao.vendedor?.toLowerCase().includes(busca.toLowerCase()) ||
            comissao.codvendedor.toLowerCase().includes(busca.toLowerCase())

        const matchLoja = !filtroLoja || comissao.codloja === filtroLoja

        return matchBusca && matchLoja
    })

    // Calcular estatísticas
    const estatisticas = {
        vendedoresAtivos: comissoes.filter((c) => c.ativo).length,
        comissaoMedia:
            comissoes.length > 0
                ? (comissoes.reduce((acc, c) => acc + c.percentual_base, 0) / comissoes.length).toFixed(2)
                : "0.00",
        lojasAtivas: [...new Set(comissoes.map((c) => c.codloja))].length,
        metaTotal: comissoes.reduce((acc, c) => acc + c.meta_mensal, 0),
    }

    // Handlers do formulário
    const abrirFormulario = (comissao?: ComissaoVendedor) => {
        if (comissao) {
            setFormulario(comissao)
        } else {
            setFormulario({
                codvendedor: "",
                codloja: "",
                percentual_base: 0,
                percentual_extra: 0,
                meta_mensal: 0,
                ativo: true,
                data_inicio: new Date().toISOString().split("T")[0],
            })
        }
        setModalFormulario(true)
    }

    const fecharFormulario = () => {
        setModalFormulario(false)
        setFormulario({
            codvendedor: "",
            codloja: "",
            percentual_base: 0,
            percentual_extra: 0,
            meta_mensal: 0,
            ativo: true,
            data_inicio: new Date().toISOString().split("T")[0],
        })
    }

    const salvarComissao = async () => {
        try {
            // Validações
            if (!formulario.codvendedor || !formulario.codloja) {
                setSnackbar({
                    open: true,
                    message: "Vendedor e loja são obrigatórios.",
                    severity: "error",
                })
                return
            }

            let comissaoSalva: ComissaoVendedor

            if (formulario.id) {
                comissaoSalva = await comissaoVendedorService.atualizarComissaoVendedor(formulario.id, formulario)
                setComissoes((prev) => prev.map((c) => (c.id === formulario.id ? comissaoSalva : c)))
                setSnackbar({
                    open: true,
                    message: "✅ Comissão alterada com sucesso!",
                    severity: "success",
                })
            } else {
                comissaoSalva = await comissaoVendedorService.criarComissaoVendedor(formulario)
                setComissoes((prev) => [...prev, comissaoSalva])
                setSnackbar({
                    open: true,
                    message: "✅ Comissão incluída com sucesso!",
                    severity: "success",
                })
            }

            fecharFormulario()
        } catch (erro) {
            console.error("Erro ao salvar comissão:", erro)
            setSnackbar({
                open: true,
                message: "Erro ao salvar comissão.",
                severity: "error",
            })
        }
    }

    const confirmarExclusao = (comissao: ComissaoVendedor) => {
        setComissaoSelecionada(comissao)
        setModalExclusao(true)
    }

    const excluirComissao = async () => {
        if (!comissaoSelecionada) return

        try {
            await comissaoVendedorService.excluirComissaoVendedor(comissaoSelecionada.id!)

            setComissoes((prev) => prev.filter((c) => c.id !== comissaoSelecionada.id))
            setSnackbar({
                open: true,
                message: "✅ Comissão excluída com sucesso!",
                severity: "success",
            })

            setModalExclusao(false)
            setComissaoSelecionada(null)
        } catch (erro) {
            console.error("Erro ao excluir comissão:", erro)
            setSnackbar({
                open: true,
                message: "Erro ao excluir comissão.",
                severity: "error",
            })
        }
    }

    // Formatadores
    const formatarMoeda = (valor: number) => {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    const formatarPercentual = (valor: number) => {
        return `${valor.toFixed(2)}%`
    }

    const formatarData = (data: string) => {
        return new Date(data).toLocaleDateString("pt-BR")
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box p={3}>
            {/* Cabeçalho */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    Comissões de Vendedores
                </Typography>
                <Box>
                    <Button variant="outlined" color="primary" startIcon={<RefreshIcon />} onClick={carregarDados} sx={{ mr: 2 }}>
                        Atualizar
                    </Button>
                    {podeEditar && (
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => abrirFormulario()}>
                            Nova Comissão
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Cards de Estatísticas */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {estatisticas.vendedoresAtivos}
                                    </Typography>
                                    <Typography color="text.secondary">Vendedores Ativos</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <TrendingUpIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {estatisticas.comissaoMedia}%
                                    </Typography>
                                    <Typography color="text.secondary">Comissão Média</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <StoreIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {estatisticas.lojasAtivas}
                                    </Typography>
                                    <Typography color="text.secondary">Lojas Ativas</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <MoneyIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                                <Box>
                                    <Typography variant="h4" component="div">
                                        {formatarMoeda(estatisticas.metaTotal)}
                                    </Typography>
                                    <Typography color="text.secondary">Meta Total</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Buscar por vendedor ou código..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Loja</InputLabel>
                            <Select value={filtroLoja} onChange={(e) => setFiltroLoja(e.target.value)} label="Loja">
                                <MenuItem value="">Todas as lojas</MenuItem>
                                {lojas.map((loja) => (
                                    <MenuItem key={loja.codloja} value={loja.codloja}>
                                        {loja.codloja} - {loja.loja}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Typography variant="body2" color="text.secondary">
                            {comissoesFiltradas.length} resultado(s)
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Mensagem de erro */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Tabela */}
            {comissoesFiltradas.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1">Nenhuma comissão encontrada.</Typography>
                    {podeEditar && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => abrirFormulario()}
                            sx={{ mt: 2 }}
                        >
                            Adicionar Comissão
                        </Button>
                    )}
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Código</TableCell>
                                <TableCell>Vendedor</TableCell>
                                <TableCell>Loja</TableCell>
                                <TableCell>Comissão Base</TableCell>
                                <TableCell>Comissão Extra</TableCell>
                                <TableCell>Meta Mensal</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Data Início</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {comissoesFiltradas.map((comissao) => (
                                <TableRow key={comissao.id}>
                                    <TableCell>{comissao.codvendedor}</TableCell>
                                    <TableCell>
                                        <Tooltip title={comissao.nome_completo || ""}>
                                            <span>{comissao.vendedor}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${comissao.codloja} - ${comissao.loja}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{formatarPercentual(comissao.percentual_base)}</TableCell>
                                    <TableCell>{formatarPercentual(comissao.percentual_extra)}</TableCell>
                                    <TableCell>{formatarMoeda(comissao.meta_mensal)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={comissao.ativo ? "Ativo" : "Inativo"}
                                            color={comissao.ativo ? "success" : "default"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatarData(comissao.data_inicio)}</TableCell>
                                    <TableCell align="center">
                                        {podeEditar && (
                                            <>
                                                <Tooltip title="Editar">
                                                    <IconButton color="primary" onClick={() => abrirFormulario(comissao)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton color="error" onClick={() => confirmarExclusao(comissao)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal de Formulário */}
            <Dialog open={modalFormulario} onClose={fecharFormulario} maxWidth="md" fullWidth>
                <DialogTitle>{formulario.id ? "Editar Comissão" : "Nova Comissão"}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Vendedor</InputLabel>
                                <Select
                                    value={formulario.codvendedor}
                                    onChange={(e) => {
                                        const vendedor = vendedores.find((v) => v.codvendedor === e.target.value)
                                        setFormulario((prev) => ({
                                            ...prev,
                                            codvendedor: e.target.value,
                                            codloja: vendedor?.codloja || "",
                                        }))
                                    }}
                                    label="Vendedor"
                                >
                                    {vendedores.map((vendedor) => (
                                        <MenuItem key={vendedor.codvendedor} value={vendedor.codvendedor}>
                                            {vendedor.codvendedor} - {vendedor.vendedor}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Loja</InputLabel>
                                <Select
                                    value={formulario.codloja}
                                    onChange={(e) => setFormulario((prev) => ({ ...prev, codloja: e.target.value }))}
                                    label="Loja"
                                >
                                    {lojas.map((loja) => (
                                        <MenuItem key={loja.codloja} value={loja.codloja}>
                                            {loja.codloja} - {loja.loja}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Percentual Base (%)"
                                type="number"
                                value={formulario.percentual_base}
                                onChange={(e) =>
                                    setFormulario((prev) => ({
                                        ...prev,
                                        percentual_base: Number.parseFloat(e.target.value) || 0,
                                    }))
                                }
                                inputProps={{ step: 0.1, min: 0, max: 100 }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Percentual Extra (%)"
                                type="number"
                                value={formulario.percentual_extra}
                                onChange={(e) =>
                                    setFormulario((prev) => ({
                                        ...prev,
                                        percentual_extra: Number.parseFloat(e.target.value) || 0,
                                    }))
                                }
                                inputProps={{ step: 0.1, min: 0, max: 100 }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Meta Mensal"
                                type="number"
                                value={formulario.meta_mensal}
                                onChange={(e) =>
                                    setFormulario((prev) => ({
                                        ...prev,
                                        meta_mensal: Number.parseFloat(e.target.value) || 0,
                                    }))
                                }
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                }}
                                inputProps={{ step: 100, min: 0 }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Data de Início"
                                type="date"
                                value={formulario.data_inicio}
                                onChange={(e) => setFormulario((prev) => ({ ...prev, data_inicio: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observações"
                                multiline
                                rows={3}
                                value={formulario.observacoes || ""}
                                onChange={(e) => setFormulario((prev) => ({ ...prev, observacoes: e.target.value }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={fecharFormulario}>Cancelar</Button>
                    <Button onClick={salvarComissao} variant="contained">
                        {formulario.id ? "Atualizar" : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Exclusão */}
            <Dialog open={modalExclusao} onClose={() => setModalExclusao(false)}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir a comissão do vendedor <strong>{comissaoSelecionada?.vendedor}</strong>? Esta
                        ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalExclusao(false)}>Cancelar</Button>
                    <Button onClick={excluirComissao} color="error" variant="contained">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
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

export default ComissoesVendedores
