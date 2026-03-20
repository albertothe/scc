"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RefreshIcon from "@mui/icons-material/Refresh"
import * as helpDeskService from "../services/helpDeskService"
import type { AtivoHelpDesk } from "../types"
import { formatarData, formatarMoeda } from "../utils/formatters"

const statusOptions = ["ativo", "manutencao", "baixado"]
const tipoOptions = ["computador", "notebook", "impressora"]

const HelpDeskAtivos: React.FC = () => {
  const [ativos, setAtivos] = useState<AtivoHelpDesk[]>([])
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [form, setForm] = useState<AtivoHelpDesk>({
    nome: "",
    nome_pc: "",
    nome_estacao_erp: "",
    ip: "",
    tipo: "computador",
    marca: "",
    modelo: "",
    numero_serie: "",
    status: "ativo",
    usuario_responsavel: "",
    localizacao: "",
    data_compra: "",
    valor: null,
    observacoes: "",
  })

  const carregarAtivos = async () => {
    try {
      setErro("")
      const data = await helpDeskService.listarAtivos({
        busca: busca || undefined,
        status: statusFiltro || undefined,
        tipo: tipoFiltro || undefined,
      })
      setAtivos(data)
    } catch (error) {
      console.error(error)
      setErro("Não foi possível carregar os ativos.")
    }
  }

  useEffect(() => {
    carregarAtivos()
  }, [busca, statusFiltro, tipoFiltro])

  const salvarAtivo = async () => {
    if (!form.nome.trim()) return
    await helpDeskService.criarAtivo(form)
    setDialogAberto(false)
    setForm({
      nome: "",
      nome_pc: "",
      nome_estacao_erp: "",
      ip: "",
      tipo: "computador",
      marca: "",
      modelo: "",
      numero_serie: "",
      status: "ativo",
      usuario_responsavel: "",
      localizacao: "",
      data_compra: "",
      valor: null,
      observacoes: "",
    })
    await carregarAtivos()
  }

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Help Desk - Ativos</Typography>
              <Typography color="text.secondary">
                Cadastro interno de equipamentos, inventário e rastreabilidade operacional.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={carregarAtivos}>Atualizar</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogAberto(true)}>Novo ativo</Button>
            </Stack>
          </Stack>

          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Status" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth label="Tipo" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {tipoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {erro && <Alert severity="error">{erro}</Alert>}

        <Paper sx={{ overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usuário</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ativos.map((ativo) => (
                <TableRow key={ativo.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{ativo.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">{ativo.localizacao || "Sem localização"}</Typography>
                  </TableCell>
                  <TableCell>{ativo.tipo || "-"}</TableCell>
                  <TableCell>{ativo.status || "-"}</TableCell>
                  <TableCell>{ativo.usuario_responsavel || "-"}</TableCell>
                  <TableCell>{ativo.nome_pc || "-"}</TableCell>
                  <TableCell>{ativo.ip || "-"}</TableCell>
                  <TableCell>{ativo.valor ? formatarMoeda(Number(ativo.valor)) : "-"}</TableCell>
                </TableRow>
              ))}
              {ativos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nenhum ativo encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="md">
        <DialogTitle>Novo ativo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} md={6}><TextField label="Nome" fullWidth value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Hostname" fullWidth value={form.nome_pc} onChange={(e) => setForm({ ...form, nome_pc: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Estação ERP" fullWidth value={form.nome_estacao_erp} onChange={(e) => setForm({ ...form, nome_estacao_erp: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="IP" fullWidth value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField select label="Tipo" fullWidth value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>{tipoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField label="Marca" fullWidth value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Modelo" fullWidth value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Número de série" fullWidth value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField select label="Status" fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AtivoHelpDesk['status'] })}>{statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField label="Usuário responsável" fullWidth value={form.usuario_responsavel} onChange={(e) => setForm({ ...form, usuario_responsavel: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Localização" fullWidth value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Data compra" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.data_compra || ""} onChange={(e) => setForm({ ...form, data_compra: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Valor" type="number" fullWidth value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value ? Number(e.target.value) : null })} /></Grid>
            <Grid item xs={12}><TextField label="Observações" fullWidth multiline minRows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button onClick={salvarAtivo} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HelpDeskAtivos
