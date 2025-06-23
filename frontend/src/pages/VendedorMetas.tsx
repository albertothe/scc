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
    Tooltip,
    Alert,
    Snackbar,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link,
} from "@mui/material"
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    ContentCopy as CopyIcon,
    FileDownload as FileDownloadIcon,
    FileUpload as FileUploadIcon,
} from "@mui/icons-material"
import { useNavigate, Link as RouterLink } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import * as vendedorMetaService from "../services/vendedorMetaService"
import * as excelService from "../services/excelService"
import type { VendedorMetaCompleta } from "../types"
import ConfirmacaoExclusao from "../components/ConfirmacaoExclusao"
import FiltroCompetencia from "../components/FiltroCompetencia"
import ImportacaoMetasVendedores from "../components/ImportacaoMetasVendedores"

const VendedorMetas: React.FC = () => {
    const [metas, setMetas] = useState<VendedorMetaCompleta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [competencia, setCompetencia] = useState<string>(() => {
        const hoje = new Date()
        return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
    })
    const [metaParaExcluir, setMetaParaExcluir] = useState<{ codvendedor: string; competencia: string } | null>(null)
    const [dialogoExclusaoAberto, setDialogoExclusaoAberto] = useState(false)
    const [dialogoCopiarAberto, setDialogoCopiarAberto] = useState(false)
    const [competenciaDestino, setCompetenciaDestino] = useState<string>("")
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info" | "warning",
    })
    const [mostrarApenasFerias, setMostrarApenasFerias] = useState(false)
    const [dialogoImportacaoAberto, setDialogoImportacaoAberto] = useState(false)

    const navigate = useNavigate()
    const { temPermissao } = useAuth()
    const podeEditar = temPermissao(["00"])

    // Carregar metas ao montar o componente ou quando a competência mudar
    useEffect(() => {
        carregarMetas()
    }, [competencia])

    const carregarMetas = async () => {
        try {
            setLoading(true)
            setError(null)
            const resultado = await vendedorMetaService.getMetasPorCompetencia(competencia)

            // Verificar se o resultado é válido
            if (!Array.isArray(resultado)) {
                console.error("Resultado não é um array:", resultado)
                setError("Formato de dados inválido recebido do servidor.")
                return
            }

            setMetas(resultado)

            if (resultado.length === 0) {
                setSnackbar({
                    open: true,
                    message: "Nenhuma meta encontrada para esta competência.",
                    severity: "info",
                })
            }
        } catch (erro) {
            console.error("Erro ao carregar metas:", erro)
            setError("Não foi possível carregar as metas. Tente novamente mais tarde.")
            setSnackbar({
                open: true,
                message: "Erro ao carregar metas. Verifique a conexão com o servidor.",
                severity: "error",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAdicionarMeta = () => {
        navigate(`/comissao/metas/nova?competencia=${competencia}`)
    }

    const handleExcluirMeta = (codvendedor: string, competencia: string) => {
        setMetaParaExcluir({ codvendedor, competencia })
        setDialogoExclusaoAberto(true)
    }

    const confirmarExclusao = async () => {
        if (!metaParaExcluir) return

        try {
            await vendedorMetaService.excluirMetaVendedor(metaParaExcluir.codvendedor, metaParaExcluir.competencia)
            setDialogoExclusaoAberto(false)
            setMetaParaExcluir(null)
            // Recarregar a lista após excluir
            carregarMetas()
            setSnackbar({
                open: true,
                message: "Meta excluída com sucesso.",
                severity: "success",
            })
        } catch (erro) {
            console.error("Erro ao excluir meta:", erro)
            setError("Não foi possível excluir a meta. Tente novamente mais tarde.")
            setSnackbar({
                open: true,
                message: "Erro ao excluir meta.",
                severity: "error",
            })
        }
    }

    const cancelarExclusao = () => {
        setDialogoExclusaoAberto(false)
        setMetaParaExcluir(null)
    }

    const handleCopiarMetas = () => {
        // Definir competência de destino como o próximo mês
        const dataAtual = new Date(competencia)
        dataAtual.setMonth(dataAtual.getMonth() + 1)
        const proximoMes = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, "0")}-01`

        setCompetenciaDestino(proximoMes)
        setDialogoCopiarAberto(true)
    }

    const confirmarCopiarMetas = async () => {
        try {
            const resultado = await vendedorMetaService.copiarMetas(competencia, competenciaDestino)
            setDialogoCopiarAberto(false)

            setSnackbar({
                open: true,
                message: `${resultado.quantidade} metas copiadas com sucesso para ${formatarCompetencia(competenciaDestino)}.`,
                severity: "success",
            })

            // Atualizar para a nova competência e carregar as metas copiadas
            setCompetencia(competenciaDestino)
        } catch (erro) {
            console.error("Erro ao copiar metas:", erro)
            setSnackbar({
                open: true,
                message: "Erro ao copiar metas.",
                severity: "error",
            })
        }
    }

    const cancelarCopiarMetas = () => {
        setDialogoCopiarAberto(false)
    }

    const handleCompetenciaChange = (novaCompetencia: string) => {
        setCompetencia(novaCompetencia)
    }

    // Formatar valor monetário
    const formatarValor = (valor: number) => {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    // Formatar percentual
    const formatarPercentual = (valor: number) => {
        return (valor * 100).toFixed(2).replace(".", ",") + "%"
    }

    // Formatar competência para exibição
    const formatarCompetencia = (data: string) => {
        const [ano, mes] = data.split("-")
        return `${mes}/${ano}`
    }

    // Exportar metas para Excel
    const exportarMetas = async () => {
        try {
            // Exportar para Excel usando a função existente
            excelService.exportarMetasVendedores(metas, competencia)

            setSnackbar({
                open: true,
                message: "Metas exportadas com sucesso!",
                severity: "success",
            })
        } catch (erro) {
            console.error("Erro ao exportar metas:", erro)
            setSnackbar({
                open: true,
                message: "Erro ao exportar metas para Excel.",
                severity: "error",
            })
        }
    }

    // Exportar modelo para importação
    const exportarModelo = async () => {
        try {
            // Obter lista de vendedores
            const vendedores = await vendedorMetaService.getVendedores()

            // Exportar modelo usando a função existente
            excelService.exportarModeloMetasVendedores(vendedores, competencia)

            setSnackbar({
                open: true,
                message: "Modelo de importação gerado com sucesso!",
                severity: "success",
            })
        } catch (erro) {
            console.error("Erro ao gerar modelo:", erro)
            setSnackbar({
                open: true,
                message: "Erro ao gerar modelo para importação.",
                severity: "error",
            })
        }
    }

    // Abrir modal de importação
    const abrirModalImportacao = () => {
        setDialogoImportacaoAberto(true)
    }

    // Fechar modal de importação
    const fecharModalImportacao = () => {
        setDialogoImportacaoAberto(false)
    }

    // Callback após importação bem-sucedida
    const onImportacaoSucesso = () => {
        carregarMetas()
        fecharModalImportacao()
    }

    // Filtrar metas de acordo com o checkbox de férias
    const metasFiltradas = mostrarApenasFerias ? metas.filter((meta) => meta.ferias) : metas

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
                    Metas de Vendedores - {formatarCompetencia(competencia)}
                </Typography>
                <Box>
                    <FiltroCompetencia
                        competencia={competencia}
                        onChange={handleCompetenciaChange}
                        label="Competência"
                        sx={{ mr: 2, minWidth: 200 }}
                    />
                    <Button variant="outlined" color="primary" startIcon={<RefreshIcon />} onClick={carregarMetas} sx={{ mr: 2 }}>
                        Atualizar
                    </Button>
                    {podeEditar && (
                        <>
                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<CopyIcon />}
                                onClick={handleCopiarMetas}
                                sx={{ mr: 2 }}
                                disabled={metas.length === 0}
                            >
                                Copiar Metas
                            </Button>
                            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAdicionarMeta}>
                                Nova Meta
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={mostrarApenasFerias}
                            onChange={(e) => setMostrarApenasFerias(e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Mostrar apenas vendedores em férias"
                />

                {/* Botões de importação e exportação */}
                {podeEditar && (
                    <Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<FileDownloadIcon />}
                            onClick={exportarMetas}
                            sx={{ mr: 2 }}
                            disabled={metas.length === 0}
                        >
                            Exportar Excel
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<FileDownloadIcon />}
                            onClick={exportarModelo}
                            sx={{ mr: 2 }}
                        >
                            Exportar Modelo
                        </Button>
                        <Button variant="outlined" color="primary" startIcon={<FileUploadIcon />} onClick={abrirModalImportacao}>
                            Importar Excel
                        </Button>
                    </Box>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                    <Button color="inherit" size="small" onClick={carregarMetas} sx={{ ml: 2 }}>
                        Tentar Novamente
                    </Button>
                </Alert>
            )}

            {metasFiltradas.length === 0 && !loading && !error ? (
                <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1">
                        {mostrarApenasFerias
                            ? "Nenhum vendedor em férias encontrado para esta competência."
                            : "Nenhuma meta cadastrada para esta competência."}
                    </Typography>
                    {podeEditar && !mostrarApenasFerias && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAdicionarMeta}
                            sx={{ mt: 2 }}
                        >
                            Adicionar Meta
                        </Button>
                    )}
                </Paper>
            ) : (
                !error && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vendedor</TableCell>
                                    <TableCell>Loja</TableCell>
                                    <TableCell>Férias</TableCell>
                                    <TableCell>Base Salarial</TableCell>
                                    <TableCell>Meta Faturamento</TableCell>
                                    <TableCell>Meta Lucro</TableCell>
                                    <TableCell>Fat. Mínimo</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {metasFiltradas.map((meta) => (
                                    <TableRow key={meta.codvendedor}>
                                        <TableCell>
                                            <Tooltip title={meta.nome_completo || ""}>
                                                <span>{meta.vendedor || meta.codvendedor}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{meta.codloja}</TableCell>
                                        <TableCell>{meta.ferias ? "Sim" : "Não"}</TableCell>
                                        <TableCell>{formatarValor(Number(meta.base_salarial) || 0)}</TableCell>
                                        <TableCell>{formatarValor(Number(meta.meta_faturamento) || 0)}</TableCell>
                                        <TableCell>{formatarPercentual(Number(meta.meta_lucra) || 0)}</TableCell>
                                        <TableCell>{formatarValor(Number(meta.faturamento_minimo) || 0)}</TableCell>
                                        <TableCell align="center">
                                            {podeEditar && (
                                                <>
                                                    <Link
                                                        component={RouterLink}
                                                        to={`/comissao/metas/editar/${meta.codvendedor}?competencia=${meta.competencia}`}
                                                        underline="none"
                                                    >
                                                        <IconButton color="primary">
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Link>

                                                    <Tooltip title="Excluir">
                                                        <IconButton
                                                            onClick={() => handleExcluirMeta(meta.codvendedor, meta.competencia)}
                                                            color="error"
                                                        >
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
                )
            )}

            {/* Modal de confirmação de exclusão */}
            <ConfirmacaoExclusao
                open={dialogoExclusaoAberto}
                titulo="Excluir Meta de Vendedor"
                mensagem="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
                onConfirm={confirmarExclusao}
                onClose={cancelarExclusao}
            />

            {/* Modal de cópia de metas */}
            <Dialog open={dialogoCopiarAberto} onClose={cancelarCopiarMetas}>
                <DialogTitle>Copiar Metas</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Deseja copiar todas as metas da competência {formatarCompetencia(competencia)} para a competência{" "}
                        {formatarCompetencia(competenciaDestino)}?
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 2, color: "warning.main" }}>
                        Atenção: Esta ação substituirá todas as metas existentes na competência de destino.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelarCopiarMetas} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={confirmarCopiarMetas} color="primary" variant="contained">
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de importação de metas */}
            <ImportacaoMetasVendedores
                open={dialogoImportacaoAberto}
                onClose={fecharModalImportacao}
                competencia={competencia}
                onImportacaoSucesso={onImportacaoSucesso}
            />

            {/* Snackbar para mensagens */}
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

export default VendedorMetas
