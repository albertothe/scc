import { useEffect, useState } from "react"
import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import { getDashboardTvCompras } from "../services/dashboardTvComprasService"

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#04091A",
  card:    "#070D1C",
  border:  "#0F1D35",
  text:    "#F1F5F9",
  muted:   "#64748B",
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

// ─── Utilitários ─────────────────────────────────────────────────────────────
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

// ─── SVG: Gráfico de linha comparativo (este mês vs anterior) ────────────────
function LineChart({
  data1, data2, color1, title1, title2, fmtY, w = 360, h = 160,
}: {
  data1: number[]; data2: number[]
  color1: string; title1: string; title2: string
  fmtY?: (v: number) => string; w?: number; h?: number
}) {
  const pl = 58, pr = 8, pt = 22, pb = 20
  const cw = w - pl - pr; const ch = h - pt - pb
  const all = [...data1, ...data2].filter(v => v > 0)
  if (!all.length) return (
    <svg width={w} height={h}>
      <text x={w / 2} y={h / 2} fill={C.muted} textAnchor="middle" fontSize={11}>Sem dados</text>
    </svg>
  )
  const minV = Math.min(...all) * 0.9
  const maxV = Math.max(...all) * 1.05
  const rng  = maxV - minV || 1
  const tx = (i: number, len: number) => pl + (i / Math.max(len - 1, 1)) * cw
  const ty = (v: number) => pt + (1 - (v - minV) / rng) * ch

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${tx(i, data.length).toFixed(1)},${ty(v).toFixed(1)}`).join(" ")

  const yTicks = [minV, minV + rng / 2, maxV]
  const xTicks = [1, 5, 10, 15, 20, 25, data1.length].filter((d, _, arr) => arr.indexOf(d) === arr.lastIndexOf(d) && d <= data1.length)
  const fmt = fmtY ?? ((v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0))

  return (
    <svg width={w} height={h}>
      {/* Legend */}
      <circle cx={pl} cy={10} r={4} fill={color1} />
      <text x={pl + 8} y={14} fill={C.text} fontSize={9}>{title1}</text>
      <line x1={pl + 65} y1={10} x2={pl + 80} y2={10} stroke={C.muted} strokeDasharray="4,3" strokeWidth="1.5" />
      <text x={pl + 83} y={14} fill={C.muted} fontSize={9}>{title2}</text>

      {/* Grid + Y labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pl} y1={ty(v)} x2={w - pr} y2={ty(v)} stroke={C.dim} strokeWidth={0.5} />
          <text x={pl - 4} y={ty(v)} fill={C.muted} fontSize={9} textAnchor="end" dominantBaseline="middle">{fmt(v)}</text>
        </g>
      ))}

      {/* X labels */}
      {xTicks.map((d) => (
        <text key={d} x={tx(d - 1, data1.length)} y={h - 4} fill={C.muted} fontSize={9} textAnchor="middle">
          {String(d).padStart(2, "0")}
        </text>
      ))}

      {/* Lines */}
      {data2.length > 1 && <path d={path(data2)} fill="none" stroke={C.muted} strokeWidth="1.5" strokeDasharray="4,3" />}
      {data1.length > 1 && <path d={path(data1)} fill="none" stroke={color1} strokeWidth="2" strokeLinecap="round" />}
    </svg>
  )
}

// ─── SVG: Gráfico de rosca ───────────────────────────────────────────────────
function Donut({
  slices, w = 140, h = 140,
}: {
  slices: { label: string; pct: number; color: string }[]
  w?: number; h?: number
}) {
  const cx = w / 2, cy = h / 2 - 10, r = 48, ri = 30
  let angle = -Math.PI / 2
  const arcs: JSX.Element[] = []
  const total = slices.reduce((s, sl) => s + sl.pct, 0) || 100

  slices.forEach((sl, i) => {
    const sweep = (sl.pct / total) * 2 * Math.PI - 0.02
    const x1 = cx + r * Math.cos(angle);       const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep); const y2 = cy + r * Math.sin(angle + sweep)
    const xi1 = cx + ri * Math.cos(angle);      const yi1 = cy + ri * Math.sin(angle)
    const xi2 = cx + ri * Math.cos(angle + sweep); const yi2 = cy + ri * Math.sin(angle + sweep)
    const lg = sweep > Math.PI ? 1 : 0
    arcs.push(
      <path key={i} d={`M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r},0,${lg},1,${x2.toFixed(1)},${y2.toFixed(1)} L${xi2.toFixed(1)},${yi2.toFixed(1)} A${ri},${ri},0,${lg},0,${xi1.toFixed(1)},${yi1.toFixed(1)} Z`}
        fill={sl.color} />
    )
    angle += sweep + 0.02
  })

  return (
    <svg width={w} height={h}>
      {arcs}
      {slices.map((sl, i) => (
        <g key={i}>
          <rect x={4} y={h - 28 + i * 14} width={8} height={8} rx="2" fill={sl.color} />
          <text x={16} y={h - 22 + i * 14} fill={C.text} fontSize={9}>{sl.label}: {sl.pct}%</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Card KPI ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, icon, value, meta, trend, trendSuffix, upGood, sparkData, sparkType, color, alert,
}: {
  title: string; icon: string; value: string; meta: string
  trend: number | null; trendSuffix: string; upGood: boolean
  sparkData: number[]; sparkType: "line" | "bar"; color: string; alert?: boolean
}) {
  const trendOk = trend === null ? null : (upGood ? trend >= 0 : trend <= 0)
  const trendColor = trendOk === null ? C.muted : trendOk ? C.green : C.red
  const arrow = trend === null ? "" : trend >= 0 ? "↑" : "↓"
  const trendStr = trend !== null ? `${arrow} ${trend >= 0 ? "+" : ""}${trend.toFixed(1).replace(".", ",")}${trendSuffix}` : null

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
      gap: 2,
    }}>
      {/* Título + Sparkline */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", color: color, fontSize: 13, flexShrink: 0 }}>
            {icon}
          </div>
          <span style={{ color: color, fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.2 }}>
            {title}
          </span>
        </div>
        {sparkData.length > 1 && (
          sparkType === "line"
            ? <Spark data={sparkData} color={color} />
            : <SparkBar data={sparkData} color={color} />
        )}
      </div>

      {/* Valor */}
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 11, color: C.muted }}>Meta: {meta}</div>

      {/* Tendência */}
      {trendStr && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: trendColor }}>{trendStr}</span>
          <span style={{ fontSize: 10, color: "#374151" }}>vs mês anterior</span>
        </div>
      )}
    </div>
  )
}

// ─── Tabela de compradores ────────────────────────────────────────────────────
function AtingBar({ pct, meta = 100 }: { pct: number; meta?: number }) {
  const color = pct >= meta ? C.green : pct >= 90 ? C.orange : C.red
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 80 }}>
      <div style={{ width: 50, height: 6, background: C.dim, borderRadius: 3, flexShrink: 0 }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, width: 38 }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    "ACIMA DA META":  { bg: "#052e16", color: C.green },
    "DENTRO DA META": { bg: "#0c1a3d", color: C.blue },
    "ATENÇÃO":        { bg: "#431407", color: C.orange },
    "ABAIXO DA META": { bg: "#3f0000", color: C.red },
  }
  const s = cfg[status] ?? cfg["ATENÇÃO"]
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}`, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
      {status}
    </span>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function TvCompras() {
  const [data, setData] = useState<any>({ kpis: {}, compradores: [], series: [], seriesAnt: [], ruptura: [], situacaoEstoque: {}, alertas: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetch = async () => {
    setLoading(true); setError(null)
    try {
      const r = await getDashboardTvCompras()
      setData(r); setLastUpdate(new Date())
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao carregar dados")
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch(); const t = setInterval(fetch, 1800000); return () => clearInterval(t) }, [])

  if (loading && !lastUpdate) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor={C.bg}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={80} sx={{ color: C.red }} />
        <Typography color={C.muted}>Carregando dashboard...</Typography>
      </Stack>
    </Box>
  )

  // ── Dados ──────────────────────────────────────────────────────────────────
  const kpis = data.kpis ?? {}
  const comps: any[] = data.compradores ?? []
  const series: any[]    = data.series ?? []
  const seriesAnt: any[] = data.seriesAnt ?? []
  const ruptura: any[]   = data.ruptura ?? []
  const sit = data.situacaoEstoque ?? {}

  // Séries cumulativas para os gráficos de linha
  const cumul = (rows: any[], field: string) => {
    let acc = 0; return rows.map(r => { acc += safe(r[field]); return acc })
  }
  const cumulLbPct = (rows: any[]) => {
    let tv = 0, tlb = 0
    return rows.map(r => { tv += safe(r.venda); tlb += safe(r.lb); return tv > 0 ? tlb / tv * 100 : 0 })
  }

  const sparkVendas   = series.map(s => safe(s.venda))
  const sparkLbPct    = cumulLbPct(series)
  const sparkProdFora = series.map(s => safe(s.produtosFora))

  const chartVenda1 = cumul(series, "venda")
  const chartVenda2 = cumul(seriesAnt, "venda")
  const chartLb1    = cumulLbPct(series)
  const chartLb2    = cumulLbPct(seriesAnt)
  // NS: linha plana no valor atual
  const nsVal = safe(kpis.nivelServico)
  const chartNs1 = series.map(() => nsVal)

  const mesLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())
  const mesAbrev = now.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase().substring(0, 3) + "/" + now.getFullYear()
  const minAgo   = lastUpdate ? Math.round((now.getTime() - lastUpdate.getTime()) / 60000) : null

  // TOP5 e BOTTOM5
  const compByVenda = [...comps].sort((a, b) => b.vendaRealizado - a.vendaRealizado)
  const top5    = compByVenda.slice(0, 5)
  const bottom5 = [...comps].sort((a, b) => a.vendaPercentualMeta - b.vendaPercentualMeta).slice(0, 5)

  const th: React.CSSProperties = { color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "4px 6px", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }
  const td: React.CSSProperties = { color: C.text, fontSize: 11, padding: "4px 6px", borderBottom: `1px solid ${C.dim}` }
  const tdN: React.CSSProperties = { ...td, color: C.muted }

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
            <span onClick={fetch} style={{ cursor: "pointer", color: loading ? C.muted : C.green, fontSize: 16 }}>↻</span>
          </div>
        </div>
      </div>

      {/* ── 6 CARDS KPI ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <KpiCard title="VENDAS (R$)" icon="$" value={fmtR$(safe(kpis.vendasValor))} meta={fmtR$(safe(kpis.metaVendas))} trend={kpis.vendasVsMesAnterior ?? null} trendSuffix="%" upGood={true} sparkData={sparkVendas} sparkType="line" color={C.blue} alert={safe(kpis.vendasValor) < safe(kpis.metaVendas) * 0.9} />
        <KpiCard title="LB (%)" icon="%" value={fmtP(safe(kpis.lbPercentual))} meta={fmtP(safe(kpis.metaLb))} trend={kpis.lbVsMesAnterior ?? null} trendSuffix=" p.p." upGood={true} sparkData={sparkLbPct} sparkType="line" color={C.green} alert={safe(kpis.lbPercentual) > 0 && safe(kpis.lbPercentual) < safe(kpis.metaLb)} />
        <KpiCard title="NÍVEL DE SERVIÇO (%)" icon="🚚" value={fmtP(safe(kpis.nivelServico))} meta={fmtP(safe(kpis.nivelServicoMeta) || 98)} trend={kpis.nivelServicoVsMesAnterior ?? null} trendSuffix=" p.p." upGood={true} sparkData={chartNs1} sparkType="line" color={C.orange} alert={safe(kpis.nivelServico) > 0 && safe(kpis.nivelServico) < 98} />
        <KpiCard title="EVOLUÇÃO (%)" icon="🎯" value={fmtP(safe(kpis.evolucao), 0)} meta={fmtP(safe(kpis.evolucaoMeta) || 100, 0)} trend={kpis.evolucaoVsMesAnterior ?? null} trendSuffix="%" upGood={true} sparkData={sparkVendas} sparkType="line" color={C.purple} alert={safe(kpis.evolucao) < 100} />
        <KpiCard title="DIAS DE ESTOQUE" icon="📦" value={`${Math.round(safe(kpis.diasEstoque))} dias`} meta={`${safe(kpis.diasEstoqueMeta) || 45} dias`} trend={kpis.diasEstoqueVsMesAnterior ?? null} trendSuffix=" dias" upGood={false} sparkData={sparkVendas.map((_, i) => i + 1)} sparkType="bar" color={C.cyan} alert={safe(kpis.diasEstoque) > (safe(kpis.diasEstoqueMeta) || 45) * 1.1} />
        <KpiCard title="PRODUTOS FORA" icon="⚠️" value={`R$ ${fmtR$(safe(kpis.produtosForaValor))}`} meta={fmtR$(safe(kpis.metaProdutosFora))} trend={kpis.produtosForaVsMesAnterior ?? null} trendSuffix="%" upGood={false} sparkData={sparkProdFora} sparkType="bar" color={C.red} alert={safe(kpis.produtosForaValor) > safe(kpis.metaProdutosFora) * 1.1} />
      </div>

      {/* ── GRÁFICOS + ALERTAS ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        {/* Evolução de Vendas */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            📈 EVOLUÇÃO DE VENDAS (R$)
            <span style={{ color: C.muted, fontWeight: 400, marginLeft: 10, fontSize: 10 }}>— Este mês &nbsp; ‑ ‑ Mês anterior</span>
          </div>
          <LineChart data1={chartVenda1} data2={chartVenda2} color1={C.blue} title1="Este mês" title2="Mês anterior" fmtY={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)} />
        </div>

        {/* Evolução de LB */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            📊 EVOLUÇÃO DE LB (%)
            <span style={{ color: C.muted, fontWeight: 400, marginLeft: 10, fontSize: 10 }}>— Este mês &nbsp; ‑ ‑ Mês anterior</span>
          </div>
          <LineChart data1={chartLb1} data2={chartLb2} color1={C.green} title1="Este mês" title2="Mês anterior" fmtY={v => `${v.toFixed(0)}%`} />
        </div>

        {/* Evolução do Nível de Serviço */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
            🚚 EVOLUÇÃO DO NÍVEL DE SERVIÇO (%)
          </div>
          <LineChart data1={chartNs1} data2={[]} color1={C.orange} title1="Este mês" title2="" fmtY={v => `${v.toFixed(0)}%`} />
        </div>

        {/* Alertas */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.red}55`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>🔔 ALERTAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, overflowY: "auto", maxHeight: 160 }}>
            {(data.alertas ?? []).length > 0 ? (data.alertas as string[]).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: i % 3 === 0 ? C.red : i % 3 === 1 ? C.orange : C.yellow, fontSize: 8, marginTop: 3 }}>●</span>
                <span style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{a}</span>
              </div>
            )) : (
              <div style={{ fontSize: 11, color: C.green }}>✓ Sem alertas críticos</div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABELA DE COMPRADORES ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", marginBottom: 10, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>👥 DESEMPENHO POR COMPRADOR E GRUPO</span>
          <span style={{ color: C.muted, fontSize: 10 }}>Metas referentes ao mês: {mesAbrev}</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Comprador</th>
              <th style={th}>Grupos</th>
              <th style={{ ...th, textAlign: "center" }} colSpan={3}>Vendas (R$)</th>
              <th style={{ ...th, textAlign: "center" }} colSpan={2}>LB (%)</th>
              <th style={{ ...th, textAlign: "center" }} colSpan={2}>Nível Serviço (%)</th>
              <th style={{ ...th, textAlign: "center" }} colSpan={2}>Dias Estoque</th>
              <th style={{ ...th, textAlign: "center" }} colSpan={2}>Produtos Fora (R$)</th>
              <th style={th}>Status</th>
            </tr>
            <tr>
              <th style={th} />
              <th style={th} />
              <th style={th}>Realizado</th>
              <th style={th}>Meta</th>
              <th style={th}>Atingimento</th>
              <th style={th}>Realizado</th>
              <th style={th}>Meta</th>
              <th style={th}>Realizado</th>
              <th style={th}>Meta</th>
              <th style={th}>Realizado</th>
              <th style={th}>Meta</th>
              <th style={th}>Realizado</th>
              <th style={th}>Meta</th>
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {comps.length > 0 ? comps.map((c: any, i: number) => (
              <tr key={i} style={{ background: i % 2 === 1 ? "#060C1A" : "transparent" }}>
                <td style={td}>{c.comprador}</td>
                <td style={tdN}>{c.grupos}</td>
                <td style={td}>{fmtR$(safe(c.vendaRealizado))}</td>
                <td style={tdN}>{fmtR$(safe(c.metaVendasAjustada))}</td>
                <td style={td}><AtingBar pct={safe(c.vendaPercentualMeta)} /></td>
                <td style={td}>{fmtP(safe(c.lbPercentual))}</td>
                <td style={tdN}>{fmtP(safe(c.metaLb))}</td>
                <td style={{ ...td, color: safe(c.nivelServico) >= (c.nivelServicoMeta || 97) ? C.green : C.red }}>
                  {c.nivelServico !== null ? fmtP(safe(c.nivelServico)) : "—"}
                </td>
                <td style={tdN}>{fmtP(c.nivelServicoMeta || 97)}</td>
                <td style={{ ...td, color: safe(c.diasEstoque) <= (c.diasEstoqueMeta || 45) ? C.green : safe(c.diasEstoque) <= 55 ? C.orange : C.red }}>
                  {c.diasEstoque !== null ? `${Math.round(safe(c.diasEstoque))}` : "—"}
                </td>
                <td style={tdN}>{c.diasEstoqueMeta || 45}</td>
                <td style={td}>{c.vendaForaRealizado > 0 ? fmtR$(safe(c.vendaForaRealizado)) : "—"}</td>
                <td style={tdN}>{c.metaProdutosFora > 0 ? fmtR$(safe(c.metaProdutosFora)) : "—"}</td>
                <td style={td}><StatusBadge status={c.status} /></td>
              </tr>
            )) : (
              <tr><td colSpan={14} style={{ ...td, textAlign: "center", color: C.muted }}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── PAINEL INFERIOR ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>

        {/* Dias de Estoque por Comprador */}
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.cyan, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>📦 DIAS DE ESTOQUE POR COMPRADOR</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Comprador</th>
              <th style={{ ...th, width: 80 }}></th>
              <th style={{ ...th, textAlign: "right" }}>Dias</th>
            </tr></thead>
            <tbody>
              {comps.filter(c => c.diasEstoque !== null).map((c: any, i: number) => {
                const dias = Math.round(safe(c.diasEstoque))
                const color = dias <= 45 ? C.green : dias <= 55 ? C.orange : C.red
                return (
                  <tr key={i}>
                    <td style={{ ...td, fontSize: 10 }}>{c.comprador.split(" ")[0]}</td>
                    <td style={td}>
                      <div style={{ width: "100%", height: 6, background: C.dim, borderRadius: 3 }}>
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
        <div style={{ flex: 2, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ color: C.yellow, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 4, alignSelf: "flex-start" }}>SITUAÇÃO DO ESTOQUE</div>
          <Donut slices={[
            { label: "Ideal (Ok)",   pct: Math.round(safe(sit.idealPct)), color: C.green },
            { label: "Baixo (<Mín)", pct: Math.round(safe(sit.baixoPct)), color: C.orange },
            { label: "Alto (>Máx)",  pct: Math.round(safe(sit.altoPct)),  color: C.red },
          ]} w={160} h={150} />
        </div>

        {/* Produtos em Ruptura */}
        <div style={{ flex: 3, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>⛔ PRODUTOS EM RUPTURA</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Produto</th>
              <th style={th}>Grupo</th>
              <th style={{ ...th, textAlign: "center" }}>Lojas s/ estoque</th>
            </tr></thead>
            <tbody>
              {ruptura.length > 0 ? ruptura.map((r: any, i: number) => (
                <tr key={i} style={{ background: i % 2 === 1 ? "#060C1A" : "transparent" }}>
                  <td style={{ ...td, fontSize: 10 }}>{r.produto}</td>
                  <td style={tdN}>{r.codgrupo}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={{ background: r.lojasSemEstoque >= 5 ? "#3f0000" : r.lojasSemEstoque >= 3 ? "#431407" : "#1a1a00", color: r.lojasSemEstoque >= 5 ? C.red : r.lojasSemEstoque >= 3 ? C.orange : C.yellow, borderRadius: 4, padding: "1px 8px", fontWeight: 700, fontSize: 11 }}>
                      {r.lojasSemEstoque}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan={3} style={{ ...td, textAlign: "center", color: C.green }}>✓ Sem rupturas</td></tr>}
            </tbody>
          </table>
        </div>

        {/* TOP 5 e BOTTOM 5 */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* TOP 5 */}
          <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>🏆 TOP 5 GRUPOS — VENDAS (R$)</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Comprador</th>
                <th style={{ ...th, textAlign: "right" }}>Vendas</th>
                <th style={th}>Atingimento</th>
              </tr></thead>
              <tbody>
                {top5.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td, fontSize: 10 }}>{c.comprador.split(" ")[0]} ({c.grupos})</td>
                    <td style={{ ...td, textAlign: "right", fontSize: 11 }}>{fmtR$(safe(c.vendaRealizado))}</td>
                    <td style={td}><AtingBar pct={safe(c.vendaPercentualMeta)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM 5 */}
          <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", marginBottom: 6 }}>⚠ BOTTOM 5 — ATINGIMENTO</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Comprador</th>
                <th style={{ ...th, textAlign: "right" }}>Vendas</th>
                <th style={th}>Atingimento</th>
              </tr></thead>
              <tbody>
                {bottom5.map((c: any, i: number) => (
                  <tr key={i}>
                    <td style={{ ...td, fontSize: 10 }}>{c.comprador.split(" ")[0]} ({c.grupos})</td>
                    <td style={{ ...td, textAlign: "right", fontSize: 11 }}>{fmtR$(safe(c.vendaRealizado))}</td>
                    <td style={td}><AtingBar pct={safe(c.vendaPercentualMeta)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── RODAPÉ ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 6, fontSize: 10, color: C.muted }}>
        <div>
          <span style={{ color: C.muted }}>"Nosso compromisso: </span>
          <span style={{ color: C.blue, fontWeight: 600 }}>Comprar bem</span>
          <span style={{ color: C.muted }}> hoje para crescer sempre!"</span>
        </div>
        <div>
          Fonte: Sistema ERP &nbsp;|&nbsp; Atualizado em: {lastUpdate?.toLocaleDateString("pt-BR")} {lastUpdate?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          {error && <span style={{ color: C.red, marginLeft: 10 }}>⚠ {error}</span>}
        </div>
      </div>
    </div>
  )
}
