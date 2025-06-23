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
} from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import * as XLSX from "xlsx"

interface ImportacaoPromocaoProps {
    open: boolean
    onClose: () => void
    onImport: (
        produtos: {
            codproduto: string
            codloja: string
            tabela: string
            valor_promocao: number
            data_validade: string
        }[],
    ) => Promise<{
        success: string[]
        errors: { codigo: string; motivo: string }[]
    }>
}

const ImportacaoPromocao: React.FC<ImportacaoPromocaoProps> = ({ open, onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [produtos, setProdutos] = useState<
        {
            codproduto: string
            codloja: string
            tabela: string
            valor_promocao: number
            data_validade: string
        }[]
    >([])
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
                    const jsonData = XLSX.utils.sheet_to_json<{
                        codproduto: string | number
                        codloja: string | number
                        tabela: string | number
                        valor_promocao: number
                        data_validade: string | number | Date
                    }>(worksheet)

                    if (jsonData.length === 0) {
                        setError("A planilha está vazia ou não contém dados válidos.")
                        setProdutos([])
                        setLoading(false)
                        return
                    }

                    // Verificar se a planilha tem a estrutura correta
                    const requiredFields = ["codproduto", "codloja", "tabela", "valor_promocao", "data_validade"]
                    const firstRow = jsonData[0]
                    const missingFields = requiredFields.filter((field) => !firstRow.hasOwnProperty(field))

                    if (missingFields.length > 0) {
                        setError(
                            `A planilha não está no formato correto. Campos obrigatórios ausentes: ${missingFields.join(", ")}.`,
                        )
                        setProdutos([])
                        setLoading(false)
                        return
                    }

                    // Processar e validar os dados
                    const produtosFormatados = []
                    const errosValidacao = []

                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i]
                        try {
                            // Formatar código do produto (5 caracteres)
                            const codproduto =
                                typeof row.codproduto === "number"
                                    ? String(row.codproduto).padStart(5, "0")
                                    : String(row.codproduto).trim().padStart(5, "0")

                            // Formatar código da loja (2 caracteres)
                            const codloja =
                                typeof row.codloja === "number"
                                    ? String(row.codloja).padStart(2, "0")
                                    : String(row.codloja).trim().padStart(2, "0")

                            // Formatar tabela (2 caracteres)
                            const tabela =
                                typeof row.tabela === "number"
                                    ? String(row.tabela).padStart(2, "0")
                                    : String(row.tabela).trim().padStart(2, "0")

                            // Validar valor da promoção
                            const valor_promocao = Number(row.valor_promocao)
                            if (isNaN(valor_promocao) || valor_promocao <= 0) {
                                throw new Error("Valor de promoção inválido")
                            }

                            // Formatar data de validade
                            let data_validade: string
                            if (row.data_validade instanceof Date) {
                                data_validade = row.data_validade.toISOString().split("T")[0]
                            } else if (typeof row.data_validade === "string") {
                                // Tentar converter string para data
                                const parts = row.data_validade.split("/")
                                if (parts.length === 3) {
                                    // Formato DD/MM/YYYY
                                    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                                    if (!isNaN(date.getTime())) {
                                        data_validade = date.toISOString().split("T")[0]
                                    } else {
                                        throw new Error("Data de validade inválida")
                                    }
                                } else {
                                    // Tentar como ISO string
                                    const date = new Date(row.data_validade)
                                    if (!isNaN(date.getTime())) {
                                        data_validade = date.toISOString().split("T")[0]
                                    } else {
                                        throw new Error("Data de validade inválida")
                                    }
                                }
                            } else if (typeof row.data_validade === "number") {
                                // Excel armazena datas como números de dias desde 1/1/1900
                                // Converter para data
                                const excelDate = XLSX.SSF.parse_date_code(row.data_validade)
                                const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d)
                                data_validade = date.toISOString().split("T")[0]
                            } else {
                                throw new Error("Data de validade inválida")
                            }

                            // Verificar se a data de validade é futura
                            const hoje = new Date()
                            hoje.setHours(0, 0, 0, 0)
                            const dataVal = new Date(data_validade)
                            if (dataVal < hoje) {
                                throw new Error("Data de validade deve ser futura")
                            }

                            produtosFormatados.push({
                                codproduto,
                                codloja,
                                tabela,
                                valor_promocao,
                                data_validade,
                            })
                        } catch (error) {
                            console.error(`Erro ao processar linha ${i + 1}:`, error)
                            errosValidacao.push(`Linha ${i + 1}: ${(error as Error).message}`)
                        }
                    }

                    if (produtosFormatados.length === 0) {
                        setError(`Nenhum produto válido encontrado na planilha. Erros: ${errosValidacao.join(", ")}`)
                        setProdutos([])
                    } else {
                        setProdutos(produtosFormatados)
                        if (errosValidacao.length > 0) {
                            setError(`Alguns produtos não puderam ser processados: ${errosValidacao.join(", ")}`)
                        }
                    }
                    setLoading(false)
                } catch (err) {
                    console.error("Erro ao processar arquivo:", err)
                    setError(`Erro ao processar o arquivo: ${(err as Error).message}`)
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
            setError(`Erro ao processar o arquivo: ${(err as Error).message}`)
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
            const result = await onImport(produtos)
            setResultado(result)
        } catch (err) {
            console.error("Erro na importação:", err)
            setError(`Erro ao importar produtos: ${(err as Error).message}`)
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

    // Função para formatar o valor da promoção para exibição
    const formatarValor = (valor: number): string => {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    }

    // Função para formatar a data para exibição
    const formatarData = (data: string): string => {
        const [ano, mes, dia] = data.split("-")
        return `${dia}/${mes}/${ano}`
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Importar Produtos em Promoção</DialogTitle>
            <DialogContent>
                {!resultado ? (
                    <>
                        <Typography variant="body1" gutterBottom>
                            Selecione uma planilha Excel com os produtos para importar em promoção.
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            A planilha deve conter as colunas: codproduto, codloja, tabela, valor_promocao e data_validade.
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
                            onClick={() => document.getElementById("file-upload-promocao")?.click()}
                        >
                            <input
                                id="file-upload-promocao"
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
                                    sx={{ maxHeight: 300, overflow: "auto", p: 1, bgcolor: "background.default" }}
                                >
                                    <List dense>
                                        {produtos.slice(0, 100).map((produto, index) => (
                                            <ListItem key={index} dense>
                                                <ListItemText
                                                    primary={`Produto: ${produto.codproduto} - Loja: ${produto.codloja} - Tabela: ${produto.tabela
                                                        } - Valor: ${formatarValor(produto.valor_promocao)} - Validade: ${formatarData(
                                                            produto.data_validade,
                                                        )}`}
                                                />
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

export default ImportacaoPromocao
