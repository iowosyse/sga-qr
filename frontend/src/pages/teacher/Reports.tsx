import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  IconSchool, IconChartBar, IconAlertTriangle, IconAlertCircle,
  IconDownload,
} from '@tabler/icons-react'
import { NavRail } from '@/components/NavRail'
import { BottomNav } from '@/components/BottomNav'
import { TopBar } from '@/components/TopBar'
import { apiClient } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

interface Grupo {
  id: number
  nombre: string
}

interface Estudiante {
  estudiante_id: number
  no_control: string
  nombre: string
  total_sesiones: number
  asistencias: number
  ausencias: number
  porcentaje: number
  en_riesgo: boolean
}

interface Resumen {
  total_sesiones: number
  periodo: { inicio: string; fin: string }
  estudiantes: Estudiante[]
}

// ── Mock trend data — se reemplazará con endpoint de tendencia cuando exista ──

const TREND_DATA = [
  { semana: 1,  pct: 92 }, { semana: 2,  pct: 90 }, { semana: 3,  pct: 91 },
  { semana: 4,  pct: 88 }, { semana: 5,  pct: 85 }, { semana: 6,  pct: 83 },
  { semana: 7,  pct: 80 }, { semana: 8,  pct: 78 }, { semana: 9,  pct: 79 },
  { semana: 10, pct: 81 }, { semana: 11, pct: 80 }, { semana: 12, pct: 82 },
  { semana: 13, pct: 83 }, { semana: 14, pct: 84 }, { semana: 15, pct: 84 },
  { semana: 16, pct: 84 },
]

// ── Style constants (matching molde) ─────────────────────────────────────────

const BORDER = '#E5E4DF'
const TH: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#9A9A94',
  backgroundColor: '#FAFAFA',
  borderBottom: `1px solid ${BORDER}`,
  textAlign: 'left',
}
const TD = (alt: boolean): React.CSSProperties => ({
  padding: '12px 14px',
  fontSize: 12,
  color: '#1A1A18',
  borderBottom: `1px solid ${BORDER}`,
  backgroundColor: alt ? '#FAFAF8' : '#FFFFFF',
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function subjectBadge(avg: number) {
  if (avg > 85) return { bg: '#F0FDF4', color: '#16A34A', label: 'Regular' }
  if (avg >= 70) return { bg: '#FFF7ED', color: '#C2410C', label: 'En riesgo' }
  return { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' }
}

function riskBadge(pct: number) {
  if (pct > 70) return { bg: '#FFF7ED', color: '#C2410C', label: 'En riesgo' }
  return { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' }
}

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [atRisk, setAtRisk] = useState<Estudiante[]>([])
  const [trendData, setTrendData] = useState<{ semana: number; pct: number }[]>(TREND_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Fetch grupos al montar
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const result = await apiClient.getGroups()
        setGrupos(result.grupos)
      } catch (err) {
        console.error('Error fetching grupos:', err)
        setError('No se pudieron cargar los grupos')
      }
    }
    fetchGrupos()
  }, [])

  // Fetch resumen, at-risk y tendencia cuando cambia el grupo
  useEffect(() => {
    if (!grupoSeleccionado) {
      setResumen(null)
      setAtRisk([])
      setTrendData(TREND_DATA)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [resumenRes, atRiskRes, sessionsRes] = await Promise.all([
          apiClient.getReportsSummary(grupoSeleccionado),
          apiClient.getAtRisk(grupoSeleccionado, 80),
          apiClient.getSessionsReport(grupoSeleccionado),
        ])
        setResumen(resumenRes)
        setAtRisk(Array.isArray(atRiskRes) ? atRiskRes : atRiskRes.alumnos ?? [])
        const trend = calculateTrend(Array.isArray(sessionsRes) ? sessionsRes : sessionsRes.sesiones ?? [])
        setTrendData(trend)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar el reporte')
        setTrendData(TREND_DATA)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [grupoSeleccionado])

  // Métricas calculadas del resumen
  const estudiantes = resumen?.estudiantes ?? []
  const promedio =
    estudiantes.length > 0
      ? parseFloat(
          (estudiantes.reduce((s, e) => s + e.porcentaje, 0) / estudiantes.length).toFixed(1)
        )
      : 0
  const enRiesgo = estudiantes.filter(e => e.en_riesgo).length
  const criticos = estudiantes.filter(e => e.porcentaje < 70).length

  // Nombre del grupo seleccionado
  const grupoNombre = grupos.find(g => g.id === grupoSeleccionado)?.nombre ?? '—'

  // Calcular tendencia de asistencia por semana
  const calculateTrend = (sessions: any[]) => {
    const SEMESTER_START = new Date('2026-01-26');
    const weekData: { [key: number]: { sum: number; count: number } } = {};

    sessions.forEach((session: any) => {
      const sessionDate = new Date(session.fecha);
      const diffMs = sessionDate.getTime() - SEMESTER_START.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const semana = Math.ceil(diffDays / 7) + 1;

      if (!weekData[semana]) {
        weekData[semana] = { sum: 0, count: 0 };
      }
      weekData[semana].sum += session.porcentaje || 0;
      weekData[semana].count += 1;
    });

    const trend = Object.keys(weekData)
      .map((semana) => {
        const data = weekData[parseInt(semana)];
        return { semana: parseInt(semana), pct: Math.round((data.sum / data.count) * 10) / 10 };
      })
      .sort((a, b) => a.semana - b.semana);

    return trend;
  };

  // Exportar CSV
  const handleExport = async () => {
    if (!grupoSeleccionado) return
    try {
      setExporting(true)
      const blob = await apiClient.exportCSV(grupoSeleccionado)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `asistencia-${grupoSeleccionado}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting:', err)
      setError('Error al descargar el archivo')
    } finally {
      setExporting(false)
    }
  }

  // Esqueleto de carga (5 filas)
  const skeletonRows = (cols: number) =>
    [1, 2, 3, 4, 5].map(i => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={TD(i % 2 === 1)}>
            <div className="h-3 bg-[#EEEDE8] rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ))

  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 space-y-8">

          {/* Selector de grupo + breadcrumb */}
          <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>Reportes</h1>
              <p className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>
                Semestre en curso
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A5A56' }}>
                Selecciona un grupo
              </label>
              <select
                value={grupoSeleccionado ?? ''}
                onChange={e => setGrupoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
                className="text-sm font-medium rounded-lg px-4 py-3 bg-white hover:bg-[#FAFAF8] transition-colors focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                style={{
                  border: `2px solid ${grupoSeleccionado ? '#2C2C2A' : BORDER}`,
                  color: grupoSeleccionado ? '#1A1A18' : '#9A9A94',
                  minWidth: 280,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%232C2C2A' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: 36,
                }}
              >
                <option value="">Selecciona un grupo</option>
                {grupos.map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2', color: '#DC2626' }}
            >
              {error}
            </div>
          )}

          {!grupoSeleccionado ? (
            <div
              className="rounded-lg border p-12 text-center text-sm"
              style={{ borderColor: BORDER, backgroundColor: '#FFFFFF', color: '#9A9A94' }}
            >
              Selecciona un grupo para ver el reporte
            </div>
          ) : (
            <>
              {/* ── SECCIÓN 1: Tarjetas de resumen ── */}
              <div className="grid grid-cols-4 gap-4">
                {/* Clases impartidas */}
                <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F5F4EF' }}
                  >
                    <IconSchool size={20} style={{ color: '#2C2C2A' }} />
                  </div>
                  <div>
                    {loading
                      ? <div className="h-7 w-10 bg-[#EEEDE8] rounded animate-pulse mb-1" />
                      : <div className="text-2xl font-bold" style={{ color: '#1A1A18' }}>{resumen?.total_sesiones ?? 0}</div>
                    }
                    <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Clases impartidas</div>
                  </div>
                </div>

                {/* Promedio global */}
                <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F5F4EF' }}
                  >
                    <IconChartBar size={20} style={{ color: '#2C2C2A' }} />
                  </div>
                  <div>
                    {loading
                      ? <div className="h-7 w-14 bg-[#EEEDE8] rounded animate-pulse mb-1" />
                      : <div className="text-2xl font-bold" style={{ color: '#16A34A' }}>{promedio.toFixed(1)}%</div>
                    }
                    <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Asistencia promedio</div>
                  </div>
                </div>

                {/* En riesgo */}
                <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F5F4EF' }}
                  >
                    <IconAlertTriangle size={20} style={{ color: '#2C2C2A' }} />
                  </div>
                  <div>
                    {loading
                      ? <div className="h-7 w-8 bg-[#EEEDE8] rounded animate-pulse mb-1" />
                      : <div className="text-2xl font-bold" style={{ color: '#C2410C' }}>{enRiesgo}</div>
                    }
                    <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Alumnos en riesgo (&lt;80%)</div>
                  </div>
                </div>

                {/* Críticos */}
                <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#F5F4EF' }}
                  >
                    <IconAlertCircle size={20} style={{ color: '#2C2C2A' }} />
                  </div>
                  <div>
                    {loading
                      ? <div className="h-7 w-8 bg-[#EEEDE8] rounded animate-pulse mb-1" />
                      : <div className="text-2xl font-bold" style={{ color: '#DC2626' }}>{criticos}</div>
                    }
                    <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Alumnos críticos (&lt;70%)</div>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN 2: Gráfica de tendencia ── */}
              <div className="bg-white rounded-lg border p-6" style={{ borderColor: BORDER }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: '#1A1A18' }}>
                  Tendencia de asistencia — Semestre actual
                </h2>
                {trendData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9A9A94', fontSize: 14 }}>
                    Sin sesiones registradas para este grupo
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="semana"
                        tick={{ fontSize: 11, fill: '#9A9A94' }}
                        label={{ value: 'Semana', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9A9A94' }}
                      />
                      <YAxis
                        domain={[60, 100]}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontSize: 11, fill: '#9A9A94' }}
                      />
                      <Tooltip
                        formatter={v => [`${v}%`, 'Asistencia']}
                        labelFormatter={l => `Semana ${l}`}
                        contentStyle={{ fontSize: 12, borderColor: BORDER, borderRadius: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pct"
                        stroke="#2C2C2A"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#2C2C2A' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* ── SECCIÓN 3: Resumen por materia + botón exportar ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold" style={{ color: '#1A1A18' }}>Resumen por materia</h2>
                  <button
                    onClick={handleExport}
                    disabled={exporting || loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold transition-colors hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: BORDER, color: '#5A5A56', backgroundColor: '#FFFFFF' }}
                  >
                    <IconDownload size={14} />
                    {exporting ? 'Descargando…' : 'Exportar reporte CSV'}
                  </button>
                </div>

                <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Materia / Grupo', 'Total clases', 'Asistencia promedio', 'Estado'].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        skeletonRows(4)
                      ) : resumen ? (
                        (() => {
                          const badge = subjectBadge(promedio)
                          return (
                            <tr>
                              <td style={{ ...TD(false), fontWeight: 500 }}>{grupoNombre}</td>
                              <td style={TD(false)}>{resumen.total_sesiones}</td>
                              <td style={TD(false)}>
                                <span style={{ fontWeight: 700, color: badge.color }}>{promedio.toFixed(1)}%</span>
                              </td>
                              <td style={TD(false)}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 99,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })()
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ ...TD(false), textAlign: 'center', color: '#9A9A94' }}>
                            Sin datos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SECCIÓN 4: Alumnos en riesgo ── */}
              <div>
                <h2 className="text-sm font-bold" style={{ color: '#1A1A18' }}>
                  Alumnos en riesgo de reprobación
                </h2>
                <p className="text-xs mt-0.5 mb-3" style={{ color: '#9A9A94' }}>
                  Asistencia por debajo del 80%
                </p>

                <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['No. Control', 'Nombre', '% Asistencia', 'Faltas', 'Estado'].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        skeletonRows(5)
                      ) : atRisk.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ ...TD(false), textAlign: 'center', color: '#9A9A94' }}>
                            Sin alumnos en riesgo para este grupo
                          </td>
                        </tr>
                      ) : (
                        atRisk.map((est, i) => {
                          const badge = riskBadge(est.porcentaje)
                          return (
                            <tr key={est.estudiante_id}>
                              <td style={{ ...TD(i % 2 === 1), fontFamily: 'monospace' }}>{est.no_control}</td>
                              <td style={{ ...TD(i % 2 === 1), fontWeight: 500 }}>{est.nombre}</td>
                              <td style={TD(i % 2 === 1)}>
                                <span style={{ fontWeight: 700, color: badge.color }}>{est.porcentaje.toFixed(1)}%</span>
                              </td>
                              <td style={{ ...TD(i % 2 === 1), color: '#5A5A56' }}>{est.ausencias}</td>
                              <td style={TD(i % 2 === 1)}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 10px',
                                    borderRadius: 99,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                  }}
                                >
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="h-2" />
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
