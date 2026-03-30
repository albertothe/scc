"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import RefreshIcon from "@mui/icons-material/Refresh"
import Paginacao from "../components/Paginacao"
import ImportacaoFacing from "../components/ImportacaoFacing"
import { exportarModeloFacing } from "../services/excelService"
import {
  atualizarProdutoFacing,
  getFiltrosFacing,
  getProdutosFacing,
  importarProdutosFacing,
} from "../services/produtoService"
import type { FacingFiltros, ProdutoFacing } from "../types"

const ProdutosFacing: React.FC = () => {
  const [filtros, setFiltros] = useState<FacingFiltros>({ fornecedores: [], grupos: [], compradores: [], statusProdutos: [], lojas: [] })
  const [items, setItems] = useState<ProdutoFacing[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [openImport, setOpenImport] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [novoFacing, setNovoFacing] = useState<number>(0)

  const [fornecedor, setFornecedor] = useState("")
  const [grupo, setGrupo] = useState("")
  const [comprador, setComprador] = useState("")
  const [status, setStatus] = useState("")
  const [loja, setLoja] = useState("")
  const [busca, setBusca] = useState("")

  const params = useMemo(() => ({ fornecedor, grupo, comprador, status, loja, busca, page, limit: rowsPerPage }), [fornecedor, grupo, comprador, status, loja, busca, page, rowsPerPage])

  const carregar = async () => {
    try {
      const [filtrosResp, dataResp] = await Promise.all([getFiltrosFacing(), getProdutosFacing(params)])
      setFiltros(filtrosResp)
      setItems(dataResp.items)
      setTotal(dataResp.total)
    } finally {
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const salvar = async (row: ProdutoFacing) => {
    await atualizarProdutoFacing(row.codloja, row.codproduto, novoFacing)
    setEditingKey(null)
    carregar()
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Produtos Facing</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Fornecedor" value={fornecedor} onChange={(e) => { setFornecedor(e.target.value); setPage(1) }}><MenuItem value="">Todos</MenuItem>{filtros.fornecedores.map((f) => <MenuItem key={f.codfornecedor} value={f.codfornecedor}>{f.fornecedor}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Grupo" value={grupo} onChange={(e) => { setGrupo(e.target.value); setPage(1) }}><MenuItem value="">Todos</MenuItem>{filtros.grupos.map((g) => <MenuItem key={g.codgrupo} value={g.codgrupo}>{g.grupo} - {g.subgrupo}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Comprador" value={comprador} onChange={(e) => { setComprador(e.target.value); setPage(1) }}><MenuItem value="">Todos</MenuItem>{filtros.compradores.map((c) => <MenuItem key={c.comprador} value={c.comprador}>{c.comprador}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Status produto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><MenuItem value="">Todos</MenuItem>{filtros.statusProdutos.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField select fullWidth label="Loja" value={loja} onChange={(e) => { setLoja(e.target.value); setPage(1) }}><MenuItem value="">Todas</MenuItem>{filtros.lojas.map((l) => <MenuItem key={l.codloja} value={l.codloja}>{l.codloja} - {l.loja}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Pesquisa produto" value={busca} onChange={(e) => { setBusca(e.target.value); setPage(1) }} /></Grid>
            <Grid item xs={12} md={12} sx={{ display: "flex", gap: 1 }}>
              <Button startIcon={<RefreshIcon />} variant="outlined" onClick={carregar}>Atualizar</Button>
              <Button startIcon={<UploadFileIcon />} variant="outlined" onClick={exportarModeloFacing}>Baixar layout</Button>
              <Button startIcon={<UploadFileIcon />} variant="contained" onClick={() => setOpenImport(true)}>Importar planilha</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Loja</TableCell><TableCell>Cód. Produto</TableCell><TableCell>Produto</TableCell><TableCell>Fornecedor</TableCell><TableCell>Grupo</TableCell><TableCell>Comprador</TableCell><TableCell>Status</TableCell><TableCell>Facing</TableCell><TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => {
                const key = `${row.codloja}-${row.codproduto}`
                const isEditing = editingKey === key
                return (
                  <TableRow key={key}>
                    <TableCell>{row.codloja} - {row.loja}</TableCell>
                    <TableCell>{row.codproduto}</TableCell>
                    <TableCell>{row.produto}</TableCell>
                    <TableCell>{row.fornecedor}</TableCell>
                    <TableCell>{row.grupo} / {row.subgrupo}</TableCell>
                    <TableCell>{row.comprador}</TableCell>
                    <TableCell>{row.status_produto}</TableCell>
                    <TableCell>
                      {isEditing ? <TextField size="small" type="number" value={novoFacing} onChange={(e) => setNovoFacing(Number(e.target.value))} /> : row.qtde_estoque_facing}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <IconButton color="primary" onClick={() => salvar(row)}><SaveIcon /></IconButton>
                      ) : (
                        <IconButton onClick={() => { setEditingKey(key); setNovoFacing(Number(row.qtde_estoque_facing || 0)) }}><EditIcon /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Paginacao
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }}
        />
      </Paper>

      <ImportacaoFacing
        open={openImport}
        onClose={() => setOpenImport(false)}
        onDownloadLayout={exportarModeloFacing}
        onImport={async (produtos) => {
          const r = await importarProdutosFacing(produtos)
          await carregar()
          return r
        }}
      />
    </Box>
  )
}

export default ProdutosFacing
