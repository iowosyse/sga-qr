import { useState, useEffect } from 'react'
import { NavRail } from '@/components/NavRail'
import { BottomNav } from '@/components/BottomNav'
import { TopBar } from '@/components/TopBar'
import { apiClient } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

interface Alumno {
  estudiante_id: number
  nombre: string
  no_control: string
  grupo: string
  total_sesiones: number
  asistencias_validas: number
  porcentaje: number
  nivel: 'critico' | 'riesgo' | 'atencion'
}

interface AtRiskData {
  total_alumnos_revisados: number
  alumnos: Alumno[]
}

// ── Style constants (mismo sistema visual que Reports.tsx) ────────────────────

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

function nivelLabel(nivel: Alumno['nivel']): { label: string; color: string; bar: string } {
  switch (nivel) {
    case 'critico': return { label: 'Crítico',   color: '#DC2626', bar: '#DC2626' }
    case 'riesgo':  return { label: 'En Riesgo', color: '#D97706', bar: '#D97706' }
    case 'atencion':return { label: 'Atención',  color: '#CA8A04', bar: '#CA8A04' }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function AtRisk() {
  const [data, setData] = useState<AtRiskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAtRisk = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getAtRisk()

        const alumnos: Alumno[] = result.map((est: any) => ({
          estudiante_id: est.estudiante_id,
          nombre: est.nombre,
          no_control: est.no_control,
          grupo: est.grupo ?? '',
          total_sesiones: est.total_sesiones,
          asistencias_validas: est.asistencias,
          porcentaje: est.porcentaje,
          nivel: est.porcentaje < 60 ? 'critico' : est.porcentaje < 70 ? 'riesgo' : 'atencion',
        }))

        setData({ total_alumnos_revisados: alumnos.length, alumnos })
        setError(null)
      } catch (err) {
        console.error('Error fetching at-risk data:', err)
        setError('No se pudieron cargar los datos de alumnos en riesgo')
      } finally {
        setLoading(false)
      }
    }
    fetchAtRisk()
  }, [])

  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 space-y-6">

          {/* Header */}
          <div className="shrink-0">
            <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>
              Alumnos en Riesgo Académico
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>
              Semestre Ene–May 2026 · Umbral: 80% asistencia
            </p>
          </div>

          {error && (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2', color: '#DC2626' }}
            >
              {error}
            </div>
          )}

          {/* Tabla única */}
          <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['No. Control', 'Nombre', 'Grupo', '% Asistencia', 'Sesiones', 'Nivel'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Skeleton
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6].map(j => (
                        <td key={j} style={TD(i % 2 === 1)}>
                          <div className="h-3 bg-[#EEEDE8] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data || data.alumnos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ ...TD(false), textAlign: 'center', color: '#9A9A94' }}
                    >
                      Sin alumnos en riesgo académico
                    </td>
                  </tr>
                ) : (
                  data.alumnos.map((alumno, i) => {
                    const { label, color, bar } = nivelLabel(alumno.nivel)
                    return (
                      <tr key={alumno.estudiante_id}>
                        {/* No. Control */}
                        <td style={{ ...TD(i % 2 === 1), fontFamily: 'monospace' }}>
                          {alumno.no_control}
                        </td>

                        {/* Nombre */}
                        <td style={{ ...TD(i % 2 === 1), fontWeight: 500 }}>
                          {alumno.nombre}
                        </td>

                        {/* Grupo */}
                        <td style={{ ...TD(i % 2 === 1), color: '#5A5A56' }}>
                          {alumno.grupo || '—'}
                        </td>

                        {/* % Asistencia + barra delgada */}
                        <td style={TD(i % 2 === 1)}>
                          <span style={{ fontWeight: 700, color }}>{alumno.porcentaje.toFixed(1)}%</span>
                          <div
                            style={{
                              marginTop: 5,
                              height: 3,
                              borderRadius: 2,
                              backgroundColor: BORDER,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${alumno.porcentaje}%`,
                                backgroundColor: bar,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </td>

                        {/* Sesiones */}
                        <td style={{ ...TD(i % 2 === 1), color: '#5A5A56' }}>
                          {alumno.asistencias_validas}/{alumno.total_sesiones}
                        </td>

                        {/* Nivel — solo texto con color, sin fondo */}
                        <td style={TD(i % 2 === 1)}>
                          <span style={{ fontWeight: 600, color }}>{label}</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Resumen al pie */}
          {data && !loading && (
            <div
              className="rounded-lg border px-5 py-4 flex items-center gap-6 bg-white"
              style={{ borderColor: BORDER }}
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9A9A94' }}>
                  Total revisados
                </div>
                <div className="text-xl font-bold mt-0.5" style={{ color: '#1A1A18' }}>
                  {data.total_alumnos_revisados}
                </div>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: BORDER }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9A9A94' }}>
                  Críticos
                </div>
                <div className="text-xl font-bold mt-0.5" style={{ color: '#DC2626' }}>
                  {data.alumnos.filter(a => a.nivel === 'critico').length}
                </div>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: BORDER }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9A9A94' }}>
                  En Riesgo
                </div>
                <div className="text-xl font-bold mt-0.5" style={{ color: '#D97706' }}>
                  {data.alumnos.filter(a => a.nivel === 'riesgo').length}
                </div>
              </div>
              <div style={{ width: 1, height: 32, backgroundColor: BORDER }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9A9A94' }}>
                  En Atención
                </div>
                <div className="text-xl font-bold mt-0.5" style={{ color: '#CA8A04' }}>
                  {data.alumnos.filter(a => a.nivel === 'atencion').length}
                </div>
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
