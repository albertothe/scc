import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material"
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useEffect, useMemo, useState } from "react"
import { excluirMetaComprador, listarCompradores, listarMetasCompradores, salvarMetaComprador } from "../services/compradoresService"

const CAMPOS_META = ["meta_vendas", "meta_lb", "meta_evolucao", "meta_nivel_servico", "meta_dias_estoque", "meta_produtos_fora"] as const

const formatarNumeroBr = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(valor) ? valor : 0)

const parseNumeroBr = (valor: string) => {
  const normalizado = valor.replace(/\./g, "").replace(",", ".").trim()
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : 0
}

function CampoNumericoBr({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (valor: number) => void
}) {
  const [texto, setTexto] = useState(formatarNumeroBr(value))

  useEffect(() => {
    setTexto(formatarNumeroBr(value))
  }, [value])

  return (
    <TextField
      label={label}
      size="small"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => {
        const numero = parseNumeroBr(texto)
        setTexto(formatarNumeroBr(numero))
        onChange(numero)
      }}
      inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
      fullWidth
    />
  )
}

const metaVazia = () => ({
  id: undefined as number | undefined,
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  codgrp: "",
  comprador_id: "",
  meta_vendas: 0,
  meta_lb: 0,
  meta_evolucao: 0,
  meta_nivel_servico: 0,
  meta_dias_estoque: 0,
  meta_produtos_fora: 0,
})

export default function CompradoresMetas() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [compradorId, setCompradorId] = useState("")
  const [compradores, setCompradores] = useState<any[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [formMeta, setFormMeta] = useState<any>(metaVazia())

  const tituloModal = useMemo(() => (formMeta?.id ? "Editar meta" : "Nova meta"), [formMeta])

  const carregar = async () => {
    setMetas(await listarMetasCompradores({ ano, mes, comprador_id: compradorId || undefined }))
    setCompradores(await listarCompradores())
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirModalNovaMeta = () => {
    setFormMeta({ ...metaVazia(), ano, mes })
    setModalAberto(true)
  }

  const abrirModalEdicao = (meta: any) => {
    setFormMeta({
      ...meta,
      comprador_id: String(meta.comprador_id ?? ""),
      ano: Number(meta.ano) || ano,
      mes: Number(meta.mes) || mes,
      ...Object.fromEntries(CAMPOS_META.map((campo) => [campo, Number(meta[campo]) || 0])),
    })
    setModalAberto(true)
  }

  const salvarMeta = async () => {
    await salvarMetaComprador({
      ...formMeta,
      comprador_id: Number(formMeta.comprador_id),
      ano: Number(formMeta.ano),
      mes: Number(formMeta.mes),
    })
    setModalAberto(false)
    await carregar()
  }

  return <Box>
    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Metas de Compradores</Typography>
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField label="Ano" type="number" size="small" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
        <TextField label="Mês" type="number" size="small" value={mes} onChange={(e) => setMes(Number(e.target.value))} />
        <TextField select label="Comprador" size="small" value={compradorId} onChange={(e) => setCompradorId(e.target.value)} sx={{ minWidth: 250 }}>
          <MenuItem value="">Todos</MenuItem>{compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={carregar}>Filtrar</Button>
        <Button variant="contained" onClick={abrirModalNovaMeta}>Nova meta</Button>
      </Box>
    </Paper>

    <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Ano</TableCell><TableCell>Mês</TableCell><TableCell>Grupo</TableCell><TableCell>Comprador</TableCell><TableCell align="right">Vendas</TableCell><TableCell align="right">LB</TableCell><TableCell align="right">Evol.</TableCell><TableCell align="right">N. Serviço</TableCell><TableCell align="right">Dias Est.</TableCell><TableCell align="right">Prod Fora</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead><TableBody>
      {metas.map((m) => <TableRow key={m.id}><TableCell>{m.ano}</TableCell><TableCell>{m.mes}</TableCell><TableCell>{m.codgrp}</TableCell><TableCell>{m.comprador_nome}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_vendas) || 0)}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_lb) || 0)}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_evolucao) || 0)}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_nivel_servico) || 0)}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_dias_estoque) || 0)}</TableCell>
        <TableCell align="right">{formatarNumeroBr(Number(m.meta_produtos_fora) || 0)}</TableCell>
        <TableCell align="right"><IconButton color="primary" onClick={() => abrirModalEdicao(m)}><EditIcon /></IconButton><IconButton color="error" onClick={async () => { await excluirMetaComprador(m.id); carregar() }}><DeleteIcon /></IconButton></TableCell></TableRow>)}
    </TableBody></Table></TableContainer>

    <Dialog open={modalAberto} onClose={() => setModalAberto(false)} fullWidth maxWidth="md">
      <DialogTitle>{tituloModal}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 1 }}>
          <TextField label="Ano" type="number" size="small" value={formMeta.ano} onChange={(e) => setFormMeta({ ...formMeta, ano: Number(e.target.value) })} />
          <TextField label="Mês" type="number" size="small" value={formMeta.mes} onChange={(e) => setFormMeta({ ...formMeta, mes: Number(e.target.value) })} />
          <TextField label="Grupo" size="small" value={formMeta.codgrp} onChange={(e) => setFormMeta({ ...formMeta, codgrp: e.target.value })} />
          <TextField select label="Comprador" size="small" value={formMeta.comprador_id} onChange={(e) => setFormMeta({ ...formMeta, comprador_id: e.target.value })}>
            {compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
          </TextField>
          {CAMPOS_META.map((k) => (
            <CampoNumericoBr key={k} label={k} value={Number(formMeta[k]) || 0} onChange={(valor) => setFormMeta({ ...formMeta, [k]: valor })} />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setModalAberto(false)}>Cancelar</Button>
        <Button variant="contained" onClick={salvarMeta}>Salvar</Button>
      </DialogActions>
    </Dialog>
  </Box>
}
