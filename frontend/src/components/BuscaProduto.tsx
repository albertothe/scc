"use client"

import type React from "react"
import { useState } from "react"
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material"
import { buscarProdutos } from "../services/produtoService"
import type { Produto } from "../types"

interface BuscaProdutoProps {
  open: boolean
  onClose: () => void
  onSelect: (produto: Produto) => void
  title: string
}

const BuscaProduto: React.FC<BuscaProdutoProps> = ({ open, onClose, onSelect, title }) => {
  const [termo, setTermo] = useState("")
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleBuscar = async () => {
    if (termo.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar")
      return
    }

    setLoading(true)
    setError("")

    try {
      const resultado = await buscarProdutos(termo)
      setProdutos(resultado)
      if (resultado.length === 0) {
        setError("Nenhum produto encontrado")
      }
    } catch (err) {
      setError("Erro ao buscar produtos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBuscar()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginBottom: 16, marginTop: 8 }}>
          <Grid item xs={9}>
            <TextField
              autoFocus
              label="Buscar produto (código ou descrição)"
              fullWidth
              variant="outlined"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBuscar}
              fullWidth
              style={{ height: "100%" }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Buscar"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" style={{ marginBottom: 16 }}>
            {error}
          </Typography>
        )}

        <Paper variant="outlined" style={{ maxHeight: 400, overflow: "auto" }}>
          <List>
            {produtos.map((produto) => (
              <ListItem button key={produto.codproduto} onClick={() => onSelect(produto)} divider>
                <ListItemText
                  primary={`${produto.codproduto} - ${produto.produto}`}
                  secondary={`Unidade: ${produto.unidade} | Status: ${produto.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BuscaProduto
