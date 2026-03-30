"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import * as XLSX from "xlsx"

interface Props {
  open: boolean
  onClose: () => void
  onImport: (produtos: { codproduto: string; valor: number }[]) => Promise<{
    success: string[]
    errors: { codigo: string; motivo: string }[]
  }>
  onDownloadLayout: () => void
}

const ImportacaoCustos: React.FC<Props> = ({ open, onClose, onImport, onDownloadLayout }) => {
  const [produtos, setProdutos] = useState<{ codproduto: string; valor: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ success: string[]; errors: { codigo: string; motivo: string }[] } | null>(null)

  useEffect(() => {
    if (open) {
      setProdutos([])
      setError(null)
      setResultado(null)
    }
  }, [open])

  const handleFile = (file: File) => {
    setLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: "binary" })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

        const itens = jsonData
          .map((row) => ({
            codproduto: row.codproduto?.toString().trim().padStart(5, "0"),
            valor: Number(row.valor),
          }))
          .filter((row) => row.codproduto && !Number.isNaN(row.valor))

        if (!itens.length) {
          setError("Nenhuma linha válida encontrada. Use o layout com colunas codproduto e valor.")
        } else {
          setProdutos(itens)
          setError(null)
        }
      } catch (err) {
        setError("Erro ao processar planilha.")
      } finally {
        setLoading(false)
      }
    }

    reader.onerror = () => {
      setError("Erro ao ler arquivo")
      setLoading(false)
    }

    reader.readAsBinaryString(file)
  }

  const importar = async () => {
    setLoading(true)
    try {
      const r = await onImport(produtos)
      setResultado(r)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Importar Custos em Massa</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>Planilha esperada: codproduto, valor.</Typography>
        <Button onClick={onDownloadLayout} variant="outlined" size="small" sx={{ mb: 2 }}>
          Baixar layout custos
        </Button>

        <Box
          sx={{ border: "2px dashed #ccc", p: 3, borderRadius: 2, textAlign: "center", cursor: "pointer" }}
          onClick={() => document.getElementById("file-custos")?.click()}
        >
          <input
            id="file-custos"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <CloudUploadIcon sx={{ fontSize: 42 }} />
          <Typography>Selecionar planilha</Typography>
        </Box>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {!resultado && produtos.length > 0 && (
          <Chip sx={{ mt: 2 }} label={`${produtos.length} linhas prontas para importação`} color="primary" />
        )}

        {resultado && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">Sucesso: {resultado.success.length}</Alert>
            {resultado.errors.length > 0 && (
              <List dense>
                {resultado.errors.slice(0, 20).map((err, idx) => (
                  <ListItem key={idx}><ListItemText primary={err.codigo} secondary={err.motivo} /></ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        {!resultado && <Button onClick={importar} variant="contained" disabled={loading || produtos.length === 0}>Importar</Button>}
      </DialogActions>
    </Dialog>
  )
}

export default ImportacaoCustos
