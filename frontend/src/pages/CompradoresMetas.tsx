import { Delete as DeleteIcon, Save as SaveIcon } from "@mui/icons-material"
import { Box, Button, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { excluirMetaComprador, listarCompradores, listarMetasCompradores, salvarMetaComprador } from "../services/compradoresService"

export default function CompradoresMetas() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [compradorId, setCompradorId] = useState("")
  const [compradores, setCompradores] = useState<any[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const [novo, setNovo] = useState<any>({ codgrp: "", comprador_id: "", meta_vendas: 0, meta_lb: 0, meta_evolucao: 0, meta_nivel_servico: 0, meta_dias_estoque: 0, meta_produtos_fora: 0 })

  const carregar = async () => {
    setMetas(await listarMetasCompradores({ ano, mes, comprador_id: compradorId || undefined }))
    setCompradores(await listarCompradores())
  }
  useEffect(() => { carregar() }, [])

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
      </Box>
    </Paper>

    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Nova meta</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(150px, 1fr))", gap: 1 }}>
        <TextField label="Grupo" size="small" value={novo.codgrp} onChange={(e) => setNovo({ ...novo, codgrp: e.target.value })} />
        <TextField select label="Comprador" size="small" value={novo.comprador_id} onChange={(e) => setNovo({ ...novo, comprador_id: e.target.value })}>{compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</TextField>
        {['meta_vendas','meta_lb','meta_evolucao','meta_nivel_servico','meta_dias_estoque','meta_produtos_fora'].map((k) => <TextField key={k} label={k} size="small" type="number" value={novo[k]} onChange={(e) => setNovo({ ...novo, [k]: Number(e.target.value) })} />)}
      </Box>
      <Button sx={{ mt: 1 }} variant="contained" onClick={async () => { await salvarMetaComprador({ ...novo, ano, mes, comprador_id: Number(novo.comprador_id) }); carregar() }}>Salvar</Button>
    </Paper>

    <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Grupo</TableCell><TableCell>Comprador</TableCell><TableCell>Vendas</TableCell><TableCell>LB</TableCell><TableCell>Evol.</TableCell><TableCell>N. Serviço</TableCell><TableCell>Dias Est.</TableCell><TableCell>Prod Fora</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead><TableBody>
      {metas.map((m) => <TableRow key={m.id}><TableCell>{m.codgrp}</TableCell><TableCell>{m.comprador_nome}</TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_vendas} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_vendas: Number(e.target.value) })} /></TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_lb} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_lb: Number(e.target.value) })} /></TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_evolucao} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_evolucao: Number(e.target.value) })} /></TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_nivel_servico} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_nivel_servico: Number(e.target.value) })} /></TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_dias_estoque} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_dias_estoque: Number(e.target.value) })} /></TableCell>
        <TableCell><TextField size="small" type="number" defaultValue={m.meta_produtos_fora} onBlur={async (e) => await salvarMetaComprador({ ...m, meta_produtos_fora: Number(e.target.value) })} /></TableCell>
        <TableCell align="right"><IconButton color="primary" onClick={async () => carregar()}><SaveIcon /></IconButton><IconButton color="error" onClick={async () => { await excluirMetaComprador(m.id); carregar() }}><DeleteIcon /></IconButton></TableCell></TableRow>)}
    </TableBody></Table></TableContainer>
  </Box>
}
