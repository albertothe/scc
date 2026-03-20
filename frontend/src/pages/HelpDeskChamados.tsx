"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
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
import { useAuth } from "../contexts/AuthContext"
import * as helpDeskService from "../services/helpDeskService"
import type { ChamadoHelpDesk, ChamadoHelpDeskDetalhado } from "../types"
import { formatarDataHora } from "../utils/formatters"

const statusOptions = ["aberto", "em_andamento", "resolvido", "fechado"]
const prioridadeOptions = ["baixa", "media", "alta", "urgente"]
const tipoOptions = ["incidente", "requisicao"]
const responsaveis = ["", "ALBERTO", "WALLYSON"]

const HelpDeskChamados: React.FC = () => {
  const { usuario } = useAuth()
  const [chamados, setChamados] = useState<ChamadoHelpDesk[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [prioridadeFiltro, setPrioridadeFiltro] = useState("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<ChamadoHelpDeskDetalhado | null>(null)
  const [formChamado, setFormChamado] = useState({
    titulo: "",
    descricao: "",
    tipo: "incidente",
    prioridade: "media",
    categoria: "",
    responsavel: "",
  })
  const [novaInteracao, setNovaInteracao] = useState({ mensagem: "", tipo: "comentario", status_novo: "" })

  const carregarChamados = async () => {
    try {
      setCarregando(true)
      setErro("")
      const data = await helpDeskService.listarChamados({
        busca: busca || undefined,
        status: statusFiltro || undefined,
        prioridade: prioridadeFiltro || undefined,
      })
      setChamados(data)
    } catch (error) {
      console.error(error)
      setErro("Não foi possível carregar os chamados.")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarChamados()
  }, [busca, statusFiltro, prioridadeFiltro])

  const resumo = useMemo(() => ({
    abertos: chamados.filter((item) => item.status === "aberto").length,
    andamento: chamados.filter((item) => item.status === "em_andamento").length,
    fechados: chamados.filter((item) => item.status === "fechado").length,
  }), [chamados])

  const abrirDetalhe = async (id?: number) => {
    if (!id) return
    const data = await helpDeskService.obterChamado(id)
    setDetalhe(data)
  }

  const salvarChamado = async () => {
    if (!formChamado.titulo.trim()) return

    await helpDeskService.criarChamado({
      ...formChamado,
      nome_usuario_abertura: usuario?.usuario ?? "",
      status: "aberto",
    })

    setDialogAberto(false)
    setFormChamado({ titulo: "", descricao: "", tipo: "incidente", prioridade: "media", categoria: "", responsavel: "" })
    await carregarChamados()
  }

  const salvarInteracao = async () => {
    if (!detalhe?.id || !novaInteracao.mensagem.trim()) return

    await helpDeskService.adicionarInteracao(detalhe.id, novaInteracao)
    const atualizado = await helpDeskService.obterChamado(detalhe.id)
    setDetalhe(atualizado)
    setNovaInteracao({ mensagem: "", tipo: "comentario", status_novo: "" })
    await carregarChamados()
  }

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Help Desk - Chamados</Typography>
              <Typography color="text.secondary">
                Gestão interna de incidentes e requisições, sem dependência do GLPI.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={carregarChamados}>
                Atualizar
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogAberto(true)}>
                Novo chamado
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={2}>
            <Chip label={`Abertos: ${resumo.abertos}`} color="primary" variant="outlined" />
            <Chip label={`Em andamento: ${resumo.andamento}`} color="warning" variant="outlined" />
            <Chip label={`Fechados: ${resumo.fechados}`} color="success" variant="outlined" />
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
              <TextField select fullWidth label="Prioridade" value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {prioridadeOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {erro && <Alert severity="error">{erro}</Alert>}

        <Paper sx={{ overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Abertura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chamados.map((chamado) => (
                <TableRow key={chamado.id} hover sx={{ cursor: "pointer" }} onClick={() => abrirDetalhe(chamado.id)}>
                  <TableCell>{chamado.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{chamado.titulo}</Typography>
                    <Typography variant="body2" color="text.secondary">{chamado.nome_usuario_abertura}</Typography>
                  </TableCell>
                  <TableCell>{chamado.tipo}</TableCell>
                  <TableCell>{chamado.status}</TableCell>
                  <TableCell>{chamado.prioridade}</TableCell>
                  <TableCell>{chamado.responsavel || "-"}</TableCell>
                  <TableCell>{formatarDataHora(chamado.data_abertura || "")}</TableCell>
                </TableRow>
              ))}
              {!carregando && chamados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nenhum chamado encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo chamado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Título" value={formChamado.titulo} onChange={(e) => setFormChamado({ ...formChamado, titulo: e.target.value })} fullWidth />
            <TextField label="Descrição" value={formChamado.descricao} onChange={(e) => setFormChamado({ ...formChamado, descricao: e.target.value })} fullWidth multiline minRows={4} />
            <TextField select label="Tipo" value={formChamado.tipo} onChange={(e) => setFormChamado({ ...formChamado, tipo: e.target.value })} fullWidth>
              {tipoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select label="Prioridade" value={formChamado.prioridade} onChange={(e) => setFormChamado({ ...formChamado, prioridade: e.target.value })} fullWidth>
              {prioridadeOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField label="Categoria" value={formChamado.categoria} onChange={(e) => setFormChamado({ ...formChamado, categoria: e.target.value })} fullWidth />
            <TextField select label="Responsável" value={formChamado.responsavel} onChange={(e) => setFormChamado({ ...formChamado, responsavel: e.target.value })} fullWidth>
              <MenuItem value="">Não atribuído</MenuItem>
              {responsaveis.filter(Boolean).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button onClick={salvarChamado} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detalhe)} onClose={() => setDetalhe(null)} fullWidth maxWidth="md">
        <DialogTitle>Detalhes do chamado</DialogTitle>
        <DialogContent>
          {detalhe && (
            <Stack spacing={2} mt={1}>
              <Box>
                <Typography variant="h6">#{detalhe.id} - {detalhe.titulo}</Typography>
                <Typography color="text.secondary">{detalhe.descricao || "Sem descrição."}</Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`Status: ${detalhe.status}`} />
                <Chip label={`Prioridade: ${detalhe.prioridade}`} />
                <Chip label={`Responsável: ${detalhe.responsavel || "não definido"}`} />
              </Stack>
              <Divider />
              <Typography variant="subtitle1">Histórico</Typography>
              <List dense>
                {detalhe.interacoes.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={`${item.nome_usuario} • ${item.tipo}${item.status_novo ? ` • ${item.status_novo}` : ""}`}
                      secondary={`${item.mensagem} — ${formatarDataHora(item.data_criacao || "")}`}
                    />
                  </ListItem>
                ))}
                {detalhe.interacoes.length === 0 && <ListItem><ListItemText primary="Sem interações registradas." /></ListItem>}
              </List>
              <Divider />
              <Typography variant="subtitle1">Nova interação</Typography>
              <TextField label="Mensagem" multiline minRows={3} value={novaInteracao.mensagem} onChange={(e) => setNovaInteracao({ ...novaInteracao, mensagem: e.target.value })} fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField select label="Tipo" value={novaInteracao.tipo} onChange={(e) => setNovaInteracao({ ...novaInteracao, tipo: e.target.value })} fullWidth>
                    <MenuItem value="comentario">comentario</MenuItem>
                    <MenuItem value="interno">interno</MenuItem>
                    <MenuItem value="status">status</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select label="Novo status" value={novaInteracao.status_novo} onChange={(e) => setNovaInteracao({ ...novaInteracao, status_novo: e.target.value })} fullWidth>
                    <MenuItem value="">Manter status</MenuItem>
                    {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalhe(null)}>Fechar</Button>
          <Button onClick={salvarInteracao} variant="contained">Adicionar interação</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HelpDeskChamados
