import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon } from "@mui/icons-material"
import { Box, Button, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { atualizarCompradorGrupo, criarCompradorGrupo, excluirCompradorGrupo, listarCompradorGrupo, listarCompradores } from "../services/compradoresService"

export default function CompradoresGrupos() {
  const [compradores, setCompradores] = useState<any[]>([])
  const [vinculos, setVinculos] = useState<any[]>([])
  const [codgrp, setCodgrp] = useState("")
  const [compradorId, setCompradorId] = useState("")
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editCodgrp, setEditCodgrp] = useState("")
  const [editCompradorId, setEditCompradorId] = useState("")

  const carregar = async () => { setCompradores(await listarCompradores()); setVinculos(await listarCompradorGrupo()) }
  useEffect(() => { carregar() }, [])

  return <Box>
    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Grupos x Compradores</Typography>
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Novo vínculo</Typography>
      <Box sx={{ display: "flex", gap: 2, my: 1, flexWrap: "wrap" }}>
        <TextField label="Grupo (c_grp)" value={codgrp} onChange={(e) => setCodgrp(e.target.value)} inputProps={{ maxLength: 2 }} size="small" />
        <TextField select label="Comprador" value={compradorId} onChange={(e) => setCompradorId(e.target.value)} sx={{ minWidth: 280 }} size="small">
          {compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={async () => { await criarCompradorGrupo({ codgrp, comprador_id: Number(compradorId) }); setCodgrp(""); setCompradorId(""); carregar() }}>Salvar</Button>
      </Box>
    </Paper>
    <TableContainer component={Paper}><Table size="small"><TableHead><TableRow><TableCell>Grupo</TableCell><TableCell>Comprador</TableCell><TableCell>Status</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead><TableBody>
      {vinculos.map((v) => <TableRow key={v.id}>
        <TableCell>{editandoId === v.id ? <TextField value={editCodgrp} size="small" onChange={(e) => setEditCodgrp(e.target.value)} /> : v.codgrp}</TableCell>
        <TableCell>{editandoId === v.id ? <TextField select size="small" value={editCompradorId} onChange={(e) => setEditCompradorId(e.target.value)} sx={{ minWidth: 220 }}>{compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}</TextField> : v.comprador_nome}</TableCell>
        <TableCell>{v.dt_fim ? "Inativo" : "Ativo"}</TableCell>
        <TableCell align="right">
          {editandoId === v.id ? <IconButton color="primary" onClick={async () => { await atualizarCompradorGrupo(v.id, { codgrp: editCodgrp, comprador_id: Number(editCompradorId) }); setEditandoId(null); carregar() }}><SaveIcon /></IconButton> : <IconButton color="primary" onClick={() => { setEditandoId(v.id); setEditCodgrp(v.codgrp); setEditCompradorId(String(v.comprador_id ?? "")) }}><EditIcon /></IconButton>}
          <IconButton color="error" onClick={async () => { await excluirCompradorGrupo(v.id); carregar() }}><DeleteIcon /></IconButton>
        </TableCell>
      </TableRow>)}
    </TableBody></Table></TableContainer>
  </Box>
}
