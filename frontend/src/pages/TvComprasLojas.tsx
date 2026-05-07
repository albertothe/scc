import { useEffect, useState } from "react"
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
    <div style={{ display: "flex", alignItems: "center", gap: 5, width: "100%" }}>
      <div style={{ flex: 1, height, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, width: 38, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
    </div>
  )
}

// ─── Ícones de meta (V L N D P) ──────────────────────────────────────────────
function MetaIcons({ c }: { c: any }) {
  const items = [
    { key: "V", ok: safe(c.vendaPercentualMeta) >= 100,                                            title: "Vendas" },
    { key: "L", ok: safe(c.lbPercentual) >= safe(c.metaLb),                                        title: "LB" },
    { key: "N", ok: c.nivelServico !== null && safe(c.nivelServico) >= (c.nivelServicoMeta || 97), title: "Nível Serviço" },
    { key: "D", ok: c.diasEstoque !== null && safe(c.diasEstoque) <= (c.diasEstoqueMeta || 45),    title: "Dias Estoque" },
    { key: "P", ok: safe(c.produtosForaPercentual) >= 100,                                          title: "Prod. Fora" },
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
export default function TvComprasLojas() {
  const [data, setData] = useState<any>({ kpis: {}, compradores: [], compradoresGrupos: [] })
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
        <CircularProgress size={80} sx={{ color: C.blue }} />
        <Typography color={C.muted}>Carregando dashboard...</Typography>
      </Stack>
    </Box>
  )

  const gruposFlat: any[]  = data.compradoresGrupos ?? []
  const mesLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase())
  const mesAbrev = now.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase().substring(0, 3) + "/" + now.getFullYear()
  const minAgo   = lastUpdate ? Math.round((now.getTime() - lastUpdate.getTime()) / 60000) : null

  // Agrupa para tabela: [{comprador, grupos:[...]}]
  const matrizCompradores = (() => {
    const map = new Map<string, any[]>()
    for (const g of gruposFlat) {
      if (!map.has(g.comprador)) map.set(g.comprador, [])
      map.get(g.comprador)!.push(g)
    }
    return Array.from(map.entries()).map(([comprador, grupos]) => ({ comprador, grupos }))
  })()

  // Converte métricas para % de atingimento
  const lbAting  = (g: any) => safe(g.metaLb) > 0 ? safe(g.lbPercentual) / safe(g.metaLb) * 100 : 0
  const nsAting  = (g: any) => (g.nivelServicoMeta || 97) > 0 ? safe(g.nivelServico) / (g.nivelServicoMeta || 97) * 100 : 0
  const diasAting = (g: any) => {
    const real = safe(g.diasEstoque); const meta = g.diasEstoqueMeta || 45
    return real > 0 ? (meta / real) * 100 : 0
  }

  const th: React.CSSProperties = {
    color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.05em", padding: "4px 6px", whiteSpace: "nowrap",
    borderBottom: `1px solid ${C.border}`,
  }
  const td: React.CSSProperties = { color: C.text, fontSize: 11, padding: "3px 6px", borderBottom: `1px solid ${C.dim}` }
  const tdN: React.CSSProperties = { ...td, color: C.muted }
  const thG: React.CSSProperties = { ...th, borderLeft: `2px solid ${C.border}` }
  const tdG: React.CSSProperties = { ...td, borderLeft: `2px solid ${C.dim}` }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "10px 14px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0e2b5c,#1D9BF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛒</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1 }}>DASHBOARD COMPRAS</div>
            <div style={{ fontSize: 11, color: "#4B7FB5", letterSpacing: "0.1em" }}>DESEMPENHO POR COMPRADOR E GRUPO — {mesLabel.toUpperCase()}</div>
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

      {/* ── TABELA MATRIZ: COMPRADOR × GRUPO ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: C.blue, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em" }}>👥 DESEMPENHO POR COMPRADOR E GRUPO</span>
          <span style={{ color: C.muted, fontSize: 10 }}>Metas referentes ao mês: {mesAbrev}</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Comprador</th>
              <th style={th}>Grupo</th>
              <th style={{ ...thG, textAlign: "center", minWidth: 140 }}>Vendas<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center", minWidth: 140 }}>LB<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center", minWidth: 140 }}>Nível Serviço<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center", minWidth: 140 }}>Dias Estoque<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center", minWidth: 140 }}>Prod. Fora<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Metas</th>
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
                      <td style={{ ...td, ...sepStyle, verticalAlign: "top", fontWeight: 700, paddingTop: 8, whiteSpace: "nowrap" }}
                        rowSpan={m.grupos.length}>
                        {g.comprador}
                      </td>
                    )}
                    <td style={{ ...tdN, ...sepStyle, fontSize: 10 }}>{g.grupoNome}</td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      <AtingBar pct={safe(g.vendaPercentualMeta)} />
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      <AtingBar pct={lbAting(g)} />
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      {g.nivelServico !== null
                        ? <AtingBar pct={nsAting(g)} />
                        : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      {g.diasEstoque !== null
                        ? <AtingBar pct={diasAting(g)} />
                        : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      <AtingBar pct={safe(g.produtosForaPercentual)} />
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}>
                      <MetaIcons c={g} />
                    </td>
                  </tr>
                )
              })
            ) : (
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
