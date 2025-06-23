"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
} from "@mui/material"
import { CloudUpload as CloudUploadIcon, Check as CheckIcon, Error as ErrorIcon } from "@mui/icons-material"
import * as XLSX from "xlsx"
import * as vendedorMetaService from "../services/vendedorMetaService"
import type { VendedorMeta } from "../types"

interface ImportacaoMetasVendedoresProps {
    open: boolean
    onClose: () => void
    competencia: string
    onImportacaoSucesso: () => void
}

interface MetaImportacao {
    codvendedor: string
    nome_vendedor?: string
    codloja?: string
    competencia: string
    base_salarial: number
    meta_faturamento: number
    meta_lucra: number
    faturamento_minimo: number
    incfat90: number
    incfat100: number
    incluc90: number
    incluc100: number
    ferias: boolean
    valido: boolean
    erro?: string
}

const ImportacaoMetasVendedores: React.FC<ImportacaoMetasVendedoresProps> = ({
    open,
    onClose,
    competencia,
    onImportacaoSucesso,
}) => {
    const [arquivo, setArquivo] = useState<File | null>(null)
    const [metas, setMetas] = useState<MetaImportacao[]>([])
    const [carregando, setCarregando] = useState(false)
    const [importando, setImportando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Formatar competência para exibição
    const formatarCompetencia = (data: string) => {
        if (!data) return ""
        const partes = data.split("/")
        if (partes.length === 2) {
            const [mes, ano] = partes
            return `${ano}-${mes.padStart(2, "0")}-01`
        }
        return data
    }

    // Formatar valor monetário
    const formatarValor = (valor: number) => {
        return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    }

    // Formatar percentual
    const formatarPercentual = (valor: number) => {
        return `${valor.toFixed(2).replace(".", ",")}%`
    }

    // Limpar o estado
    const limparEstado = () => {
        setArquivo(null)
        setMetas([])
        setErro(null)
        setSucesso(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Fechar o modal
    const handleClose = () => {
        limparEstado()
        onClose()
    }

    // Processar o arquivo selecionado
    const processarArquivo = async (file: File) => {
        setCarregando(true)
        setErro(null)
        setSucesso(null)

        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: "array" })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const json = XLSX.utils.sheet_to_json(worksheet)

                    // Validar e converter os dados
                    const metasImportadas: MetaImportacao[] = json.map((row: any) => {
                        const codvendedor = row["Código Vendedor"] || ""
                        const base_salarial = Number.parseFloat(row["Base Salarial"]) || 0
                        const meta_faturamento = Number.parseFloat(row["Meta Faturamento"]) || 0
                        const meta_lucra = Number.parseFloat(row["Meta Lucro (%)"] || 0) / 100 // Converter de percentual para decimal
                        const faturamento_minimo = Number.parseFloat(row["Faturamento Mínimo"]) || 0
                        const incfat90 = Number.parseFloat(row["Inc. Fat. 90%"] || 0)
                        const incfat100 = Number.parseFloat(row["Inc. Fat. 100%"] || 0)
                        const incluc90 = Number.parseFloat(row["Inc. Lucro 90%"] || 0)
                        const incluc100 = Number.parseFloat(row["Inc. Lucro 100%"] || 0)
                        const ferias = (row["Férias"] || "").toLowerCase() === "sim"
                        const comp = formatarCompetencia(row["Competência"] || competencia)

                        // Validar os dados
                        let valido = true
                        let erro = ""

                        if (!codvendedor) {
                            valido = false
                            erro = "Código do vendedor é obrigatório"
                        } else if (isNaN(base_salarial) || base_salarial < 0) {
                            valido = false
                            erro = "Base salarial inválida"
                        } else if (isNaN(meta_faturamento) || meta_faturamento < 0) {
                            valido = false
                            erro = "Meta de faturamento inválida"
                        } else if (isNaN(meta_lucra) || meta_lucra < 0 || meta_lucra > 1) {
                            valido = false
                            erro = "Meta de lucro inválida (deve ser entre 0% e 100%)"
                        } else if (isNaN(faturamento_minimo) || faturamento_minimo < 0) {
                            valido = false
                            erro = "Faturamento mínimo inválido"
                        }

                        return {
                            codvendedor,
                            nome_vendedor: row["Nome Vendedor"] || "",
                            codloja: row["Loja"] || "",
                            competencia: comp,
                            base_salarial,
                            meta_faturamento,
                            meta_lucra,
                            faturamento_minimo,
                            incfat90,
                            incfat100,
                            incluc90,
                            incluc100,
                            ferias,
                            valido,
                            erro,
                        }
                    })

                    setMetas(metasImportadas)
                } catch (error) {
                    console.error("Erro ao processar arquivo:", error)
                    setErro("Erro ao processar o arquivo. Verifique se o formato está correto.")
                } finally {
                    setCarregando(false)
                }
            }

            reader.onerror = () => {
                setErro("Erro ao ler o arquivo.")
                setCarregando(false)
            }

            reader.readAsArrayBuffer(file)
        } catch (error) {
            console.error("Erro ao processar arquivo:", error)
            setErro("Erro ao processar o arquivo.")
            setCarregando(false)
        }
    }

    // Manipular a seleção de arquivo
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const file = files[0]
            setArquivo(file)
            processarArquivo(file)
        }
    }

    // Importar as metas
    const importarMetas = async () => {
        if (metas.length === 0) {
            setErro("Nenhuma meta para importar.")
            return
        }

        const metasValidas = metas.filter((meta) => meta.valido)
        if (metasValidas.length === 0) {
            setErro("Nenhuma meta válida para importar.")
            return
        }

        setImportando(true)
        setErro(null)
        setSucesso(null)

        try {
            // Preparar os dados para importação
            const dadosImportacao = metasValidas.map((meta) => ({
                codvendedor: meta.codvendedor,
                competencia: meta.competencia,
                base_salarial: meta.base_salarial,
                meta_faturamento: meta.meta_faturamento,
                meta_lucra: meta.meta_lucra,
                faturamento_minimo: meta.faturamento_minimo,
                incfat90: meta.incfat90,
                incfat100: meta.incfat100,
                incluc90: meta.incluc90,
                incluc100: meta.incluc100,
                ferias: meta.ferias,
            })) as VendedorMeta[]

            // Enviar para o servidor
            const resultado = await vendedorMetaService.importarMetas(dadosImportacao)

            setSucesso(`${resultado.success.length} metas importadas com sucesso!`)
            setTimeout(() => {
                onImportacaoSucesso()
            }, 2000)
        } catch (error) {
            console.error("Erro ao importar metas:", error)
            setErro("Erro ao importar metas. Verifique a conexão com o servidor.")
        } finally {
            setImportando(false)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Importar Metas de Vendedores</DialogTitle>
            <DialogContent>
                {!arquivo ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            p: 3,
                            border: "2px dashed #ccc",
                            borderRadius: 2,
                            cursor: "pointer",
                            "&:hover": {
                                borderColor: "primary.main",
                            },
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Clique para selecionar um arquivo Excel
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Formatos suportados: .xlsx, .xls
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Arquivo selecionado: {arquivo.name}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    limparEstado()
                                    fileInputRef.current?.click()
                                }}
                            >
                                Trocar arquivo
                            </Button>
                        </Box>

                        {carregando ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : erro ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {erro}
                            </Alert>
                        ) : metas.length > 0 ? (
                            <>
                                <Typography variant="subtitle1" gutterBottom>
                                    Pré-visualização ({metas.length} registros, {metas.filter((m) => m.valido).length} válidos)
                                </Typography>
                                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Vendedor</TableCell>
                                                <TableCell>Loja</TableCell>
                                                <TableCell>Base Salarial</TableCell>
                                                <TableCell>Meta Faturamento</TableCell>
                                                <TableCell>Meta Lucro</TableCell>
                                                <TableCell>Fat. Mínimo</TableCell>
                                                <TableCell>Férias</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {metas.map((meta, index) => (
                                                <TableRow key={index} sx={{ backgroundColor: meta.valido ? "inherit" : "error.light" }}>
                                                    <TableCell>
                                                        {meta.valido ? (
                                                            <CheckIcon color="success" />
                                                        ) : (
                                                            <Tooltip title={meta.erro || "Erro de validação"}>
                                                                <ErrorIcon color="error" />
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={meta.nome_vendedor || ""}>
                                                            <span>{meta.codvendedor}</span>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>{meta.codloja}</TableCell>
                                                    <TableCell>{formatarValor(meta.base_salarial)}</TableCell>
                                                    <TableCell>{formatarValor(meta.meta_faturamento)}</TableCell>
                                                    <TableCell>{formatarPercentual(meta.meta_lucra * 100)}</TableCell>
                                                    <TableCell>{formatarValor(meta.faturamento_minimo)}</TableCell>
                                                    <TableCell>{meta.ferias ? "Sim" : "Não"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {metas.some((meta) => !meta.valido) && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Existem registros com erros. Corrija o arquivo e tente novamente.
                                    </Alert>
                                )}

                                {sucesso && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        {sucesso}
                                    </Alert>
                                )}
                            </>
                        ) : (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Nenhum dado encontrado no arquivo.
                            </Alert>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={importarMetas}
                    color="primary"
                    variant="contained"
                    disabled={carregando || importando || !arquivo || metas.length === 0 || !metas.some((m) => m.valido)}
                    startIcon={importando ? <CircularProgress size={20} /> : null}
                >
                    {importando ? "Importando..." : "Importar Metas"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ImportacaoMetasVendedores
