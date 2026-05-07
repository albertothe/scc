import { useEffect, useState } from "react"
import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

// ─── Paleta ──────────────────────────────────────────────────────────────────
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
  purple:  "#A855F7",
  cyan:    "#22D3EE",
  red:     "#EF4444",
  yellow:  "#EAB308",
  white:   "#FFFFFF",
}

const safe  = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const fmtR$ = (v: number)  => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v)
const fmtP  = (v: number, d = 1) => `${v.toFixed(d).replace(".", ",")}%`

// ─── SVG: Sparkline de linha ─────────────────────────────────────────────────
function Spark({ data, color, w = 90, h = 36 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return <svg width={w} height={h} />
  const min = Math.min(...data); const max = Math.max(...data); const rng = max - min || 1
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - 4 - ((v - min) / rng) * (h - 8)).toFixed(1)}`).join(" ")
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── SVG: Sparkline de barras ─────────────────────────────────────────────────
function SparkBar({ data, color, w = 90, h = 36 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data.length) return <svg width={w} height={h} />
  const max = Math.max(...data) || 1
  const bw  = Math.max(2, Math.floor(w / data.length) - 2)
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 4))
        return <rect key={i} x={i * (bw + 2)} y={h - bh} width={bw} height={bh} fill={color} opacity={i === data.length - 1 ? 1 : 0.5} rx="1" />
      })}
    </svg>
  )
}

// ─── SVG: Gráfico de linha comparativo ───────────────────────────────────────
function LineChart({
  data1, data2, color1, title1, title2, fmtY, metaLine, w = 360, h = 160,
}: {
  data1: number[]; data2: number[]
  color1: string; title1: string; title2: string
  fmtY?: (v: number) => string; metaLine?: number; w?: number; h?: number
}) {
  const pl = 58, pr = 8, pt = 22, pb = 20
  const cw = w - pl - pr; const ch = h - pt - pb
  // Use a shared calendar-day scale: both series must have the same length (daysInMonth)
  const nPts = Math.max(data1.length, data2.length, 1)
  const all = [...data1, ...data2].filter(v => isFinite(v) && v > 0)
  if (!all.length) return (
    <svg width={w} height={h}>
      <text x={w / 2} y={h / 2} fill={C.muted} textAnchor="middle" fontSize={11}>Sem dados</text>
    </svg>
  )
  const minV = Math.min(...all) * 0.9
  const maxV = Math.max(...all) * 1.05
  const rng  = maxV - minV || 1
  const tx = (i: number) => pl + (i / Math.max(nPts - 1, 1)) * cw
  const ty = (v: number) => pt + (1 - (v - minV) / rng) * ch

  // Build SVG path with NaN-gap support (lifts pen on non-finite values)
  const makePath = (data: number[]) => {
    let d = "", jump = true
    for (let i = 0; i < data.length; i++) {
      if (!isFinite(data[i])) { jump = true; continue }
      d += `${jump ? "M" : "L"}${tx(i).toFixed(1)},${ty(data[i]).toFixed(1)}`
      jump = false
    }
    return d
  }

  const yTicks = [minV, minV + rng / 2, maxV]
  const xTickDays = [1, 5, 10, 15, 20, 25, nPts].filter((d, idx, arr) => d <= nPts && arr.indexOf(d) === idx)
  const fmt = fmtY ?? ((v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0))

  return (
    <svg width={w} height={h}>
      <circle cx={pl} cy={10} r={4} fill={color1} />
      <text x={pl + 8} y={14} fill={C.text} fontSize={9}>{title1}</text>
      <line x1={pl + 65} y1={10} x2={pl + 80} y2={10} stroke={C.muted} strokeDasharray="4,3" strokeWidth="1.5" />
      <text x={pl + 83} y={14} fill={C.muted} fontSize={9}>{title2}</text>

      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pl} y1={ty(v)} x2={w - pr} y2={ty(v)} stroke={C.dim} strokeWidth={0.5} />
          <text x={pl - 4} y={ty(v)} fill={C.muted} fontSize={9} textAnchor="end" dominantBaseline="middle">{fmt(v)}</text>
        </g>
      ))}
      {xTickDays.map((d) => (
        <text key={d} x={tx(d - 1)} y={h - 4} fill={C.muted} fontSize={9} textAnchor="middle">
          {String(d).padStart(2, "0")}
        </text>
      ))}
      {metaLine !== undefined && isFinite(ty(metaLine)) && (
        <g>
          <line x1={pl} y1={ty(metaLine)} x2={w - pr} y2={ty(metaLine)} stroke={C.green} strokeWidth="1" strokeDasharray="5,3" opacity="0.7" />
          <text x={w - pr - 2} y={ty(metaLine) - 3} fill={C.green} fontSize={8} textAnchor="end" opacity="0.8">META</text>
        </g>
      )}
      {data2.some(isFinite) && <path d={makePath(data2)} fill="none" stroke={C.muted} strokeWidth="1.5" strokeDasharray="4,3" />}
      {data1.some(isFinite) && <path d={makePath(data1)} fill="none" stroke={color1} strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}

// ─── SVG: Gráfico de barras horizontais (atingimento por comprador) ───────────
function BarChartH({
  data, target = 100, fmtVal, w = 280, h = 160,
}: {
  data: { label: string; valor: number; meta?: number }[]
  target?: number; fmtVal?: (v: number) => string; w?: number; h?: number
}) {
  if (!data.length) return (
    <svg width={w} height={h}>
      <text x={w / 2} y={h / 2} fill={C.muted} textAnchor="middle" fontSize={11}>Sem dados</text>
    </svg>
  )
  const pl = 72, pr = 38, pt = 10, pb = 4
  const cw = w - pl - pr
  const totalH = h - pt - pb
  const bh = Math.max(8, Math.floor(totalH / data.length) - 4)
  const gap = Math.floor((totalH - bh * data.length) / Math.max(data.length - 1, 1))
  const maxVal = Math.max(...data.map(d => d.valor), target * 1.1, 1)
  const fmt = fmtVal ?? ((v: number) => `${v.toFixed(0)}%`)
  const tgtX = pl + (target / maxVal) * cw

  return (
    <svg width={w} height={h}>
      {/* Faixa verde de fundo indicando zona atingida */}
      <rect x={tgtX} y={pt} width={Math.max(0, w - pr - tgtX)} height={h - pt - pb} fill={C.green} opacity="0.04" rx="2" />
      {data.map((d, i) => {
        const y = pt + i * (bh + gap)
        const tgt = d.meta ?? target
        const barW = Math.max(0, (d.valor / maxVal) * cw)
        const barColor = d.valor >= tgt ? C.green : d.valor >= tgt * 0.9 ? C.orange : C.red
        const firstName = d.label.split(" ")[0]
        return (
          <g key={i}>
            <text x={pl - 4} y={y + bh / 2 + 4} fill={C.text} fontSize={9} textAnchor="end">{firstName}</text>
            {/* Trilho de fundo */}
            <rect x={pl} y={y} width={cw} height={bh} fill={C.dim} rx="2" />
            {/* Barra de valor */}
            <rect x={pl} y={y} width={barW} height={bh} fill={barColor} rx="2" />
            {/* Valor à direita */}
            <text x={pl + barW + 3} y={y + bh / 2 + 4} fill={barColor} fontSize={9} fontWeight="700">{fmt(d.valor)}</text>
          </g>
        )
      })}
      {/* Linha de meta destacada */}
      <line x1={tgtX} y1={pt} x2={tgtX} y2={h - pb} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
      <text x={tgtX} y={pt - 2} fill="#FFFFFF" fontSize={8} textAnchor="middle" opacity="0.6">META</text>
    </svg>
  )
}

// ─── SVG: Gráfico de rosca ───────────────────────────────────────────────────
function Donut({
  slices, w = 140, h = 120,
}: {
  slices: { label: string; pct: number; color: string }[]
  w?: number; h?: number
}) {
  const cx = w / 2, cy = h / 2, r = 46, ri = 28
  let angle = -Math.PI / 2
  const arcs: JSX.Element[] = []
  const total = slices.reduce((s, sl) => s + sl.pct, 0)

  if (!total) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: h, color: C.muted, fontSize: 11 }}>
      Sem dados
    </div>
  )

  slices.forEach((sl, i) => {
    if (sl.pct <= 0) return
    const sweep = (sl.pct / total) * 2 * Math.PI
    const gap = 0.02
    const s = sweep - gap
    if (s <= 0) return
    const x1 = cx + r * Math.cos(angle);       const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + s);   const y2 = cy + r * Math.sin(angle + s)
    const xi1 = cx + ri * Math.cos(angle);     const yi1 = cy + ri * Math.sin(angle)
    const xi2 = cx + ri * Math.cos(angle + s); const yi2 = cy + ri * Math.sin(angle + s)
    const lg = s > Math.PI ? 1 : 0
    arcs.push(
      <path key={i} d={`M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r},0,${lg},1,${x2.toFixed(1)},${y2.toFixed(1)} L${xi2.toFixed(1)},${yi2.toFixed(1)} A${ri},${ri},0,${lg},0,${xi1.toFixed(1)},${yi1.toFixed(1)} Z`}
        fill={sl.color} />
    )
    angle += sweep
  })

  const visible = slices.filter(sl => sl.pct > 0)
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={w} height={h}>{arcs}</svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", justifyContent: "center" }}>
        {visible.map((sl, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: sl.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: C.text }}>
              {sl.label}: <strong style={{ color: sl.color }}>{sl.pct}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card KPI ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, icon, value, meta, metaAting, upGood, color, alert,
}: {
  title: string; icon: string; value: string; meta: string
  metaAting: number | null; upGood: boolean
  color: string; alert?: boolean
}) {
  let statusLabel = ""; let statusArrow = ""; let statusColor = C.muted
  if (metaAting !== null) {
    const atMeta  = upGood ? metaAting >= 100 : metaAting <= 100
    const close   = upGood ? metaAting >= 90 && metaAting < 100 : metaAting > 100 && metaAting <= 110
    statusColor   = atMeta ? C.green : close ? C.orange : C.red
    statusArrow   = atMeta ? "▲" : close ? "≈" : "▼"
    statusLabel   = atMeta ? (upGood && metaAting < 105 ? "NA META" : "ACIMA") : close ? "PRÓXIMO" : upGood ? "ABAIXO" : "EXCESSO"
  }

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${alert ? color : color + "55"}`,
      borderTop: `2px solid ${color}`,
      borderRadius: 8,
      padding: "10px 12px",
      flex: 1,
      minWidth: 0,
      boxSizing: "border-box",
      boxShadow: alert ? `0 0 14px ${color}44` : "none",
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", color: color, fontSize: 13, flexShrink: 0 }}>
            {icon}
          </div>
          <span style={{ color: color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.2 }}>
            {title}
          </span>
        </div>
        {metaAting !== null && (
          <div style={{ background: statusColor + "22", border: `1px solid ${statusColor}55`, borderRadius: 4, padding: "2px 6px", display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <span style={{ color: statusColor, fontSize: 11, lineHeight: 1 }}>{statusArrow}</span>
            <span style={{ color: statusColor, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em" }}>{statusLabel}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {meta && (
        <div style={{ fontSize: 11, color: C.muted }}>Meta: {meta}</div>
      )}
      {metaAting !== null && meta && (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ flex: 1, height: 4, background: C.dim, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, metaAting)}%`, height: "100%", background: statusColor, borderRadius: 2, transition: "width 0.4s" }} />
          </div>
          <span style={{ fontSize: 10, color: statusColor, fontWeight: 700, flexShrink: 0 }}>{metaAting.toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}

function AtingBar({ pct, meta = 100 }: { pct: number; meta?: number }) {
  const color = pct >= meta ? C.green : pct >= 90 ? C.orange : C.red
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, width: "100%" }}>
      <div style={{ flex: 1, height: 7, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, width: 38, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

function MetaIcons({ c }: { c: any }) {
  const items = [
    { key: "V", ok: safe(c.vendaPercentualMeta) >= 100,                                             title: "Vendas" },
    { key: "L", ok: safe(c.lbPercentual) >= safe(c.metaLb),                                         title: "LB" },
    { key: "N", ok: c.nivelServico !== null && safe(c.nivelServico) >= (c.nivelServicoMeta || 97),  title: "Nível Serviço" },
    { key: "D", ok: c.diasEstoque !== null && safe(c.diasEstoque) <= (c.diasEstoqueMeta || 45),     title: "Dias Estoque" },
    { key: "P", ok: safe(c.produtosForaPercentual) >= 100,                                           title: "Prod. Fora" },
  ]
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {items.map(({ key, ok, title }) => (
        <div key={key} title={title} style={{
          width: 20, height: 20, borderRadius: 3,
          background: ok ? "#052e16" : "#3f0000",
          border: `1px solid ${ok ? C.green : C.red}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 7, color: ok ? C.green : C.red, fontWeight: 800, lineHeight: 1 }}>{key}</span>
          <span style={{ fontSize: 8, color: ok ? C.green : C.red, lineHeight: 1 }}>{ok ? "✓" : "✗"}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TvCompras() {
  const [data, setData] = useState<any>({ kpis: {}, compradores: [], series: [], seriesAnt: [], ruptura: [], situacaoEstoque: {}, graficos: {}, alertas: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

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

  if (loading && !lastUpdate) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor={C.bg}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={80} sx={{ color: C.red }} />
        <Typography color={C.muted}>Carregando dashboard...</Typography>
      </Stack>
    </Box>
  )

  const kpis = data.kpis ?? {}
  const comps: any[]        = data.compradores ?? []
  const gruposFlat: any[]   = data.compradoresGrupos ?? []
  const series: any[]       = data.series ?? []
  const seriesAnt: any[]    = data.seriesAnt ?? []
  const ruptura: any[]      = data.ruptura ?? []
  const sit                 = data.situacaoEstoque ?? {}
  const graficos            = data.graficos ?? {}
  const nsHistorico: any[]  = data.nsHistorico ?? []
  const rupturaCurvaA: any[] = data.rupturaCurvaA ?? []

  // Agrupa para a tabela matriz: [{comprador, grupos:[...]}]
  const matrizCompradores = (() => {
    const map = new Map<string, any[]>()
    for (const g of gruposFlat) {
      if (!map.has(g.comprador)) map.set(g.comprador, [])
      map.get(g.comprador)!.push(g)
    }
    return Array.from(map.entries()).map(([comprador, grupos]) => ({ comprador, grupos }))
  })()

  // Calendar-day x-scale: arrays of length daysInMonth, NaN for days without data
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const today       = now.getDate()

  const dayOf = (dia: unknown) => {
    const s = String(dia).split("T")[0]   // "2025-05-06" → "06"
    return parseInt(s.split("-")[2], 10)
  }

  const cumulDays = (rows: any[], field: string) => {
    const byDay = new Map<number, number>()
    for (const r of rows) {
      const d = dayOf(r.dia)
      byDay.set(d, (byDay.get(d) || 0) + safe(r[field]))
    }
    const out = new Array(daysInMonth).fill(NaN) as number[]
    let acc = 0
    for (let d = 1; d <= daysInMonth; d++) {
      if (byDay.has(d)) { acc += byDay.get(d)!; out[d - 1] = acc }
    }
    return out
  }

  const cumulLbPctDays = (rows: any[]) => {
    const byDay = new Map<number, { vb: number; lb: number }>()
    for (const r of rows) {
      const d = dayOf(r.dia)
      const cur = byDay.get(d) || { vb: 0, lb: 0 }
      cur.vb += safe(r.vendaBruta); cur.lb += safe(r.lb)
      byDay.set(d, cur)
    }
    const out = new Array(daysInMonth).fill(NaN) as number[]
    let tvb = 0, tlb = 0
    for (let d = 1; d <= daysInMonth; d++) {
      if (byDay.has(d)) {
        const { vb, lb } = byDay.get(d)!
        tvb += vb; tlb += lb
        out[d - 1] = tvb > 0 ? tlb / tvb * 100 : 0
      }
    }
    return out
  }

  const chartVenda1 = cumulDays(series, "venda")
  const chartVenda2 = cumulDays(seriesAnt, "venda")
  const chartLb1    = cumulLbPctDays(series)
  const chartLb2    = cumulLbPctDays(seriesAnt)
  const nsVal       = safe(kpis.nivelServico)

  // NS histórico: daily point-in-time NS from scc_historico_ns_dias_estoque
  // Today's value comes from kpis (table only populated at end of day)
  const nsHistoricoByDay = new Map<number, number>()
  for (const r of nsHistorico) {
    nsHistoricoByDay.set(dayOf(r.dia), safe(r.nivelServico))
  }
  nsHistoricoByDay.set(today, nsVal) // patch today from live kpi
  const chartNs1 = new Array(daysInMonth).fill(NaN).map((_, i) => {
    const d = i + 1
    return d <= today ? (nsHistoricoByDay.get(d) ?? NaN) : NaN
  })

  const mesLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())
  const mesAbrev = now.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase().substring(0, 3) + "/" + now.getFullYear()
  const minAgo   = lastUpdate ? Math.round((now.getTime() - lastUpdate.getTime()) / 60000) : null

const th: React.CSSProperties = { color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "2px 4px", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }
  const td: React.CSSProperties = { color: C.text, fontSize: 11, padding: "2px 4px", borderBottom: `1px solid ${C.dim}` }
  const tdN: React.CSSProperties = { ...td, color: C.muted }
  // Separador visual entre grupos de colunas
  const thG: React.CSSProperties = { ...th, borderLeft: `2px solid ${C.border}` }
  const tdG: React.CSSProperties = { ...td, borderLeft: `2px solid ${C.dim}` }
  const tdNG: React.CSSProperties = { ...tdN, borderLeft: `2px solid ${C.dim}` }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "10px 14px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0e2b5c,#1D9BF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛒</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1 }}>DASHBOARD COMPRAS</div>
            <div style={{ fontSize: 11, color: "#4B7FB5", letterSpacing: "0.1em" }}>VISÃO GERAL DE DESEMPENHO — {mesLabel.toUpperCase()}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13 }}>
            📅 <span style={{ color: C.text }}>{now.toLocaleDateString("pt-BR")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13 }}>
            🕐 <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 12 }}>
            {minAgo !== null ? `Atualizado há ${minAgo} min` : ""}
            <span onClick={fetchData} style={{ cursor: "pointer", color: loading ? C.muted : C.green, fontSize: 16 }}>↻</span>
          </div>
        </div>
      </div>

      {/* ── 6 CARDS KPI: Vendas → Evolução → LB → NS → Dias → Prod. Fora ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        {/* 1. Vendas */}
        <KpiCard
          title="VENDAS" icon="$"
          value={fmtP(safe(kpis.vendasAtingimento))}
          meta=""
          metaAting={safe(kpis.vendasAtingimento) > 0 ? safe(kpis.vendasAtingimento) : null}
          upGood={true} color={C.blue}
          alert={safe(kpis.vendasAtingimento) > 0 && safe(kpis.vendasAtingimento) < 90}
        />
        {/* 2. Evolução (sem meta — regra 6) */}
        <KpiCard
          title="EVOLUÇÃO (%)" icon="🎯"
          value={kpis.evolucao !== null && kpis.evolucao !== undefined
            ? `${kpis.evolucao >= 0 ? "+" : ""}${safe(kpis.evolucao).toFixed(1).replace(".", ",")}%`
            : "—"}
          meta=""
          metaAting={null}
          upGood={true} color={C.purple}
          alert={kpis.evolucao !== null && kpis.evolucao !== undefined && safe(kpis.evolucao) < 0}
        />
        {/* 3. LB */}
        <KpiCard
          title="LB (%)" icon="%"
          value={fmtP(safe(kpis.lbPercentual))}
          meta={fmtP(safe(kpis.metaLb))}
          metaAting={safe(kpis.metaLb) > 0 ? safe(kpis.lbPercentual) / safe(kpis.metaLb) * 100 : null}
          upGood={true} color={C.green}
          alert={safe(kpis.lbPercentual) > 0 && safe(kpis.lbPercentual) < safe(kpis.metaLb)}
        />
        {/* 4. Nível de Serviço */}
        <KpiCard
          title="NÍVEL DE SERVIÇO" icon="🚚"
          value={fmtP(safe(kpis.nivelServico))}
          meta={fmtP(safe(kpis.nivelServicoMeta) || 98)}
          metaAting={(safe(kpis.nivelServicoMeta) || 98) > 0 ? safe(kpis.nivelServico) / (safe(kpis.nivelServicoMeta) || 98) * 100 : null}
          upGood={true} color={C.orange}
          alert={safe(kpis.nivelServico) > 0 && safe(kpis.nivelServico) < (safe(kpis.nivelServicoMeta) || 98)}
        />
        {/* 5. Dias de Estoque */}
        <KpiCard
          title="DIAS DE ESTOQUE" icon="📦"
          value={`${Math.round(safe(kpis.diasEstoque))} dias`}
          meta={`${safe(kpis.diasEstoqueMeta) || 45} dias`}
          metaAting={(safe(kpis.diasEstoqueMeta) || 45) > 0 ? safe(kpis.diasEstoque) / (safe(kpis.diasEstoqueMeta) || 45) * 100 : null}
          upGood={false} color={C.cyan}
          alert={safe(kpis.diasEstoque) > (safe(kpis.diasEstoqueMeta) || 45) * 1.1}
        />
        {/* 6. Produtos Fora */}
        <KpiCard
          title="PRODUTOS FORA" icon="⚠️"
          value={fmtP(safe(kpis.produtosFora))}
          meta=""
          metaAting={safe(kpis.produtosFora) > 0 ? safe(kpis.produtosFora) : null}
          upGood={true} color={C.red}
          alert={safe(kpis.produtosFora) > 0 && safe(kpis.produtosFora) > 110}
        />
      </div>

      {/* ── GRÁFICOS (5 painéis, sem alertas) ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        {/* 1. Evolução de Vendas */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            📈 EVOLUÇÃO DE VENDAS (R$)
            <span style={{ color: C.muted, fontWeight: 400, marginLeft: 10, fontSize: 10 }}>— Este mês &nbsp; ‑ ‑ Ano anterior</span>
          </div>
          <LineChart data1={chartVenda1} data2={chartVenda2} color1={C.blue} title1="Este mês" title2="Ano anterior"
            fmtY={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)} h={140} />
        </div>

        {/* 2. Evolução de LB */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            📊 EVOLUÇÃO DE LB (%)
            <span style={{ color: C.muted, fontWeight: 400, marginLeft: 10, fontSize: 10 }}>— Este mês &nbsp; ‑ ‑ Ano anterior</span>
          </div>
          <LineChart data1={chartLb1} data2={chartLb2} color1={C.green} title1="Este mês" title2="Ano anterior"
            fmtY={v => `${v.toFixed(0)}%`} h={140} />
        </div>

        {/* 3. Evolução do Nível de Serviço */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            🚚 NÍVEL DE SERVIÇO (%)
          </div>
          <LineChart data1={chartNs1} data2={[]} color1={C.orange} title1="Este mês" title2=""
            fmtY={v => `${v.toFixed(0)}%`} metaLine={safe(kpis.nivelServicoMeta) || 98} h={140} />
        </div>

        {/* 4. Atingimento de Vendas */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>
            🎯 ATINGIMENTO VENDAS (%)
          </div>
          <BarChartH
            data={(graficos.atingimentoVendas ?? []).map((d: any) => ({ label: d.label, valor: safe(d.valor), meta: safe(d.meta) }))}
            target={100}
            fmtVal={v => `${v.toFixed(0)}%`}
            w={240} h={140}
          />
        </div>

        {/* 5. Atingimento de LB */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>
            📊 ATINGIMENTO LB (%)
          </div>
          <BarChartH
            data={(graficos.atingimentoLb ?? []).map((d: any) => ({ label: d.label, valor: safe(d.valor), meta: safe(d.meta) }))}
            target={safe(kpis.metaLb) || 35}
            fmtVal={v => `${v.toFixed(1).replace(".", ",")}%`}
            w={240} h={140}
          />
        </div>
      </div>

      {/* ── TABELA MATRIZ: COMPRADOR × GRUPO ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", marginBottom: 6, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>👥 DESEMPENHO POR COMPRADOR E GRUPO</span>
          <span style={{ color: C.muted, fontSize: 10 }}>Metas referentes ao mês: {mesAbrev}</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th }} rowSpan={2}>Comprador</th>
              <th style={{ ...th }} rowSpan={2}>Grupo</th>
              <th style={{ ...thG, textAlign: "center" }} rowSpan={2}>Vendas<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }} colSpan={2}>LB (%)</th>
              <th style={{ ...thG, textAlign: "center" }} colSpan={2}>Nível Serviço (%)</th>
              <th style={{ ...thG, textAlign: "center" }} colSpan={2}>Dias Estoque</th>
              <th style={{ ...thG, textAlign: "center" }} rowSpan={2}>Prod. Fora<br/>Atingimento</th>
              <th style={{ ...thG }} rowSpan={2}>Metas</th>
            </tr>
            <tr>
              <th style={thG}>Real.</th><th style={th}>Meta</th>
              <th style={thG}>Real.</th><th style={th}>Meta</th>
              <th style={thG}>Real.</th><th style={th}>Meta</th>
            </tr>
          </thead>
          <tbody>
            {matrizCompradores.length > 0 ? matrizCompradores.map((m, mi) =>
              m.grupos.map((g: any, gi: number) => {
                const rowBg = mi % 2 === 1 ? "#060C1A" : "transparent"
                const sepStyle: React.CSSProperties = gi === 0 && mi > 0
                  ? { borderTop: `2px solid ${C.border}` } : {}
                return (
                  <tr key={`${mi}-${gi}`} style={{ background: rowBg }}>
                    {gi === 0 && (
                      <td style={{ ...td, ...sepStyle, verticalAlign: "top", fontWeight: 700, paddingTop: 6, whiteSpace: "nowrap" }}
                        rowSpan={m.grupos.length}>
                        {g.comprador}
                      </td>
                    )}
                    <td style={{ ...tdN, ...sepStyle, fontSize: 10 }}>{g.grupoNome}</td>
                    <td style={{ ...tdG, ...sepStyle }}><AtingBar pct={safe(g.vendaPercentualMeta)} /></td>
                    <td style={{ ...tdG, ...sepStyle, color: safe(g.lbPercentual) >= safe(g.metaLb) ? C.green : C.red, fontWeight: 700 }}>
                      {fmtP(safe(g.lbPercentual))}
                    </td>
                    <td style={{ ...tdN, ...sepStyle }}>{fmtP(safe(g.metaLb))}</td>
                    <td style={{ ...tdG, ...sepStyle, color: g.nivelServico !== null && safe(g.nivelServico) >= (g.nivelServicoMeta || 97) ? C.green : C.red, fontWeight: 700 }}>
                      {g.nivelServico !== null ? fmtP(safe(g.nivelServico)) : "—"}
                    </td>
                    <td style={{ ...tdN, ...sepStyle }}>{fmtP(g.nivelServicoMeta || 97)}</td>
                    <td style={{ ...tdG, ...sepStyle, color: g.diasEstoque !== null && safe(g.diasEstoque) <= (g.diasEstoqueMeta || 45) ? C.green : safe(g.diasEstoque) <= 55 ? C.orange : C.red, fontWeight: 700 }}>
                      {g.diasEstoque !== null ? `${Math.round(safe(g.diasEstoque))}` : "—"}
                    </td>
                    <td style={{ ...tdN, ...sepStyle }}>{g.diasEstoqueMeta || 45}</td>
                    <td style={{ ...tdG, ...sepStyle }}><AtingBar pct={safe(g.produtosForaPercentual)} /></td>
                    <td style={{ ...tdG, ...sepStyle }}><MetaIcons c={g} /></td>
                  </tr>
                )
              })
            ) : (
              <tr><td colSpan={11} style={{ ...td, textAlign: "center", color: C.muted }}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAINEL INFERIOR ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

        {/* Dias de Estoque por Comprador */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px" }}>
          <div style={{ color: C.cyan, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>📦 DIAS DE ESTOQUE POR COMPRADOR</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Comprador</th>
              <th style={{ ...th, width: 80 }}></th>
              <th style={{ ...th, textAlign: "right" }}>Dias</th>
            </tr></thead>
            <tbody>
              {comps.filter(c => c.diasEstoque !== null).map((c: any, i: number) => {
                const dias  = Math.round(safe(c.diasEstoque))
                const meta  = c.diasEstoqueMeta || 45
                const color = dias <= meta ? C.green : dias <= meta * 1.2 ? C.orange : C.red
                return (
                  <tr key={i}>
                    <td style={{ ...td, fontSize: 10 }}>{c.comprador.split(" ")[0]}</td>
                    <td style={td}>
                      <div style={{ width: "100%", height: 5, background: C.dim, borderRadius: 3 }}>
                        <div style={{ width: `${Math.min(100, (dias / 90) * 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
                      </div>
                    </td>
                    <td style={{ ...td, textAlign: "right", color, fontWeight: 700, fontSize: 11 }}>{dias}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Situação do Estoque */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ color: C.yellow, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 2, alignSelf: "flex-start" }}>SITUAÇÃO DO ESTOQUE</div>
          <Donut slices={[
            { label: "Normal (16-90d)", pct: Math.round(safe(sit.normalPct)),  color: C.green },
            { label: "Crítico (≤15d)",  pct: Math.round(safe(sit.criticoPct)), color: C.red },
            { label: "Excesso (>90d)",  pct: Math.round(safe(sit.excessoPct)), color: C.orange },
          ]} w={150} h={100} />
        </div>

        {/* Produtos em Ruptura por Comprador */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px" }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 2 }}>⛔ RUPTURA POR COMPRADOR</div>
          <div style={{ color: C.muted, fontSize: 9, marginBottom: 4 }}>Produtos com facing, sem estoque e sem pedido pendente no fornecedor</div>
          {ruptura.length > 0 ? (() => {
            const maxQtd = Math.max(...ruptura.map((r: any) => safe(r.qtdRuptura)), 1)
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {ruptura.map((r: any, i: number) => {
                  const qtd = safe(r.qtdRuptura)
                  const pct = (qtd / maxQtd) * 100
                  const color = qtd >= 20 ? C.red : qtd >= 10 ? C.orange : C.yellow
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: C.text, fontSize: 10, width: 80, flexShrink: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {r.comprador.split(" ")[0]}
                      </span>
                      <div style={{ flex: 1, height: 7, background: C.dim, borderRadius: 4 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
                      </div>
                      <span style={{ color, fontWeight: 700, fontSize: 11, width: 28, textAlign: "right", flexShrink: 0 }}>{qtd}</span>
                    </div>
                  )
                })}
              </div>
            )
          })() : <div style={{ fontSize: 11, color: C.green }}>✓ Sem rupturas</div>}
        </div>

        {/* TOP 10 dias sem estoque — curva A1 */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px" }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 2 }}>
            📉 TOP 10 — DIAS SEM ESTOQUE (CURVA A1)
          </div>
          <div style={{ color: C.muted, fontSize: 9, marginBottom: 4 }}>Produtos com saldo ≤ 0 ordenados por dias sem venda</div>
          {rupturaCurvaA.length > 0 ? (() => {
            const maxDias = Math.max(...rupturaCurvaA.map((r: any) => safe(r.diasZerado)), 1)
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {rupturaCurvaA.map((r: any, i: number) => {
                  const dias = safe(r.diasZerado)
                  const pct = (dias / maxDias) * 100
                  const color = dias >= 60 ? C.red : dias >= 30 ? C.orange : C.yellow
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: C.muted, fontSize: 9, width: 14, flexShrink: 0, textAlign: "right" }}>{i + 1}.</span>
                      <span style={{ color: C.text, fontSize: 9, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.produto}
                      </span>
                      <div style={{ width: 55, height: 5, background: C.dim, borderRadius: 3, flexShrink: 0 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ color, fontWeight: 700, fontSize: 10, width: 30, textAlign: "right", flexShrink: 0 }}>{dias}d</span>
                    </div>
                  )
                })}
              </div>
            )
          })() : <div style={{ fontSize: 11, color: C.green }}>✓ Sem rupturas na curva A1</div>}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 10, color: C.red, textAlign: "right", paddingTop: 4 }}>⚠ {error}</div>
      )}
    </div>
  )
}
