import React, { useEffect, useRef, useState } from "react"
import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

// ─── Paleta (idêntica ao TvCompras) ──────────────────────────────────────────
const C = {
  bg:      "#04091A",
  card:    "#070D1C",
  border:  "#0F1D35",
  text:    "#F1F5F9",
  muted:   "#94A3B8",
  dim:     "#1E293B",
  blue:    "#1D9BF0",
  green:   "#22C55E",
  orange:  "#FB923C",
  red:     "#EF4444",
  yellow:  "#EAB308",
}

const safe = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// ─── Barra de atingimento responsiva ─────────────────────────────────────────
function AtingBar({ pct, meta = 100, height = 7 }: { pct: number; meta?: number; height?: number }) {
  const color = pct >= meta ? C.green : pct >= 90 ? C.orange : C.red
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, width: "100%" }}>
      <div style={{ flex: 1, height, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 700, width: 36, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

// ─── Card de resumo para TOTAL GERAL ─────────────────────────────────────────
function TotalCard({ icon, label, pct }: { icon: string; label: string; pct: number }) {
  const color = pct >= 100 ? C.green : pct >= 90 ? C.orange : C.red
  return (
    <div style={{
      background: "#040A18",
      border: `1px solid ${color}44`,
      borderTop: `2px solid ${color}`,
      borderRadius: 6,
      padding: "8px 12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      minWidth: 105,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {pct.toFixed(0)}%
      </div>
      <div style={{ width: "100%", height: 4, background: C.dim, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ─── Chips de NS por loja ─────────────────────────────────────────────────────
function NsLojaChips({ lojas, meta = 97, overall }: {
  lojas: { codloja: string; nivelServico: number }[]
  meta?: number
  overall?: number
}) {
  if (!lojas.length) return <span style={{ color: C.muted, fontSize: 10 }}>—</span>
  const overallColor = overall !== undefined
    ? (overall >= meta ? C.green : overall >= meta * 0.9 ? C.orange : C.red)
    : C.muted
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {overall !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: overallColor, fontVariantNumeric: "tabular-nums" }}>
            {overall.toFixed(0)}%
          </span>
          <div style={{ flex: 1, height: 5, background: C.dim, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, overall / meta * 100)}%`, height: "100%", background: overallColor, borderRadius: 2 }} />
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "nowrap", gap: 1 }}>
        {lojas.map(l => {
          const ns = l.nivelServico
          const color = ns >= meta ? C.green : ns >= meta * 0.9 ? C.orange : C.red
          return (
            <div key={l.codloja} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: color + "1A",
              border: `1px solid ${color}55`,
              borderRadius: 2,
              padding: "0px 3px",
              minWidth: 20,
            }}>
              <span style={{ fontSize: 6, color: C.muted, lineHeight: 1.3 }}>{l.codloja}</span>
              <span style={{ fontSize: 7, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{ns}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chips de Dias de Estoque por loja (sem barra overall — AtingBar cuida disso) ─
function DiasLojaChips({ lojas, meta = 45 }: {
  lojas: { codloja: string; diasEstoque: number }[]
  meta?: number
}) {
  if (!lojas.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 1, marginTop: 2 }}>
      {lojas.map(l => {
        const d = l.diasEstoque
        const color = d <= meta ? C.green : d <= meta * 1.2 ? C.orange : C.red
        return (
          <div key={l.codloja} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: color + "1A",
            border: `1px solid ${color}55`,
            borderRadius: 2,
            padding: "0px 3px",
            minWidth: 20,
          }}>
            <span style={{ fontSize: 6, color: C.muted, lineHeight: 1.3 }}>{l.codloja}</span>
            <span style={{ fontSize: 7, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{d}d</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Chips de evolução por loja (vs mesmo período ano passado) ────────────────
// v === null → sem venda em nenhum dos dois anos → exibe "–" em muted
// v === -100 → tinha ano passado, não tem este → vermelho
// v === +100 → não tinha ano passado, tem este → verde
function EvolLojaChips({ lojas, field }: {
  lojas: { codloja: string; evolVendas: number | null; evolLb: number | null; evolProdFora: number | null }[]
  field: "evolVendas" | "evolLb" | "evolProdFora"
}) {
  if (!lojas.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 1, marginTop: 2 }}>
      {lojas.map(l => {
        const v = l[field]
        if (v === null) {
          // sem venda em nenhum dos dois períodos
          return (
            <div key={l.codloja} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: C.dim + "88",
              border: `1px solid ${C.border}`,
              borderRadius: 2,
              padding: "0px 3px",
              minWidth: 20,
            }}>
              <span style={{ fontSize: 6, color: C.muted, lineHeight: 1.3 }}>{l.codloja}</span>
              <span style={{ fontSize: 7, color: C.muted, fontWeight: 500, lineHeight: 1.2 }}>–</span>
            </div>
          )
        }
        const color = v >= 0 ? C.green : v >= -10 ? C.orange : C.red
        const sign  = v > 0 ? "+" : ""
        return (
          <div key={l.codloja} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: color + "1A",
            border: `1px solid ${color}55`,
            borderRadius: 2,
            padding: "0px 3px",
            minWidth: 20,
          }}>
            <span style={{ fontSize: 6, color: C.muted, lineHeight: 1.3 }}>{l.codloja}</span>
            <span style={{ fontSize: 7, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{sign}{v.toFixed(0)}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Ícones de meta (V L N D P) ──────────────────────────────────────────────
function MetaIcons({ c }: { c: any }) {
  // NS usa nivelServicoLojas se disponível, caso contrário nivelServico
  const nsReal = c.nivelServicoLojas !== null && c.nivelServicoLojas !== undefined
    ? safe(c.nivelServicoLojas) : safe(c.nivelServico)
  const nsDisponivel = c.nivelServicoLojas !== null && c.nivelServicoLojas !== undefined
    ? true : c.nivelServico !== null
  const items = [
    { key: "V", ok: safe(c.vendaPercentualMeta) >= 100,                                         title: "Vendas" },
    { key: "L", ok: safe(c.lbPercentual) >= safe(c.metaLb),                                     title: "LB" },
    { key: "N", ok: nsDisponivel && nsReal >= (c.nivelServicoMeta || 97),                        title: "Nível Serviço" },
    { key: "D", ok: c.diasEstoque !== null && safe(c.diasEstoque) <= (c.diasEstoqueMeta || 45),  title: "Dias Estoque" },
    { key: "P", ok: safe(c.produtosForaPercentual) >= 100,                                       title: "Prod. Fora" },
  ]
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {items.map(({ key, ok, title }) => (
        <div key={key} title={title} style={{
          width: 16, height: 16, borderRadius: 2,
          background: ok ? "#052e16" : "#3f0000",
          border: `1px solid ${ok ? C.green : C.red}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 6, color: ok ? C.green : C.red, fontWeight: 800, lineHeight: 1 }}>{key}</span>
          <span style={{ fontSize: 7, color: ok ? C.green : C.red, lineHeight: 1 }}>{ok ? "✓" : "✗"}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card grande para a tela individual do comprador ─────────────────────
function KpiCard({ icon, label, pct }: { icon: string; label: string; pct: number | null }) {
  const color = pct === null ? C.muted : pct >= 100 ? C.green : pct >= 90 ? C.orange : C.red
  const barW  = pct !== null ? Math.min(100, pct) : 0
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderTop: `3px solid ${pct !== null ? color : C.border}`,
      borderRadius: 10, padding: "16px 18px 14px",
      display: "flex", flexDirection: "column", gap: 8, flex: 1,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 14 }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
        {pct !== null ? `${pct.toFixed(0)}%` : "—"}
      </div>
      <div style={{ height: 18, background: C.dim, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${barW}%`, height: "100%", background: pct !== null ? color : C.dim, borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TvComprasLojas() {
  const [data, setData] = useState<any>({ kpis: {}, compradores: [], compradoresGrupos: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

  // ── Carrossel: 0 = visão geral, 1..N = comprador individual ──────────────
  const [slideIndex, setSlideIndex] = useState(0)
  const [countdown, setCountdown]   = useState(45)
  const totalRef = useRef(1) // atualizado quando matrizCompradores muda

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchData = async () => {
    setLoading(true); setError(null)
    try {
      const r = await getDashboardTvCompras()
      setData(r); setLastUpdate(new Date())
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao carregar dados")
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 1800000); return () => clearInterval(t) }, [])

  // Ticker de 1 segundo para contagem regressiva (só inicia após primeiro carregamento)
  useEffect(() => {
    if (!lastUpdate) return
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [lastUpdate])

  // Avança slide quando countdown chega a 0
  useEffect(() => {
    if (countdown === 0 && totalRef.current > 1) {
      setSlideIndex(si => (si + 1) % totalRef.current)
      setCountdown(45)
    }
  }, [countdown])

  // Reseta ao recarregar dados
  useEffect(() => {
    if (lastUpdate) { setSlideIndex(0); setCountdown(45) }
  }, [lastUpdate])

  if (loading && !lastUpdate) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor={C.bg}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={80} sx={{ color: C.blue }} />
        <Typography color={C.muted}>Carregando dashboard...</Typography>
      </Stack>
    </Box>
  )

  const kpis               = data.kpis ?? {}
  const comps: any[]       = data.compradores ?? []
  const gruposFlat: any[]  = data.compradoresGrupos ?? []
  const mesLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())
  const mesAbrev = now.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase().substring(0, 3) + "/" + now.getFullYear()
  const minAgo   = lastUpdate ? Math.round((now.getTime() - lastUpdate.getTime()) / 60000) : null

  // Agrupa para tabela: [{comprador, compData, grupos:[...]}]
  // compData = linha do array compradores (subtotal agregado por comprador)
  const compMap = new Map<string, any>()
  for (const c of comps) compMap.set(c.comprador, c)

  const matrizCompradores = (() => {
    const map = new Map<string, any[]>()
    for (const g of gruposFlat) {
      if (!map.has(g.comprador)) map.set(g.comprador, [])
      map.get(g.comprador)!.push(g)
    }
    return Array.from(map.entries()).map(([comprador, grupos]) => ({
      comprador,
      grupos,
      sub: compMap.get(comprador) ?? null,
    })).sort((a, b) => safe(b.sub?.vendaRealizado) - safe(a.sub?.vendaRealizado))
  })()

  // Mantém totalRef atualizado (1 slide geral + N compradores)
  totalRef.current = matrizCompradores.length + 1

  // Converte métricas para % de atingimento
  const lbAting   = (g: any) => safe(g.metaLb) > 0 ? safe(g.lbPercentual) / safe(g.metaLb) * 100 : 0
  // NS usa nivelServicoLojas (por produto×loja) exclusivo desta página
  const nsVal     = (g: any) => g.nivelServicoLojas !== null && g.nivelServicoLojas !== undefined
    ? safe(g.nivelServicoLojas) : safe(g.nivelServico)
  const nsPresent = (g: any) => g.nivelServicoLojas !== null && g.nivelServicoLojas !== undefined
    ? true : g.nivelServico !== null
  const nsAting   = (g: any) => (g.nivelServicoMeta || 97) > 0 ? nsVal(g) / (g.nivelServicoMeta || 97) * 100 : 0
  const diasAting = (g: any) => { const r = safe(g.diasEstoque); return r > 0 ? (g.diasEstoqueMeta || 45) / r * 100 : 0 }

  // Totais gerais — usa kpis do backend (agregado real, não média de médias)
  const totalVendas = safe(kpis.vendasAtingimento)
  const totalLb     = safe(kpis.metaLb) > 0 ? safe(kpis.lbPercentual) / safe(kpis.metaLb) * 100 : 0
  const nsLojasGlobal = kpis.nivelServicoLojas !== null && kpis.nivelServicoLojas !== undefined
    ? safe(kpis.nivelServicoLojas) : safe(kpis.nivelServico)
  const totalNs     = safe(kpis.nivelServicoMeta) > 0 ? nsLojasGlobal / safe(kpis.nivelServicoMeta) * 100 : 0
  const totalDias   = safe(kpis.diasEstoque) > 0 ? safe(kpis.diasEstoqueMeta) / safe(kpis.diasEstoque) * 100 : 0
  const totalProd   = safe(kpis.produtosFora)

  const th: React.CSSProperties = {
    color: C.muted, fontSize: 9, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.04em", padding: "3px 5px", whiteSpace: "nowrap",
    borderBottom: `1px solid ${C.border}`,
  }
  const td: React.CSSProperties = { color: C.text, fontSize: 10, padding: "2px 4px", borderBottom: `1px solid ${C.dim}` }
  const tdN: React.CSSProperties = { ...td, color: C.muted }
  const thG: React.CSSProperties = { ...th, borderLeft: `2px solid ${C.border}` }
  const tdG: React.CSSProperties = { ...td, borderLeft: `2px solid ${C.dim}` }

  // Borda branca que contorna cada bloco de comprador
  const W = "2px solid rgba(255,255,255,0.42)"

  // Estilo da linha de sub-total por comprador
  const tdSub: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, padding: "2px 4px",
    background: "#0A1628",
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    color: C.blue,
  }
  const tdSubG: React.CSSProperties = { ...tdSub, borderLeft: `2px solid ${C.border}` }

  // ── SLIDE INDIVIDUAL DO COMPRADOR ──────────────────────────────────────────
  if (slideIndex > 0 && matrizCompradores.length > 0) {
    const m    = matrizCompradores[slideIndex - 1]
    const sub  = m?.sub
    const nextIdx   = (slideIndex + 1) % (matrizCompradores.length + 1)
    const nextLabel = nextIdx === 0 ? "Visão Geral" : matrizCompradores[nextIdx - 1]?.comprador ?? ""

    const vendaPct = safe(sub?.vendaPercentualMeta)
    const lbPct    = sub ? lbAting(sub) : null
    const nsPct    = sub && nsPresent(sub) ? nsAting(sub) : null
    const diasPct  = sub && sub.diasEstoque !== null ? diasAting(sub) : null
    const prodPct  = safe(sub?.produtosForaPercentual)

    // Cor de um metric em linha de grupo
    const gc = (pct: number) => pct >= 100 ? C.green : pct >= 90 ? C.orange : C.red

    return (
      <div style={{ background: C.bg, height: "100vh", color: C.text, fontFamily: "'Segoe UI', sans-serif",
        display: "flex", flexDirection: "column", padding: "18px 28px 14px", gap: 14, boxSizing: "border-box", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ background: C.blue, color: "#fff", fontSize: 11, fontWeight: 800,
            letterSpacing: ".12em", padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
            COMPRADOR {slideIndex} DE {matrizCompradores.length}
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-.01em", lineHeight: 1, flex: 1 }}>
            {m?.comprador?.toUpperCase()}
          </div>
          <div style={{ fontSize: 15, color: C.muted, fontWeight: 600, letterSpacing: ".06em", whiteSpace: "nowrap" }}>
            {mesAbrev}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: C.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>próxima tela em</span>
            <div style={{ width: 180, height: 6, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${(countdown / 45) * 100}%`, height: "100%",
                background: `linear-gradient(90deg, ${C.blue}, #60c8ff)`, borderRadius: 3, transition: "width 1s linear" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.blue, fontVariantNumeric: "tabular-nums" }}>{countdown}s</span>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, flexShrink: 0 }}>
          <KpiCard icon="💰" label="Vendas"         pct={vendaPct} />
          <KpiCard icon="📊" label="LB Atingimento" pct={lbPct} />
          <KpiCard icon="🚚" label="Nível Serviço"  pct={nsPct} />
          <KpiCard icon="📦" label="Dias Estoque"   pct={diasPct} />
          <KpiCard icon="🏷️" label="Prod. Fora"    pct={prodPct} />
        </div>

        {/* ── Tabela de Grupos ── */}
        <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "8px 20px 6px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.blue }}>📋 Grupos do Comprador</span>
          </div>
          {/* thead */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(5, 1fr)",
            padding: "5px 20px", background: "#060C1A", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {["Grupo", "Vendas %", "LB %", "N. Serviço", "Dias Est.", "Prod. Fora"].map((h, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em",
                textTransform: "uppercase", color: C.muted, textAlign: i > 0 ? "center" : "left" }}>{h}</span>
            ))}
          </div>
          {/* tbody */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: "4px 0" }}>
            {(m?.grupos ?? []).map((g: any, gi: number) => {
              const metrics = [
                safe(g.vendaPercentualMeta),
                lbAting(g),
                nsPresent(g) ? nsAting(g) : null,
                g.diasEstoque !== null ? diasAting(g) : null,
                safe(g.produtosForaPercentual),
              ] as (number | null)[]
              return (
                <div key={gi} style={{ display: "grid", gridTemplateColumns: "2fr repeat(5, 1fr)",
                  padding: "7px 20px", alignItems: "center", gap: 8,
                  background: gi % 2 === 0 ? "#060C1A" : "transparent",
                  borderBottom: gi < (m?.grupos?.length ?? 0) - 1 ? `1px solid ${C.dim}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                    {/* Indicador de status de vendas */}
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: gc(safe(g.vendaPercentualMeta)),
                      boxShadow: `0 0 6px ${gc(safe(g.vendaPercentualMeta))}88`,
                    }} />
                    <span style={{
                      fontSize: 15, fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: C.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {g.grupoNome}
                    </span>
                  </div>
                  {metrics.map((pct, mi) => {
                    const color = pct === null ? C.muted : gc(pct)
                    return (
                      <div key={mi} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                          {pct !== null ? `${pct.toFixed(0)}%` : "—"}
                        </span>
                        <div style={{ width: "100%", height: 14, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, pct ?? 0)}%`, height: "100%", background: pct !== null ? color : C.dim, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {/* dot 0 = geral */}
            {[0, ...matrizCompradores.map((_, i) => i + 1)].map((idx) => (
              <div key={idx} style={{
                height: 8, borderRadius: 4, transition: "all .3s",
                width: idx === slideIndex ? 22 : 8,
                background: idx === slideIndex ? C.blue : idx < slideIndex ? C.muted : C.dim,
                opacity: idx < slideIndex ? 0.5 : 1,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Próximo: <strong style={{ color: C.text }}>{nextLabel}</strong>
          </div>
        </div>

      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "6px 10px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 5, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0e2b5c,#1D9BF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1 }}>J MONTE CENTER</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 11 }}>
            📅 <span style={{ color: C.text }}>{now.toLocaleDateString("pt-BR")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 11 }}>
            🕐 <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 10 }}>
            {minAgo !== null ? `Atualizado há ${minAgo} min` : ""}
            <span onClick={fetchData} style={{ cursor: "pointer", color: loading ? C.muted : C.green, fontSize: 14 }}>↻</span>
          </div>
        </div>
      </div>

      {/* ── TOTAL GERAL ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.blue, fontWeight: 800, fontSize: 11, letterSpacing: "0.1em" }}>TOTAL GERAL</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <TotalCard icon="💰" label="Vendas Atingimento"    pct={totalVendas} />
            <TotalCard icon="📊" label="LB Atingimento"        pct={totalLb} />
            <TotalCard icon="🚚" label="Nível Serviço"         pct={totalNs} />
            <TotalCard icon="📦" label="Dias Estoque"          pct={totalDias} />
            <TotalCard icon="🏷️" label="Prod. Fora"           pct={totalProd} />
          </div>
        </div>
      </div>

      {/* ── TABELA MATRIZ: COMPRADOR × GRUPO ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 6px", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>👥 DESEMPENHO POR COMPRADOR E GRUPO</span>
          <span style={{ color: C.muted, fontSize: 9 }}>Metas referentes ao mês: {mesAbrev}</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Comprador</th>
              <th style={th}>Grupo</th>
              <th style={{ ...thG, textAlign: "center" }}>Vendas Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>LB Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Nível Serviço Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Dias Estoque Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Prod. Fora Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Metas</th>
            </tr>
          </thead>
          <tbody>
            {matrizCompradores.length > 0 ? matrizCompradores.flatMap((m, mi) => {
              const rowBg = mi % 2 === 1 ? "#060C1A" : "transparent"
              const firstName = m.comprador.split(" ")[0]

              const grupoRows = m.grupos.map((g: any, gi: number) => {
                const isFirst = gi === 0
                // topo branco somente na primeira linha do bloco
                const topB: React.CSSProperties = isFirst ? { borderTop: W } : {}
                // esquerda branca na célula mais à esquerda de cada linha:
                //   gi=0 → cell comprador (rowspan) | gi>0 → cell grupoNome
                const leftGrupo: React.CSSProperties = isFirst ? {} : { borderLeft: W }
                return (
                  <tr key={`${mi}-${gi}`} style={{ background: rowBg }}>
                    {isFirst && (
                      <td style={{ ...td, ...topB, borderLeft: W, verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap", color: C.blue }}
                        rowSpan={m.grupos.length}>
                        {m.comprador}
                      </td>
                    )}
                    <td style={{ ...tdN, ...topB, ...leftGrupo, fontSize: 9 }}>{g.grupoNome}</td>
                    <td style={{ ...tdG, ...topB, whiteSpace: "nowrap" }}>
                      <AtingBar pct={safe(g.vendaPercentualMeta)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolVendas" />
                    </td>
                    <td style={{ ...tdG, ...topB, whiteSpace: "nowrap" }}>
                      <AtingBar pct={lbAting(g)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolLb" />
                    </td>
                    <td style={{ ...tdG, ...topB, whiteSpace: "nowrap" }}>
                      <NsLojaChips
                        lojas={g.nsPorLoja ?? []}
                        meta={g.nivelServicoMeta || 97}
                        overall={nsPresent(g) ? nsVal(g) : undefined}
                      />
                    </td>
                    <td style={{ ...tdG, ...topB, whiteSpace: "nowrap" }}>
                      <AtingBar pct={diasAting(g)} />
                      <DiasLojaChips
                        lojas={g.diasPorLoja ?? []}
                        meta={g.diasEstoqueMeta || 45}
                      />
                    </td>
                    <td style={{ ...tdG, ...topB, whiteSpace: "nowrap" }}>
                      <AtingBar pct={safe(g.produtosForaPercentual)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolProdFora" />
                    </td>
                    {/* Metas: direita branca em todas as linhas do bloco */}
                    <td style={{ ...tdG, ...topB, borderRight: W }}><MetaIcons c={g} /></td>
                  </tr>
                )
              })

              // Linha de sub-total: fundo branco completa o box
              const sub = m.sub
              const subRow = sub ? (
                <tr key={`${mi}-sub`}>
                  <td style={{ ...tdSub, borderLeft: W, borderBottom: W, fontStyle: "italic" }} colSpan={2}>
                    SUB-TOTAL {firstName.toUpperCase()}
                  </td>
                  <td style={{ ...tdSubG, borderBottom: W }}><AtingBar pct={safe(sub.vendaPercentualMeta)} height={10} /></td>
                  <td style={{ ...tdSubG, borderBottom: W }}><AtingBar pct={lbAting(sub)} height={10} /></td>
                  <td style={{ ...tdSubG, borderBottom: W }}>
                    {nsPresent(sub) ? <AtingBar pct={nsAting(sub)} height={10} /> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ ...tdSubG, borderBottom: W }}>
                    {sub.diasEstoque !== null ? <AtingBar pct={diasAting(sub)} height={10} /> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={{ ...tdSubG, borderBottom: W }}><AtingBar pct={safe(sub.produtosForaPercentual)} height={10} /></td>
                  <td style={{ ...tdSubG, borderBottom: W, borderRight: W }}><MetaIcons c={sub} /></td>
                </tr>
              ) : null

              // Linha espaçadora entre blocos de compradores
              const spacer = <tr key={`${mi}-spacer`} style={{ height: 4 }}><td colSpan={8} style={{ padding: 0, border: "none", background: "transparent" }} /></tr>
              const rows = subRow ? [...grupoRows, subRow] : grupoRows
              return mi < matrizCompradores.length - 1 ? [...rows, spacer] : rows
            }) : (
              <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: C.muted }}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div style={{ fontSize: 10, color: C.red, textAlign: "right", paddingTop: 6 }}>⚠ {error}</div>
      )}
    </div>
  )
}
