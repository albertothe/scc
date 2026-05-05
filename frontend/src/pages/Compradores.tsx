import { Delete as DeleteIcon, Edit as EditIcon, Refresh as RefreshIcon, Save as SaveIcon } from "@mui/icons-material"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { atualizarComprador, criarComprador, excluirComprador, listarCompradores } from "../services/compradoresService"

export default function Compradores() {
  const [nome, setNome] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [itens, setItens] = useState<any[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editNome, setEditNome] = useState("")
  const [editAtivo, setEditAtivo] = useState(true)
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

  const carregar = async () => {
    setLoading(true)
    try { setItens(await listarCompradores()) } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  return <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h5" fontWeight={700}>Compradores</Typography>
      <Button startIcon={<RefreshIcon />} variant="outlined" onClick={carregar}>Atualizar</Button>
    </Box>

    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Novo comprador</Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} size="small" sx={{ minWidth: 280 }} />
        <Box sx={{ display: "flex", alignItems: "center" }}>Ativo <Switch checked={ativo} onChange={(_, v) => setAtivo(v)} /></Box>
        <Button variant="contained" onClick={async () => { await criarComprador({ nome, ativo }); setNome(""); setAtivo(true); carregar() }}>Salvar</Button>
      </Box>
    </Paper>

    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Ativo</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow>}
          {!loading && itens.map((c) => <TableRow key={c.id}>
            <TableCell>{editandoId === c.id ? <TextField size="small" value={editNome} onChange={(e) => setEditNome(e.target.value)} /> : c.nome}</TableCell>
            <TableCell>{editandoId === c.id ? <Switch checked={editAtivo} onChange={(_, v) => setEditAtivo(v)} /> : (c.ativo ? "Sim" : "Não")}</TableCell>
            <TableCell align="right">
              {editandoId === c.id ? <IconButton color="primary" onClick={async () => { await atualizarComprador(c.id, { nome: editNome, ativo: editAtivo }); setEditandoId(null); carregar(); }}><SaveIcon /></IconButton> : <IconButton color="primary" onClick={() => { setEditandoId(c.id); setEditNome(c.nome); setEditAtivo(c.ativo) }}><EditIcon /></IconButton>}
              <IconButton color="error" onClick={async () => { await excluirComprador(c.id); carregar(); setSnackbar({ open: true, message: "Comprador excluído.", severity: "success" }) }}><DeleteIcon /></IconButton>
            </TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>

    <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
  </Box>
}
