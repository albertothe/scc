import { Box, Button, MenuItem, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { criarCompradorGrupo, listarCompradorGrupo, listarCompradores } from "../services/compradoresService"

export default function CompradoresGrupos() {
  const [compradores, setCompradores] = useState<any[]>([])
  const [vinculos, setVinculos] = useState<any[]>([])
  const [codgrp, setCodgrp] = useState("")
  const [compradorId, setCompradorId] = useState("")
  const carregar = async () => {
    setCompradores(await listarCompradores())
    setVinculos(await listarCompradorGrupo())
  }
  useEffect(() => { carregar() }, [])

  return <Box>
    <Typography variant="h5">Grupos x Compradores</Typography>
    <Box sx={{ display: "flex", gap: 2, my: 2 }}>
      <TextField label="Grupo (c_grp)" value={codgrp} onChange={(e) => setCodgrp(e.target.value)} inputProps={{ maxLength: 2 }} />
      <TextField select label="Comprador" value={compradorId} onChange={(e) => setCompradorId(e.target.value)} sx={{ minWidth: 260 }}>
        {compradores.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
      </TextField>
      <Button variant="contained" onClick={async () => { await criarCompradorGrupo({ codgrp, comprador_id: Number(compradorId) }); carregar() }}>Vincular</Button>
    </Box>
    {vinculos.map((v) => <Typography key={v.id}>{v.codgrp} - {v.comprador_nome} ({v.dt_fim ? "Histórico" : "Atual"})</Typography>)}
  </Box>
}
