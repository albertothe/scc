"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    AlertTitle,
    List,
    ListItem,
    ListItemText,
    Paper,
    Chip,
} from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ImportacaoPlanilhaProps {
    open: boolean
    onClose: () => void
    onImport: (produtos: string[]) => Promise<{ success: string[]; errors: { codigo: string; motivo: string }[] }>
    mesAno: string
}

const ImportacaoPlanilha: React.FC<ImportacaoPlanilhaProps> = ({ open, onClose, onImport, mesAno }) => {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [produtos, setProdutos] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [resultado, setResultado] = useState<{
        success: string[]
        errors: { codigo: string; motivo: string }[]
    } | null>(null)

    // Resetar o estado quando o modal for aberto
    useEffect(() => {
        if (open) {
            setFile(null)
            setProdutos([])
            setError(null)
            setResultado(null)
        }
    }, [open])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError(null)
            setResultado(null)
            processarArquivo(selectedFile)
        }
    }

    const processarArquivo = async (file: File) => {
        setLoading(true)
        try {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: "binary" })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json<{ codproduto: string }>(worksheet)

                    if (jsonData.length === 0) {
                        setError("A planilha está vazia ou não contém dados válidos.")
                        setProdutos([])
                        setLoading(false)
                        return
                    }

                    // Verificar se a planilha tem a estrutura correta
                    if (!jsonData[0].hasOwnProperty("codproduto")) {
                        setError("A planilha não está no formato correto. Certifique-se de usar o modelo padrão.")
                        setProdutos([])
                        setLoading(false)
                        return
                    }

                    // Extrair códigos de produto e formatar para ter 5 caracteres
                    const codigosProdutos = jsonData
                        .map((row) => {
                            const codigo = row.codproduto?.toString().trim()
                            return codigo ? codigo.padStart(5, "0") : null
                        })
                        .filter((codigo): codigo is string => codigo !== null && codigo.length > 0)

                    if (codigosProdutos.length === 0) {
                        setError("Nenhum código de produto válido encontrado na planilha.")
                        setProdutos([])
                    } else {
                        setProdutos(codigosProdutos)
                    }
                    setLoading(false)
                } catch (err) {
                    console.error("Erro ao processar arquivo:", err)
                    setError("Erro ao processar o arquivo. Verifique se é uma planilha Excel válida.")
                    setProdutos([])
                    setLoading(false)
                }
            }

            reader.onerror = () => {
                setError("Erro ao ler o arquivo.")
                setLoading(false)
            }

            reader.readAsBinaryString(file)
        } catch (err) {
            console.error("Erro ao processar arquivo:", err)
            setError("Erro ao processar o arquivo. Verifique se é uma planilha Excel válida.")
            setProdutos([])
            setLoading(false)
        }
    }

    const handleImport = async () => {
        if (produtos.length === 0) {
            setError("Nenhum produto para importar.")
            return
        }

        setLoading(true)
        try {
            console.log("Importando produtos para competência:", mesAno)
            const result = await onImport(produtos)
            setResultado(result)
        } catch (err) {
            console.error("Erro na importação:", err)
            setError("Erro ao importar produtos. Tente novamente.")
        }
        setLoading(false)
    }

    const handleClose = () => {
        setFile(null)
        setProdutos([])
        setError(null)
        setResultado(null)
        onClose()
    }

    // Função para obter a competência formatada diretamente da prop mesAno
    const getCompetenciaFormatada = () => {
        if (!mesAno) return ""

        try {
            // Extrair o ano e mês diretamente da string da data
            const [ano, mes] = mesAno.split("-")

            // Criar uma data com o ano e mês corretos
            const data = new Date(Number(ano), Number(mes) - 1, 1) // Mês é 0-indexed em Date

            console.log("ImportacaoPlanilha - Data para formatação:", data)
            console.log("ImportacaoPlanilha - Mês:", mes)
            console.log("ImportacaoPlanilha - Ano:", ano)

            return (
                format(data, "MMMM 'de' yyyy", { locale: ptBR }).charAt(0).toUpperCase() +
                format(data, "MMMM 'de' yyyy", { locale: ptBR }).slice(1)
            )
        } catch (err) {
            console.error("Erro ao formatar competência:", err)
            return ""
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Importar Produtos
                <Chip
                    label={getCompetenciaFormatada()}
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 2, verticalAlign: "middle" }}
                />
            </DialogTitle>
            <DialogContent>
                {!resultado ? (
                    <>
                        <Typography variant="body1" gutterBottom>
                            Selecione uma planilha Excel com os códigos de produtos para importar para a competência{" "}
                            <strong>{getCompetenciaFormatada()}</strong>.
                        </Typography>

                        <Box
                            sx={{
                                border: "2px dashed #ccc",
                                borderRadius: 2,
                                p: 3,
                                mt: 2,
                                mb: 3,
                                textAlign: "center",
                                cursor: "pointer",
                                "&:hover": {
                                    borderColor: "primary.main",
                                },
                            }}
                            onClick={() => document.getElementById("file-upload")?.click()}
                        >
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                                Clique para selecionar ou arraste o arquivo aqui
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Apenas arquivos Excel (.xlsx, .xls)
                            </Typography>
                        </Box>

                        {file && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Arquivo selecionado: <strong>{file.name}</strong>
                            </Alert>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                <AlertTitle>Erro</AlertTitle>
                                {error}
                            </Alert>
                        )}

                        {produtos.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {produtos.length} produtos encontrados na planilha:
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    sx={{ maxHeight: 200, overflow: "auto", p: 1, bgcolor: "background.default" }}
                                >
                                    <List dense>
                                        {produtos.slice(0, 100).map((codigo, index) => (
                                            <ListItem key={index} dense>
                                                <ListItemText primary={codigo} />
                                            </ListItem>
                                        ))}
                                        {produtos.length > 100 && (
                                            <ListItem dense>
                                                <ListItemText primary={`... e mais ${produtos.length - 100} produtos`} />
                                            </ListItem>
                                        )}
                                    </List>
                                </Paper>
                            </Box>
                        )}
                    </>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <AlertTitle>Importação Concluída</AlertTitle>
                            <Typography variant="body2">{resultado.success.length} produtos foram importados com sucesso.</Typography>
                        </Alert>

                        {resultado.errors.length > 0 && (
                            <>
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    <AlertTitle>Atenção</AlertTitle>
                                    {resultado.errors.length} produtos não puderam ser importados.
                                </Alert>

                                <Typography variant="subtitle1" gutterBottom>
                                    Detalhes dos erros:
                                </Typography>
                                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: "auto", p: 1 }}>
                                    <List dense>
                                        {resultado.errors.map((error, index) => (
                                            <ListItem key={index} dense>
                                                <ListItemText
                                                    primary={`${error.codigo}: ${error.motivo}`}
                                                    primaryTypographyProps={{ color: "error" }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {!resultado ? (
                    <>
                        <Button onClick={handleClose} color="inherit">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleImport}
                            color="primary"
                            variant="contained"
                            disabled={loading || produtos.length === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? "Importando..." : "Importar Produtos"}
                        </Button>
                    </>
                ) : (
                    <Button onClick={handleClose} color="primary" variant="contained">
                        Fechar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default ImportacaoPlanilha
