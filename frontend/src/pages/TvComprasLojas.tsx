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

// ─── Card de resumo para TOTAL GERAL ─────────────────────────────────────────
function TotalCard({ icon, label, pct }: { icon: string; label: string; pct: number }) {
  const color = pct >= 100 ? C.green : pct >= 90 ? C.orange : C.red
  return (
    <div style={{
      background: "#040A18",
      border: `1px solid ${color}44`,
      borderTop: `2px solid ${color}`,
      borderRadius: 8,
      padding: "8px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      minWidth: 130,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {pct.toFixed(0)}%
      </div>
      <div style={{ width: "100%", height: 4, background: C.dim, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 9, color: C.muted }}>Meta: ≥ 100%</span>
    </div>
  )
}

// ─── Chips de NS por loja ─────────────────────────────────────────────────────
function NsLojaChips({ lojas, meta = 97, overall }: {
  lojas: { codloja: string; nivelServico: number }[]
  meta?: number
  overall?: number
}) {
  if (!lojas.length) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>
  const overallColor = overall !== undefined
    ? (overall >= meta ? C.green : overall >= meta * 0.9 ? C.orange : C.red)
    : C.muted
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {overall !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: overallColor, fontVariantNumeric: "tabular-nums" }}>
            {overall.toFixed(0)}%
          </span>
          <div style={{ flex: 1, height: 4, background: C.dim, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, overall / meta * 100)}%`, height: "100%", background: overallColor, borderRadius: 2 }} />
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "nowrap", gap: 2 }}>
        {lojas.map(l => {
          const ns = l.nivelServico
          const color = ns >= meta ? C.green : ns >= meta * 0.9 ? C.orange : C.red
          return (
            <div key={l.codloja} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: color + "1A",
              border: `1px solid ${color}55`,
              borderRadius: 3,
              padding: "1px 4px",
              minWidth: 26,
            }}>
              <span style={{ fontSize: 7, color: C.muted, lineHeight: 1.2 }}>{l.codloja}</span>
              <span style={{ fontSize: 9, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{ns}%</span>
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
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 2, marginTop: 3 }}>
      {lojas.map(l => {
        const d = l.diasEstoque
        const color = d <= meta ? C.green : d <= meta * 1.2 ? C.orange : C.red
        return (
          <div key={l.codloja} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: color + "1A",
            border: `1px solid ${color}55`,
            borderRadius: 3,
            padding: "1px 4px",
            minWidth: 26,
          }}>
            <span style={{ fontSize: 7, color: C.muted, lineHeight: 1.2 }}>{l.codloja}</span>
            <span style={{ fontSize: 9, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{d}d</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Chips de evolução por loja (vs mesmo período ano passado) ────────────────
function EvolLojaChips({ lojas, field }: {
  lojas: { codloja: string; evolVendas: number | null; evolLb: number | null; evolProdFora: number | null }[]
  field: "evolVendas" | "evolLb" | "evolProdFora"
}) {
  if (!lojas.length) return null
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", gap: 2, marginTop: 3 }}>
      {lojas.map(l => {
        const v = l[field]
        if (v === null) return null
        const color = v >= 0 ? C.green : v >= -10 ? C.orange : C.red
        const sign  = v >= 0 ? "+" : ""
        return (
          <div key={l.codloja} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: color + "1A",
            border: `1px solid ${color}55`,
            borderRadius: 3,
            padding: "1px 4px",
            minWidth: 26,
          }}>
            <span style={{ fontSize: 7, color: C.muted, lineHeight: 1.2 }}>{l.codloja}</span>
            <span style={{ fontSize: 9, color, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{sign}{v.toFixed(0)}%</span>
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
    }))
  })()

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
    color: C.muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.05em", padding: "4px 6px", whiteSpace: "nowrap",
    borderBottom: `1px solid ${C.border}`,
  }
  const td: React.CSSProperties = { color: C.text, fontSize: 11, padding: "3px 6px", borderBottom: `1px solid ${C.dim}` }
  const tdN: React.CSSProperties = { ...td, color: C.muted }
  const thG: React.CSSProperties = { ...th, borderLeft: `2px solid ${C.border}` }
  const tdG: React.CSSProperties = { ...td, borderLeft: `2px solid ${C.dim}` }

  // Estilo da linha de sub-total por comprador
  const tdSub: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, padding: "4px 6px",
    background: "#0A1628",
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    color: C.blue,
  }
  const tdSubG: React.CSSProperties = { ...tdSub, borderLeft: `2px solid ${C.border}` }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "10px 14px", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}>

      {/* ── CABEÇALHO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0e2b5c,#1D9BF0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛒</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1 }}>J MONTE CENTER</div>
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

      {/* ── TOTAL GERAL ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.blue, fontWeight: 800, fontSize: 13, letterSpacing: "0.1em" }}>TOTAL GERAL</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <TotalCard icon="💰" label="Vendas Atingimento"    pct={totalVendas} />
            <TotalCard icon="📊" label="LB Atingimento"        pct={totalLb} />
            <TotalCard icon="🚚" label="Nível Serviço"         pct={totalNs} />
            <TotalCard icon="📦" label="Dias Estoque"          pct={totalDias} />
            <TotalCard icon="🏷️" label="Prod. Fora"           pct={totalProd} />
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
              <th style={{ ...thG, textAlign: "center" }}>Vendas<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>LB<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Nível Serviço<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Dias Estoque<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Prod. Fora<br/>Atingimento</th>
              <th style={{ ...thG, textAlign: "center" }}>Metas</th>
            </tr>
          </thead>
          <tbody>
            {matrizCompradores.length > 0 ? matrizCompradores.flatMap((m, mi) => {
              const rowBg = mi % 2 === 1 ? "#060C1A" : "transparent"
              const firstName = m.comprador.split(" ")[0]

              const grupoRows = m.grupos.map((g: any, gi: number) => {
                const sepStyle: React.CSSProperties = gi === 0 && mi > 0
                  ? { borderTop: `2px solid ${C.border}` } : {}
                return (
                  <tr key={`${mi}-${gi}`} style={{ background: rowBg }}>
                    {gi === 0 && (
                      <td style={{ ...td, ...sepStyle, verticalAlign: "middle", fontWeight: 700, whiteSpace: "nowrap" }}
                        rowSpan={m.grupos.length}>
                        {m.comprador}
                      </td>
                    )}
                    <td style={{ ...tdN, ...sepStyle, fontSize: 10 }}>{g.grupoNome}</td>
                    <td style={{ ...tdG, ...sepStyle, whiteSpace: "nowrap" }}>
                      <AtingBar pct={safe(g.vendaPercentualMeta)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolVendas" />
                    </td>
                    <td style={{ ...tdG, ...sepStyle, whiteSpace: "nowrap" }}>
                      <AtingBar pct={lbAting(g)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolLb" />
                    </td>
                    <td style={{ ...tdG, ...sepStyle, whiteSpace: "nowrap" }}>
                      <NsLojaChips
                        lojas={g.nsPorLoja ?? []}
                        meta={g.nivelServicoMeta || 97}
                        overall={nsPresent(g) ? nsVal(g) : undefined}
                      />
                    </td>
                    <td style={{ ...tdG, ...sepStyle, whiteSpace: "nowrap" }}>
                      <AtingBar pct={diasAting(g)} />
                      <DiasLojaChips
                        lojas={g.diasPorLoja ?? []}
                        meta={g.diasEstoqueMeta || 45}
                      />
                    </td>
                    <td style={{ ...tdG, ...sepStyle, whiteSpace: "nowrap" }}>
                      <AtingBar pct={safe(g.produtosForaPercentual)} />
                      <EvolLojaChips lojas={g.evolPorLoja ?? []} field="evolProdFora" />
                    </td>
                    <td style={{ ...tdG, ...sepStyle }}><MetaIcons c={g} /></td>
                  </tr>
                )
              })

              // Linha de sub-total do comprador (usa dados agregados do array compradores)
              const sub = m.sub
              const subRow = sub ? (
                <tr key={`${mi}-sub`}>
                  <td style={{ ...tdSub, fontStyle: "italic" }} colSpan={2}>
                    SUB-TOTAL {firstName.toUpperCase()}
                  </td>
                  <td style={tdSubG}><AtingBar pct={safe(sub.vendaPercentualMeta)} height={8} /></td>
                  <td style={tdSubG}><AtingBar pct={lbAting(sub)} height={8} /></td>
                  <td style={tdSubG}>
                    {nsPresent(sub) ? <AtingBar pct={nsAting(sub)} height={8} /> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={tdSubG}>
                    {sub.diasEstoque !== null ? <AtingBar pct={diasAting(sub)} height={8} /> : <span style={{ color: C.muted }}>—</span>}
                  </td>
                  <td style={tdSubG}><AtingBar pct={safe(sub.produtosForaPercentual)} height={8} /></td>
                  <td style={tdSubG}><MetaIcons c={sub} /></td>
                </tr>
              ) : null

              return subRow ? [...grupoRows, subRow] : grupoRows
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
