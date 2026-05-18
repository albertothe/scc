"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import * as XLSX from "xlsx"
import type { DreF360Registro } from "../types"
import { atualizarDreF360, getDreF360, getLojasF360 } from "../services/dreF360Service"
import { useAuth } from "../contexts/AuthContext"

// ── Tipos internos da árvore ───────────────────────────────────────────────
type SubGrupo = {
  key: string                   // `${descricao}||${subdescricao ?? NULL_MARKER}`
  subdescricao: string | null
  items: DreF360Registro[]
}

type GrupoDescricao = {
  descricao: string
  subgrupos: SubGrupo[]
  allItems: DreF360Registro[]   // todos os itens deste grupo (facilita somas)
}

const NULL_MARKER = "\x00"

// ── Helpers ────────────────────────────────────────────────────────────────
const somarCampo = (
  items: DreF360Registro[],
  campo: "realizado" | "orcado" | "rlr" | "rlo",
): number | null => {
  const nums = items.map((r) => r[campo]).filter((v): v is number => v !== null)
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null
}

// ── Componente principal ──────────────────────────────────────────────────
const DreF360: React.FC = () => {
  const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [registros, setRegistros] = useState<DreF360Registro[]>([])
  const [registrosBase, setRegistrosBase] = useState<DreF360Registro[]>([])
  const [opcoesDescricao, setOpcoesDescricao] = useState<string[]>([])
  const [lojas, setLojas] = useState<string[]>([])
  const [filtros, setFiltros] = useState({ ano: "", mes: "", codloja: "", descricao: "" })
  const [carregando, setCarregando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "success" | "error"; texto: string } | null>(null)
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const [valoresEditando, setValoresEditando] = useState<Record<string, string>>({})
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  // Estado de expansão
  const [expandedDescricoes, setExpandedDescricoes] = useState<Set<string>>(new Set())
  const [expandedSubDescricoes, setExpandedSubDescricoes] = useState<Set<string>>(new Set())

  const { temPermissaoModulo } = useAuth()
  const podeEditar = temPermissaoModulo("dre", "editar")
  const menuAberto = Boolean(menuAnchorEl)

  // ── Carrega lojas ao montar ──────────────────────────────────────────────
  useEffect(() => {
    getLojasF360().then(setLojas).catch(() => setLojas([]))
  }, [])

  // ── Helpers de chave e formatação ────────────────────────────────────────
  const getRegistroKey = (registro: DreF360Registro, campo: "realizado" | "orcado") =>
    `${registro.sequencial}-${registro.codloja}-${registro.ano}-${registro.mes}-${campo}`

  const converterParaNumero = (valor: number | string | null) => {
    if (valor === null || valor === "") return null
    if (typeof valor === "number") return Number.isNaN(valor) ? null : valor
    const n = Number(valor)
    return Number.isNaN(n) ? null : n
  }

  const normalizarCabecalho = (cabecalho: string) =>
    cabecalho
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "")

  const formatarParaEdicao = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)
    if (numero === null) return ""
    return numero.toFixed(2).replace(".", ",")
  }

  const normalizarEntradaMoeda = (valor: string) => {
    const apenasPermitidos = valor.replace(/[^\d,]/g, "")
    const [parteInteira, ...partesDecimais] = apenasPermitidos.split(",")
    const parteDecimal = partesDecimais.join("").slice(0, 2)
    if (partesDecimais.length === 0) return parteInteira
    return `${parteInteira},${parteDecimal}`
  }

  const formatarValor = (valor: number | string | null) => {
    const numero = converterParaNumero(valor)
    if (numero === null) return ""
    return formatadorMoeda.format(numero)
  }

  // ── Árvore de agrupamento (memoizada) ────────────────────────────────────
  const arvore = useMemo((): GrupoDescricao[] => {
    const map = new Map<string, Map<string, DreF360Registro[]>>()
    for (const r of registros) {
      const desc = r.descricao
      const subKey = r.subdescricao ?? NULL_MARKER
      if (!map.has(desc)) map.set(desc, new Map())
      const subMap = map.get(desc)!
      if (!subMap.has(subKey)) subMap.set(subKey, [])
      subMap.get(subKey)!.push(r)
    }
    return Array.from(map.entries()).map(([descricao, subMap]) => {
      const subgrupos: SubGrupo[] = Array.from(subMap.entries()).map(([subKey, items]) => ({
        key: `${descricao}||${subKey}`,
        subdescricao: subKey === NULL_MARKER ? null : subKey,
        items,
      }))
      return { descricao, subgrupos, allItems: subgrupos.flatMap((s) => s.items) }
    })
  }, [registros])

  // ── Expand / collapse ─────────────────────────────────────────────────────
  const toggleDescricao = (desc: string) => {
    setExpandedDescricoes((prev) => {
      const next = new Set(prev)
      next.has(desc) ? next.delete(desc) : next.add(desc)
      return next
    })
  }

  const toggleSubDescricao = (key: string) => {
    setExpandedSubDescricoes((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const expandirTudo = () => {
    setExpandedDescricoes(new Set(registros.map((r) => r.descricao)))
    setExpandedSubDescricoes(
      new Set(registros.map((r) => `${r.descricao}||${r.subdescricao ?? NULL_MARKER}`)),
    )
  }

  const recolherTudo = () => {
    setExpandedDescricoes(new Set())
    setExpandedSubDescricoes(new Set())
  }

  // ── Filtro + carregamento ─────────────────────────────────────────────────
  const aplicarFiltroDescricao = useCallback((dados: DreF360Registro[], descricao: string) => {
    if (!descricao) return dados
    return dados.filter((r) => r.descricao === descricao)
  }, [])

  const carregar = useCallback(async () => {
    if (!filtros.ano || !filtros.mes || !filtros.codloja) {
      setFiltroAplicado(false)
      setRegistros([])
      return
    }
    setCarregando(true)
    try {
      const data = await getDreF360({ ano: filtros.ano, mes: filtros.mes, codloja: filtros.codloja })
      const descricoes = [...new Set(data.map((r) => r.descricao))].sort((a, b) => a.localeCompare(b))
      setRegistrosBase(data)
      setOpcoesDescricao(descricoes)
      setRegistros(aplicarFiltroDescricao(data, filtros.descricao))
      setValoresEditando({})
      setExpandedDescricoes(new Set())
      setExpandedSubDescricoes(new Set())
      setMensagem(null)
      setFiltroAplicado(true)
    } catch (error) {
      console.error("Erro ao carregar DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao carregar dados." })
    } finally {
      setCarregando(false)
    }
  }, [aplicarFiltroDescricao, filtros.ano, filtros.codloja, filtros.descricao, filtros.mes])

  const alterarDescricao = (descricao: string) => {
    setFiltros((prev) => ({ ...prev, descricao }))
    if (filtroAplicado) setRegistros(aplicarFiltroDescricao(registrosBase, descricao))
  }

  // ── Edição de valores ─────────────────────────────────────────────────────
  const alterarValor = (registro: DreF360Registro, campo: "realizado" | "orcado", valor: string) => {
    const valorNormalizado = normalizarEntradaMoeda(valor)
    const valorSemMascara = valorNormalizado.replace(",", ".")
    const valorConvertido = valorSemMascara === "" ? null : Number(valorSemMascara)
    if (valorSemMascara !== "" && Number.isNaN(valorConvertido)) return

    setValoresEditando((prev) => ({
      ...prev,
      [getRegistroKey(registro, campo)]: valorNormalizado,
    }))

    setRegistros((prev) =>
      prev.map((r) =>
        r.sequencial === registro.sequencial && r.codloja === registro.codloja
          ? { ...r, [campo]: valorConvertido }
          : r,
      ),
    )
  }

  const iniciarEdicaoValor = (registro: DreF360Registro, campo: "realizado" | "orcado") => {
    setValoresEditando((prev) => ({
      ...prev,
      [getRegistroKey(registro, campo)]: formatarParaEdicao(registro[campo]),
    }))
  }

  const finalizarEdicaoValor = (registro: DreF360Registro, campo: "realizado" | "orcado") => {
    const chave = getRegistroKey(registro, campo)
    setValoresEditando((prev) => {
      if (!(chave in prev)) return prev
      const next = { ...prev }
      delete next[chave]
      return next
    })
  }

  const getValorCampo = (registro: DreF360Registro, campo: "realizado" | "orcado") =>
    valoresEditando[getRegistroKey(registro, campo)] ?? formatarValor(registro[campo])

  const salvarLinha = async (registro: DreF360Registro) => {
    try {
      await atualizarDreF360(registro.sequencial, registro.codloja, {
        ano: registro.ano,
        mes: registro.mes,
        realizado: registro.realizado,
        orcado: registro.orcado,
      })
      setMensagem({ tipo: "success", texto: "Registro salvo com sucesso." })
    } catch (error) {
      console.error("Erro ao salvar linha DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao salvar registro." })
    }
  }

  // ── Exportação / importação ───────────────────────────────────────────────
  const exportarFiltrado = () => {
    if (!registros.length) { setMensagem({ tipo: "error", texto: "Não há registros para exportar." }); return }
    const dados = registros.map((r) => ({
      sequencial: r.sequencial, codloja: r.codloja, ano: r.ano, mes: r.mes,
      descricao: r.descricao, subdescricao: r.subdescricao ?? "", detalhamento: r.detalhamento ?? "",
      realizado: r.realizado, orcado: r.orcado, rlr: r.rlr, rlo: r.rlo,
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), "DRE_F360")
    XLSX.writeFile(wb, `dre_f360_${filtros.codloja}_${filtros.ano}_${filtros.mes}.xlsx`)
    setMensagem({ tipo: "success", texto: "Exportação concluída com sucesso." })
  }

  const exportarLayoutImportacao = () => {
    if (!registros.length) { setMensagem({ tipo: "error", texto: "Filtre os dados antes de baixar o layout." }); return }
    const dados = registros.map((r) => ({ sequencial: r.sequencial, codloja: r.codloja, ano: r.ano, mes: r.mes, valor: "" }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), "Layout_DRE_F360")
    XLSX.writeFile(wb, `layout_dre_f360_${filtros.codloja}_${filtros.ano}_${filtros.mes}.xlsx`)
    setMensagem({ tipo: "success", texto: "Layout baixado com sucesso." })
  }

  const processarImportacao = async (arquivo: File, campo: "realizado" | "orcado") => {
    if (!registros.length) { setMensagem({ tipo: "error", texto: "Filtre os dados antes de importar." }); return }
    setImportando(true); setMensagem(null)
    try {
      const buffer = await arquivo.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const wsName = wb.SheetNames[0]
      if (!wsName) throw new Error("Planilha sem abas válidas.")
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wsName], { raw: false, defval: "" })
      if (!linhas.length) throw new Error("A planilha está vazia.")

      const idx = new Map(registros.map((r) => [`${String(r.sequencial).trim()}-${r.codloja}-${r.ano}-${r.mes}`, r]))
      let atualizados = 0

      for (const linha of linhas) {
        const norm = Object.entries(linha).reduce<Record<string, unknown>>((acc, [k, v]) => {
          acc[normalizarCabecalho(k)] = v; return acc
        }, {})
        const seq = String(norm.sequencial ?? "").trim()
        const loja = String(norm.codloja ?? "").trim()
        const ano = Number(norm.ano)
        const mes = Number(norm.mes)
        const rawVal = norm.valor ?? norm[campo] ?? (campo === "orcado" ? norm.orcado : norm.realizado)
        const valor = (() => {
          const s = String(rawVal ?? "").trim().replace(/\./g, "").replace(",", ".")
          return s === "" ? null : Number(s)
        })()
        if (!seq || !loja || Number.isNaN(ano) || Number.isNaN(mes) || (valor !== null && Number.isNaN(valor))) continue
        const reg = idx.get(`${seq}-${loja}-${ano}-${mes}`)
        if (!reg) continue
        await atualizarDreF360(seq, loja, {
          ano, mes,
          realizado: campo === "realizado" ? valor : reg.realizado,
          orcado: campo === "orcado" ? valor : reg.orcado,
        })
        atualizados++
      }
      await carregar()
      setMensagem({
        tipo: atualizados > 0 ? "success" : "error",
        texto: atualizados > 0
          ? `${atualizados} registro(s) importado(s) para ${campo === "realizado" ? "Realizado" : "Orçado"}.`
          : "Nenhum registro correspondente encontrado.",
      })
    } catch (error) {
      console.error("Erro ao importar DRE F360", error)
      setMensagem({ tipo: "error", texto: "Erro ao importar. Verifique o formato (sequencial, codloja, ano, mes, valor)." })
    } finally { setImportando(false) }
  }

  const abrirImportacao = (campo: "realizado" | "orcado") => {
    const input = document.createElement("input")
    input.type = "file"; input.accept = ".xlsx,.xls"
    input.onchange = async (e) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) await processarImportacao(f, campo)
    }
    input.click()
  }

  const abrirMenuOpcoes = (e: React.MouseEvent<HTMLElement>) => setMenuAnchorEl(e.currentTarget)
  const fecharMenuOpcoes = () => setMenuAnchorEl(null)
  const acaoMenuOpcoes = (fn: () => void) => { fecharMenuOpcoes(); fn() }

  // ── Helper: células de soma para linhas de resumo ────────────────────────
  const renderSomas = (items: DreF360Registro[], bold = false) => {
    const sx = bold ? { fontWeight: 700 } : { color: "text.secondary" }
    return (
      <>
        <TableCell align="right" sx={sx}>{formatarValor(somarCampo(items, "realizado"))}</TableCell>
        <TableCell align="right" sx={sx}>{formatarValor(somarCampo(items, "orcado"))}</TableCell>
        <TableCell align="right" sx={{ color: "text.secondary" }}>{formatarValor(somarCampo(items, "rlr"))}</TableCell>
        <TableCell align="right" sx={{ color: "text.secondary" }}>{formatarValor(somarCampo(items, "rlo"))}</TableCell>
        {podeEditar && <TableCell />}
      </>
    )
  }

  // ── Número de colunas (para colspan em mensagem vazia) ────────────────────
  const numCols = podeEditar ? 9 : 8

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>DRE F360</Typography>

      {/* ── Filtros ── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
          <TextField
            label="Ano" value={filtros.ano} sx={{ width: 90 }}
            onChange={(e) => setFiltros((p) => ({ ...p, ano: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
          />
          <TextField
            label="Mês" value={filtros.mes} sx={{ width: 70 }}
            onChange={(e) => setFiltros((p) => ({ ...p, mes: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="f360-loja-label">Loja</InputLabel>
            <Select labelId="f360-loja-label" value={filtros.codloja} label="Loja"
              onChange={(e) => setFiltros((p) => ({ ...p, codloja: e.target.value }))}>
              <MenuItem value="">Selecione</MenuItem>
              {lojas.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="f360-desc-label">Descrição</InputLabel>
            <Select labelId="f360-desc-label" value={filtros.descricao} label="Descrição"
              onChange={(e) => alterarDescricao(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {opcoesDescricao.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={carregar}
            disabled={carregando || !filtros.ano || !filtros.mes || !filtros.codloja}>
            Filtrar
          </Button>

          {/* Expandir / Recolher tudo */}
          {filtroAplicado && registros.length > 0 && (
            <>
              <Tooltip title="Expandir todos os níveis">
                <Button variant="outlined" size="small" onClick={expandirTudo}>Expandir tudo</Button>
              </Tooltip>
              <Tooltip title="Recolher todos os níveis">
                <Button variant="outlined" size="small" onClick={recolherTudo}>Recolher tudo</Button>
              </Tooltip>
            </>
          )}

          <Button variant="outlined" startIcon={<MoreVertIcon />} onClick={abrirMenuOpcoes}
            disabled={!filtroAplicado || carregando || importando} sx={{ minWidth: 120 }}>
            Opções
          </Button>
          <Menu anchorEl={menuAnchorEl} open={menuAberto} onClose={fecharMenuOpcoes}>
            <MenuItem onClick={() => acaoMenuOpcoes(exportarFiltrado)} disabled={!registros.length || importando}>
              Exportar filtrado
            </MenuItem>
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(exportarLayoutImportacao)} disabled={!registros.length || importando}>
                Baixar layout de importação
              </MenuItem>
            )}
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(() => abrirImportacao("realizado"))} disabled={importando || carregando}>
                Importar Realizado
              </MenuItem>
            )}
            {podeEditar && (
              <MenuItem onClick={() => acaoMenuOpcoes(() => abrirImportacao("orcado"))} disabled={importando || carregando}>
                Importar Orçado
              </MenuItem>
            )}
          </Menu>
        </Box>
        {mensagem && <Box mt={2}><Alert severity={mensagem.tipo}>{mensagem.texto}</Alert></Box>}
      </Paper>

      {/* ── Tabela hierárquica ── */}
      <Paper>
        {!filtroAplicado && (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              Informe ano, mês e loja e clique em Filtrar para carregar os dados.
            </Typography>
          </Box>
        )}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Loja</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>Mês</TableCell>
              <TableCell align="right">Realizado</TableCell>
              <TableCell align="right">Orçado</TableCell>
              <TableCell align="right">RLR</TableCell>
              <TableCell align="right">RLO</TableCell>
              {podeEditar && <TableCell>Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtroAplicado && arvore.length === 0 && (
              <TableRow>
                <TableCell colSpan={numCols} align="center" sx={{ color: "text.secondary", py: 3 }}>
                  Nenhum dado encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}

            {arvore.map((grupo) => {
              const desc1Expandida = expandedDescricoes.has(grupo.descricao)
              const primeiroItem = grupo.allItems[0]

              return (
                <React.Fragment key={grupo.descricao}>

                  {/* ── Nível 1: Descrição ── */}
                  <TableRow
                    sx={{
                      bgcolor: "action.selected",
                      "& td": { borderBottom: "1px solid", borderColor: "divider" },
                      cursor: "pointer",
                      "&:hover": { filter: "brightness(0.95)" },
                    }}
                    onClick={() => toggleDescricao(grupo.descricao)}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <IconButton size="small" sx={{ p: 0.25 }} tabIndex={-1}>
                          {desc1Expandida
                            ? <KeyboardArrowDownIcon fontSize="small" />
                            : <ChevronRightIcon fontSize="small" />}
                        </IconButton>
                        {grupo.descricao}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                      {primeiroItem?.codloja ?? "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                      {primeiroItem?.ano ?? "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                      {primeiroItem?.mes ?? "—"}
                    </TableCell>
                    {renderSomas(grupo.allItems, true)}
                  </TableRow>

                  {/* ── Nível 2: Subdescrição (quando nível 1 expandido) ── */}
                  {desc1Expandida && grupo.subgrupos.map((sub) => {
                    const sub2Expandida = expandedSubDescricoes.has(sub.key)
                    const primeiroSubItem = sub.items[0]

                    return (
                      <React.Fragment key={sub.key}>

                        <TableRow
                          sx={{
                            bgcolor: "action.hover",
                            "& td": { borderBottom: "1px solid", borderColor: "divider" },
                            cursor: "pointer",
                            "&:hover": { filter: "brightness(0.97)" },
                          }}
                          onClick={() => toggleSubDescricao(sub.key)}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: "0.8125rem", pl: 4 }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <IconButton size="small" sx={{ p: 0.25 }} tabIndex={-1}>
                                {sub2Expandida
                                  ? <KeyboardArrowDownIcon fontSize="small" sx={{ color: "text.secondary" }} />
                                  : <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} />}
                              </IconButton>
                              {sub.subdescricao ?? <em style={{ opacity: 0.6 }}>(sem subdescrição)</em>}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                            {primeiroSubItem?.codloja ?? "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                            {primeiroSubItem?.ano ?? "—"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                            {primeiroSubItem?.mes ?? "—"}
                          </TableCell>
                          {renderSomas(sub.items)}
                        </TableRow>

                        {/* ── Nível 3: Detalhamento / linhas editáveis ── */}
                        {sub2Expandida && sub.items.map((registro) => (
                          <TableRow
                            key={`${registro.sequencial}-${registro.codloja}-${registro.ano}-${registro.mes}`}
                            sx={{
                              "&:hover": { bgcolor: "action.hover" },
                              "& td": { borderBottom: "1px solid", borderColor: "divider" },
                            }}
                          >
                            <TableCell sx={{ pl: 8 }}>
                              <Box>
                                <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
                                  {registro.sequencial}
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ fontSize: "0.8125rem" }}>
                                  {registro.detalhamento ?? ""}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem" }}>{registro.codloja}</TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem" }}>{registro.ano}</TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem" }}>{registro.mes}</TableCell>

                            {/* Realizado — editável */}
                            <TableCell align="right">
                              <TextField
                                size="small" type="text"
                                inputProps={{ style: { textAlign: "right", width: 110 } }}
                                value={getValorCampo(registro, "realizado")}
                                onChange={(e) => alterarValor(registro, "realizado", e.target.value)}
                                onFocus={() => iniciarEdicaoValor(registro, "realizado")}
                                onBlur={() => finalizarEdicaoValor(registro, "realizado")}
                                disabled={!podeEditar}
                              />
                            </TableCell>

                            {/* Orçado — editável */}
                            <TableCell align="right">
                              <TextField
                                size="small" type="text"
                                inputProps={{ style: { textAlign: "right", width: 110 } }}
                                value={getValorCampo(registro, "orcado")}
                                onChange={(e) => alterarValor(registro, "orcado", e.target.value)}
                                onFocus={() => iniciarEdicaoValor(registro, "orcado")}
                                onBlur={() => finalizarEdicaoValor(registro, "orcado")}
                                disabled={!podeEditar}
                              />
                            </TableCell>

                            {/* RLR / RLO — somente leitura */}
                            <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
                              {registro.rlr !== null ? formatarValor(registro.rlr) : "—"}
                            </TableCell>
                            <TableCell align="right" sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
                              {registro.rlo !== null ? formatarValor(registro.rlo) : "—"}
                            </TableCell>

                            {podeEditar && (
                              <TableCell>
                                <Button variant="outlined" size="small" onClick={() => salvarLinha(registro)}>
                                  Salvar
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}

                      </React.Fragment>
                    )
                  })}

                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default DreF360
