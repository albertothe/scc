"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit"
import RefreshIcon from "@mui/icons-material/Refresh"
import { useAuth } from "../contexts/AuthContext"
import * as helpDeskService from "../services/helpDeskService"
import type { AtivoHelpDesk } from "../types"
import { formatarMoeda } from "../utils/formatters"

const statusOptions = ["ativo", "manutencao", "baixado"]
const tipoOptions = ["computador", "notebook", "impressora"]

const formInicial: AtivoHelpDesk = {
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
}

const HelpDeskAtivos: React.FC = () => {
  const { temPermissaoModulo } = useAuth()
  const podeIncluir = temPermissaoModulo("help-desk", "incluir")
  const podeEditar = temPermissaoModulo("help-desk", "editar")
  const podeExcluir = temPermissaoModulo("help-desk", "excluir")

  const [ativos, setAtivos] = useState<AtivoHelpDesk[]>([])
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [ativoEmEdicao, setAtivoEmEdicao] = useState<AtivoHelpDesk | null>(null)
  const [form, setForm] = useState<AtivoHelpDesk>(formInicial)

  const exibeColunaAcoes = useMemo(() => podeEditar || podeExcluir, [podeEditar, podeExcluir])

  const carregarAtivos = useCallback(async () => {
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
  }, [busca, statusFiltro, tipoFiltro])

  useEffect(() => {
    carregarAtivos()
  }, [carregarAtivos])

  const fecharDialog = () => {
    setDialogAberto(false)
    setAtivoEmEdicao(null)
    setForm(formInicial)
  }

  const abrirNovoAtivo = () => {
    setAtivoEmEdicao(null)
    setForm(formInicial)
    setDialogAberto(true)
  }

  const abrirEdicaoAtivo = (ativo: AtivoHelpDesk) => {
    setAtivoEmEdicao(ativo)
    setForm({
      ...formInicial,
      ...ativo,
      data_compra: ativo.data_compra ? String(ativo.data_compra).slice(0, 10) : "",
      valor: ativo.valor ?? null,
    })
    setDialogAberto(true)
  }

  const salvarAtivo = async () => {
    if (!form.nome.trim()) {
      setErro("Informe o nome do ativo.")
      return
    }

    try {
      setSalvando(true)
      setErro("")

      if (ativoEmEdicao?.id) {
        await helpDeskService.atualizarAtivo(ativoEmEdicao.id, form)
      } else {
        await helpDeskService.criarAtivo(form)
      }

      fecharDialog()
      await carregarAtivos()
    } catch (error) {
      console.error(error)
      setErro("Não foi possível salvar o ativo.")
    } finally {
      setSalvando(false)
    }
  }

  const excluirAtivo = async (ativo: AtivoHelpDesk) => {
    if (!ativo.id) return

    const confirmou = window.confirm(`Deseja excluir o ativo "${ativo.nome}"?`)
    if (!confirmou) return

    try {
      setExcluindoId(ativo.id)
      setErro("")
      await helpDeskService.excluirAtivo(ativo.id)
      await carregarAtivos()
    } catch (error) {
      console.error(error)
      setErro("Não foi possível excluir o ativo.")
    } finally {
      setExcluindoId(null)
    }
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
              {podeIncluir && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovoAtivo}>Novo ativo</Button>
              )}
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
                {exibeColunaAcoes && <TableCell align="center">Ações</TableCell>}
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
                  {exibeColunaAcoes && (
                    <TableCell align="center">
                      {podeEditar && (
                        <Tooltip title="Editar ativo">
                          <IconButton color="primary" onClick={() => abrirEdicaoAtivo(ativo)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {podeExcluir && (
                        <Tooltip title="Excluir ativo">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => excluirAtivo(ativo)}
                              disabled={excluindoId === ativo.id}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {ativos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={exibeColunaAcoes ? 8 : 7} align="center">Nenhum ativo encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>

      <Dialog open={dialogAberto} onClose={fecharDialog} fullWidth maxWidth="md">
        <DialogTitle>{ativoEmEdicao ? "Editar ativo" : "Novo ativo"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} md={6}><TextField label="Nome" fullWidth value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Hostname" fullWidth value={form.nome_pc} onChange={(e) => setForm({ ...form, nome_pc: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Estação ERP" fullWidth value={form.nome_estacao_erp} onChange={(e) => setForm({ ...form, nome_estacao_erp: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField label="IP" fullWidth value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField select label="Tipo" fullWidth value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as AtivoHelpDesk["tipo"] })}>{tipoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField label="Marca" fullWidth value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Modelo" fullWidth value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Número de série" fullWidth value={form.numero_serie} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField select label="Status" fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AtivoHelpDesk["status"] })}>{statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} md={4}><TextField label="Usuário responsável" fullWidth value={form.usuario_responsavel} onChange={(e) => setForm({ ...form, usuario_responsavel: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Localização" fullWidth value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Data compra" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.data_compra || ""} onChange={(e) => setForm({ ...form, data_compra: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField label="Valor" type="number" fullWidth value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value ? Number(e.target.value) : null })} /></Grid>
            <Grid item xs={12}><TextField label="Observações" fullWidth multiline minRows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog}>Cancelar</Button>
          <Button onClick={salvarAtivo} variant="contained" disabled={salvando}>{ativoEmEdicao ? "Salvar alterações" : "Salvar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HelpDeskAtivos
