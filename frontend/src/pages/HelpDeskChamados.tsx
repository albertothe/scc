"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
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
import type { ChamadoHelpDesk, ChamadoHelpDeskDetalhado, InteracaoChamado } from "../types"
import { formatarDataHora } from "../utils/formatters"

const statusOptions: ChamadoHelpDesk["status"][] = ["ABERTO", "EM ANDAMENTO", "RESOLVIDO", "FECHADO"]
const prioridadeOptions: ChamadoHelpDesk["prioridade"][] = ["BAIXO", "MÉDIO", "ALTA", "URGENTE"]
const tipoOptions: ChamadoHelpDesk["tipo"][] = ["INCIDENTE", "REQUISICAO"]
const responsaveis: NonNullable<ChamadoHelpDesk["responsavel"]>[] = ["", "ALBERTO", "WALLYSON"]
const setorOptions = [
  "ADMINISTRATIVO",
  "TRANSPORTADORA",
  "DEPOSITO",
  "RH",
  "CONTABILIDADE",
  "MARKETING",
  "COMPRAS",
  "CREDITO",
  "FINANCEIRO",
  "DIRETORIA",
  "VENDAS",
  "LABORATORIO",
  "FATURAMENTO",
]
const NIVEIS_SUPORTE = new Set(["00", "11"])

const prioridadeStyles: Record<ChamadoHelpDesk["prioridade"], { label: string; sx: object }> = {
  URGENTE: { label: "Urgente", sx: { bgcolor: "#b71c1c", color: "#fff" } },
  ALTA: { label: "Alta", sx: { bgcolor: "#ef6c00", color: "#fff" } },
  "MÉDIO": { label: "Médio", sx: { bgcolor: "#f9a825", color: "#111" } },
  BAIXO: { label: "Baixo", sx: { bgcolor: "#1565c0", color: "#fff" } },
}

const statusStyles: Record<ChamadoHelpDesk["status"], "default" | "primary" | "warning" | "success" | "error"> = {
  ABERTO: "primary",
  "EM ANDAMENTO": "warning",
  RESOLVIDO: "success",
  FECHADO: "default",
}

const autoRefreshMs = 5 * 60 * 1000

const HelpDeskChamados: React.FC = () => {
  const { usuario } = useAuth()
  const canManageResponsible = NIVEIS_SUPORTE.has(usuario?.nivel ?? "")
  const [chamados, setChamados] = useState<ChamadoHelpDesk[]>([])
  const [lojas, setLojas] = useState<string[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [responsavelFiltro, setResponsavelFiltro] = useState<"" | NonNullable<ChamadoHelpDesk["responsavel"]>>("")
  const [statusFiltro, setStatusFiltro] = useState<"" | ChamadoHelpDesk["status"]>("")
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<"" | ChamadoHelpDesk["prioridade"]>("")
  const [statusCardFiltro, setStatusCardFiltro] = useState<"" | ChamadoHelpDesk["status"]>("")
  const [dialogAberto, setDialogAberto] = useState(false)
  const [detalhe, setDetalhe] = useState<ChamadoHelpDeskDetalhado | null>(null)
  const [formChamado, setFormChamado] = useState<Partial<ChamadoHelpDesk>>({
    titulo: "",
    descricao: "",
    tipo: "INCIDENTE",
    prioridade: "MÉDIO",
    loja: "",
    setor: "ADMINISTRATIVO",
    responsavel: "",
  })
  const [novaInteracao, setNovaInteracao] = useState<Partial<InteracaoChamado>>({ mensagem: "", tipo: "COMENTARIO", status_novo: "", responsavel: "" })

  const carregarChamados = useCallback(async () => {
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
  }, [busca, prioridadeFiltro, statusFiltro])

  useEffect(() => {
    carregarChamados()
  }, [carregarChamados])

  useEffect(() => {
    const interval = window.setInterval(() => {
      carregarChamados()
    }, autoRefreshMs)

    return () => window.clearInterval(interval)
  }, [carregarChamados])

  useEffect(() => {
    const carregarLojas = async () => {
      try {
        const data = await helpDeskService.listarLojas()
        setLojas(data)
      } catch (error) {
        console.error(error)
      }
    }

    carregarLojas()
  }, [])

  const resumo = useMemo(() => ({
    ABERTO: chamados.filter((item) => item.status === "ABERTO").length,
    "EM ANDAMENTO": chamados.filter((item) => item.status === "EM ANDAMENTO").length,
    RESOLVIDO: chamados.filter((item) => item.status === "RESOLVIDO").length,
    FECHADO: chamados.filter((item) => item.status === "FECHADO").length,
  }), [chamados])

  const chamadosVisiveis = useMemo(() => {
    return chamados.filter((item) => {
      const passaStatusCard = statusCardFiltro ? item.status === statusCardFiltro : item.status !== "FECHADO"
      const passaResponsavel = responsavelFiltro ? item.responsavel === responsavelFiltro : true
      return passaStatusCard && passaResponsavel
    })
  }, [chamados, responsavelFiltro, statusCardFiltro])

  const chamadoAbertoHaMaisDe48h = (chamado: ChamadoHelpDesk) => {
    if (chamado.status !== "ABERTO" || !chamado.data_abertura) {
      return false
    }
    const dataAbertura = new Date(chamado.data_abertura)
    if (Number.isNaN(dataAbertura.getTime())) {
      return false
    }
    const horasAberto = (Date.now() - dataAbertura.getTime()) / (1000 * 60 * 60)
    return horasAberto >= 48
  }

  const detalhePermiteEditarResponsavel = canManageResponsible && detalhe?.status === "ABERTO"
  const detalheBloqueado = detalhe?.status === "FECHADO"

  const abrirDetalhe = async (id?: number) => {
    if (!id) return
    const data = await helpDeskService.obterChamado(id)
    setDetalhe(data)
    setNovaInteracao({
      mensagem: "",
      tipo: "COMENTARIO",
      status_novo: "",
      responsavel: data.responsavel || "",
    })
  }

  const salvarChamado = async () => {
    if (!formChamado.titulo?.trim()) return

    await helpDeskService.criarChamado({
      ...formChamado,
      nome_usuario_abertura: usuario?.usuario ?? "",
      status: "ABERTO",
      loja: formChamado.loja?.trim() || null,
      setor: formChamado.setor || "ADMINISTRATIVO",
      responsavel: canManageResponsible ? formChamado.responsavel || undefined : undefined,
    })

    setDialogAberto(false)
    setFormChamado({
      titulo: "",
      descricao: "",
      tipo: "INCIDENTE",
      prioridade: "MÉDIO",
      loja: "",
      setor: "ADMINISTRATIVO",
      responsavel: "",
    })
    await carregarChamados()
  }

  const salvarInteracao = async () => {
    if (!detalhe?.id || !novaInteracao.mensagem?.trim() || detalheBloqueado) return

    await helpDeskService.adicionarInteracao(detalhe.id, {
      ...novaInteracao,
      responsavel: detalhePermiteEditarResponsavel ? novaInteracao.responsavel || "" : undefined,
    })
    const atualizado = await helpDeskService.obterChamado(detalhe.id)
    setDetalhe(atualizado)
    setNovaInteracao({ mensagem: "", tipo: "COMENTARIO", status_novo: "", responsavel: atualizado.responsavel || "" })
    await carregarChamados()
  }

  const toggleStatusCard = (status: ChamadoHelpDesk["status"]) => {
    setStatusCardFiltro((current) => (current === status ? "" : status))
  }

  return (
    <Box p={3}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Help Desk - Chamados</Typography>
              <Typography color="text.secondary">
                Gestão interna de incidentes e requisições, com atualização automática a cada 5 minutos.
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

          <Grid container spacing={2} mt={1}>
            {statusOptions.map((status) => {
              const ativo = statusCardFiltro === status
              const quantidade = resumo[status]

              return (
                <Grid item xs={12} sm={6} md={3} key={status}>
                  <Card variant={ativo ? "elevation" : "outlined"} sx={{ borderColor: ativo ? "primary.main" : undefined }}>
                    <CardActionArea onClick={() => toggleStatusCard(status)}>
                      <CardContent>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {status}
                          </Typography>
                          <Typography variant="h4">{quantidade}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {ativo ? "Clique para remover o filtro" : "Clique para filtrar por este status"}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={2}>
            <Chip
              label={statusCardFiltro ? `Filtro rápido: ${statusCardFiltro}` : "Filtro rápido: ocultando fechados"}
              color={statusCardFiltro ? "primary" : "default"}
              variant={statusCardFiltro ? "filled" : "outlined"}
            />
            {statusCardFiltro && <Chip label="Limpar filtro rápido" onClick={() => setStatusCardFiltro("")} />}
          </Stack>

          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Responsável" value={responsavelFiltro} onChange={(e) => setResponsavelFiltro(e.target.value as typeof responsavelFiltro)}>
                <MenuItem value="">Todos</MenuItem>
                {responsaveis.filter(Boolean).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Status" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}>
                <MenuItem value="">Todos</MenuItem>
                {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField select fullWidth label="Prioridade" value={prioridadeFiltro} onChange={(e) => setPrioridadeFiltro(e.target.value as typeof prioridadeFiltro)}>
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
                <TableCell>Loja / Setor</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Abertura</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chamadosVisiveis.map((chamado) => (
                <TableRow
                  key={chamado.id}
                  hover
                  sx={{
                    cursor: "pointer",
                    backgroundColor: chamadoAbertoHaMaisDe48h(chamado) ? "rgba(211, 47, 47, 0.2)" : undefined,
                    "&:hover": {
                      backgroundColor: chamadoAbertoHaMaisDe48h(chamado) ? "rgba(183, 28, 28, 0.28)" : undefined,
                    },
                  }}
                  onClick={() => abrirDetalhe(chamado.id)}
                >
                  <TableCell>{chamado.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{chamado.titulo}</Typography>
                    <Typography variant="body2" color="text.secondary">{chamado.nome_usuario_abertura}</Typography>
                  </TableCell>
                  <TableCell>{chamado.tipo}</TableCell>
                  <TableCell>
                    <Chip size="small" label={chamado.status} color={statusStyles[chamado.status]} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={prioridadeStyles[chamado.prioridade].label} sx={prioridadeStyles[chamado.prioridade].sx} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{chamado.loja || "-"}</Typography>
                    <Typography variant="caption" color="text.secondary">{chamado.setor}</Typography>
                  </TableCell>
                  <TableCell>{chamado.responsavel || "-"}</TableCell>
                  <TableCell>{formatarDataHora(chamado.data_abertura || "")}</TableCell>
                </TableRow>
              ))}
              {!carregando && chamadosVisiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">Nenhum chamado encontrado.</TableCell>
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
            <TextField select label="Tipo" value={formChamado.tipo} onChange={(e) => setFormChamado({ ...formChamado, tipo: e.target.value as ChamadoHelpDesk["tipo"] })} fullWidth>
              {tipoOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select label="Prioridade" value={formChamado.prioridade} onChange={(e) => setFormChamado({ ...formChamado, prioridade: e.target.value as ChamadoHelpDesk["prioridade"] })} fullWidth>
              {prioridadeOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Loja"
              value={formChamado.loja}
              onChange={(e) => setFormChamado({ ...formChamado, loja: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Selecione</MenuItem>
              {lojas.map((loja) => <MenuItem key={loja} value={loja}>{loja}</MenuItem>)}
            </TextField>
            <TextField select label="Setor" value={formChamado.setor} onChange={(e) => setFormChamado({ ...formChamado, setor: e.target.value })} fullWidth>
              {setorOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            {canManageResponsible && (
              <TextField select label="Responsável" value={formChamado.responsavel} onChange={(e) => setFormChamado({ ...formChamado, responsavel: e.target.value as ChamadoHelpDesk["responsavel"] })} fullWidth>
                <MenuItem value="">Não atribuído</MenuItem>
                {responsaveis.filter(Boolean).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
            )}
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
                <Chip label={`Status: ${detalhe.status}`} color={statusStyles[detalhe.status]} variant="outlined" />
                <Chip label={`Prioridade: ${prioridadeStyles[detalhe.prioridade].label}`} sx={prioridadeStyles[detalhe.prioridade].sx} />
                <Chip label={`Loja: ${detalhe.loja || "-"}`} variant="outlined" />
                <Chip label={`Setor: ${detalhe.setor}`} variant="outlined" />
                <Chip label={`Responsável: ${detalhe.responsavel || "não definido"}`} variant="outlined" />
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
              {detalheBloqueado && <Alert severity="warning">Chamados fechados não podem mais receber alterações ou interações.</Alert>}
              <TextField label="Mensagem" multiline minRows={3} value={novaInteracao.mensagem} onChange={(e) => setNovaInteracao({ ...novaInteracao, mensagem: e.target.value })} fullWidth disabled={detalheBloqueado} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField select label="Tipo" value={novaInteracao.tipo} onChange={(e) => setNovaInteracao({ ...novaInteracao, tipo: e.target.value as InteracaoChamado["tipo"] })} fullWidth disabled={detalheBloqueado}>
                    <MenuItem value="COMENTARIO">COMENTARIO</MenuItem>
                    <MenuItem value="INTERNO">INTERNO</MenuItem>
                    <MenuItem value="STATUS">STATUS</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select label="Novo status" value={novaInteracao.status_novo} onChange={(e) => setNovaInteracao({ ...novaInteracao, status_novo: e.target.value as InteracaoChamado["status_novo"] })} fullWidth disabled={detalheBloqueado}>
                    <MenuItem value="">Manter status</MenuItem>
                    {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </TextField>
                </Grid>
                {detalhePermiteEditarResponsavel && (
                  <Grid item xs={12} md={4}>
                    <TextField select label="Responsável" value={novaInteracao.responsavel} onChange={(e) => setNovaInteracao({ ...novaInteracao, responsavel: e.target.value as InteracaoChamado["responsavel"] })} fullWidth disabled={detalheBloqueado}>
                      <MenuItem value="">Não atribuído</MenuItem>
                      {responsaveis.filter(Boolean).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalhe(null)}>Fechar</Button>
          <Button onClick={salvarInteracao} variant="contained" disabled={detalheBloqueado}>Adicionar interação</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HelpDeskChamados
