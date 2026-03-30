"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Menu,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import RefreshIcon from "@mui/icons-material/Refresh"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import CloseIcon from "@mui/icons-material/Close"
import Paginacao from "../components/Paginacao"
import ImportacaoFacing from "../components/ImportacaoFacing"
import ImportacaoCustos from "../components/ImportacaoCustos"
import { exportarModeloCustos, exportarModeloFacing } from "../services/excelService"
import {
  atualizarProdutoFacing,
  importarProdutosCustos,
  getFiltrosFacing,
  getProdutosFacing,
  importarProdutosFacing,
} from "../services/produtoService"
import type { FacingFiltros, ProdutoFacing } from "../types"

const formatarNumeroBrasil = (valor?: number | null) => {
  if (valor === null || valor === undefined) return "-"
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

const ProdutosFacing: React.FC = () => {
  const [filtros, setFiltros] = useState<FacingFiltros>({ fornecedores: [], grupos: [], compradores: [], statusProdutos: [], lojas: [] })
  const [items, setItems] = useState<ProdutoFacing[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [openImport, setOpenImport] = useState(false)
  const [openImportCustos, setOpenImportCustos] = useState(false)
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [novoFacing, setNovoFacing] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<{ codproduto: string; resumo: ProdutoFacing; lojas: ProdutoFacing[] } | null>(null)

  const [fornecedor, setFornecedor] = useState("")
  const [grupo, setGrupo] = useState("")
  const [comprador, setComprador] = useState("")
  const [status, setStatus] = useState("")
  const [loja, setLoja] = useState("")
  const [busca, setBusca] = useState("")

  const params = useMemo(() => ({ fornecedor, grupo, comprador, status, loja, busca, page, limit: rowsPerPage }), [fornecedor, grupo, comprador, status, loja, busca, page, rowsPerPage])

  const carregar = async () => {
    setLoading(true)
    try {
      const [filtrosResp, dataResp] = await Promise.all([getFiltrosFacing(), getProdutosFacing(params)])
      setFiltros(filtrosResp)
      setItems(dataResp.items)
      setTotal(dataResp.total)
    } finally {
      setLoading(false)
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

  const produtosAgrupados = useMemo(() => {
    const mapa = new Map<string, ProdutoFacing[]>()
    items.forEach((item) => {
      if (!mapa.has(item.codproduto)) {
        mapa.set(item.codproduto, [])
      }
      mapa.get(item.codproduto)?.push(item)
    })
    return Array.from(mapa.entries()).map(([codproduto, lojas]) => ({
      codproduto,
      resumo: lojas[0],
      lojas,
    }))
  }, [items])

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
              <IconButton onClick={(event) => setMoreActionsAnchor(event.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={moreActionsAnchor}
                open={Boolean(moreActionsAnchor)}
                onClose={() => setMoreActionsAnchor(null)}
              >
                <MenuItem onClick={() => { exportarModeloFacing(); setMoreActionsAnchor(null) }}>
                  Baixar layout facing
                </MenuItem>
                <MenuItem onClick={() => { exportarModeloCustos(); setMoreActionsAnchor(null) }}>
                  Baixar layout custos
                </MenuItem>
                <MenuItem onClick={() => { setOpenImport(true); setMoreActionsAnchor(null) }}>
                  Importar facing
                </MenuItem>
                <MenuItem onClick={() => { setOpenImportCustos(true); setMoreActionsAnchor(null) }}>
                  Importar custos
                </MenuItem>
              </Menu>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cód. Produto</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Fornecedor</TableCell>
                <TableCell>Grupo</TableCell>
                <TableCell>Comprador</TableCell>
                <TableCell>Lojas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Carregando produtos... eles aparecerão em instantes.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : produtosAgrupados.map(({ codproduto, resumo, lojas }) => {
                return (
                  <TableRow
                    key={codproduto}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      setProdutoSelecionado({ codproduto, resumo, lojas })
                      setEditingKey(null)
                    }}
                  >
                      <TableCell>{resumo.codproduto}</TableCell>
                      <TableCell>{resumo.produto}</TableCell>
                      <TableCell>{resumo.fornecedor}</TableCell>
                      <TableCell>{resumo.grupo} / {resumo.subgrupo}</TableCell>
                      <TableCell>{resumo.comprador}</TableCell>
                      <TableCell>{lojas.length}</TableCell>
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

      <Drawer
        anchor="right"
        open={Boolean(produtoSelecionado)}
        onClose={() => setProdutoSelecionado(null)}
        hideBackdrop
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: "100%", md: "33.333vw" },
            maxWidth: 560,
            minWidth: { md: 420 },
            top: { xs: 0, md: 220 },
            height: { xs: "100%", md: "calc(100% - 220px)" },
          },
        }}
      >
        {produtoSelecionado && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Detalhes do produto</Typography>
                <IconButton onClick={() => setProdutoSelecionado(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Grid container spacing={0.5} sx={{ mt: 0.5 }}>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Código:</strong> {produtoSelecionado.resumo.codproduto}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Produto:</strong> {produtoSelecionado.resumo.produto}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Fornecedor:</strong> {produtoSelecionado.resumo.fornecedor}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Grupo/Subgrupo:</strong> {produtoSelecionado.resumo.grupo} / {produtoSelecionado.resumo.subgrupo}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Comprador:</strong> {produtoSelecionado.resumo.comprador}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" sx={{ lineHeight: 1.2 }}><strong>Total de lojas:</strong> {produtoSelecionado.lojas.length}</Typography></Grid>
              </Grid>
            </Box>
            <Divider />
            <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Lojas e números</Typography>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    py: 0.3,
                    px: 0.9,
                    fontSize: "0.72rem",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  },
                  "& .MuiTableCell-head": {
                    fontSize: "0.68rem",
                    fontWeight: 700,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Loja</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Estoque</TableCell>
                    <TableCell>Reserva</TableCell>
                    <TableCell>Saldo</TableCell>
                    <TableCell>Facing</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {produtoSelecionado.lojas.map((row) => {
                    const key = `${row.codloja}-${row.codproduto}`
                    const isEditing = editingKey === key
                    return (
                      <TableRow key={key}>
                        <TableCell>{row.loja}</TableCell>
                        <TableCell>{row.status_estoque || row.status_produto || "-"}</TableCell>
                        <TableCell>{formatarNumeroBrasil(row.qtde_estoque)}</TableCell>
                        <TableCell>{formatarNumeroBrasil(row.qtde_reserva)}</TableCell>
                        <TableCell>{formatarNumeroBrasil(row.saldo_estoque)}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={novoFacing}
                              onChange={(e) => setNovoFacing(Number(e.target.value))}
                              sx={{ "& .MuiInputBase-input": { fontSize: "0.72rem", py: 0.6 } }}
                            />
                          ) : (
                            formatarNumeroBrasil(row.qtde_estoque_facing)
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <IconButton size="small" color="primary" onClick={() => salvar(row)}><SaveIcon fontSize="small" /></IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingKey(key)
                                setNovoFacing(Number(row.qtde_estoque_facing || 0))
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}
      </Drawer>

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
      <ImportacaoCustos
        open={openImportCustos}
        onClose={() => setOpenImportCustos(false)}
        onDownloadLayout={exportarModeloCustos}
        onImport={async (produtos) => {
          const r = await importarProdutosCustos(produtos)
          await carregar()
          return r
        }}
      />
    </Box>
  )
}

export default ProdutosFacing
