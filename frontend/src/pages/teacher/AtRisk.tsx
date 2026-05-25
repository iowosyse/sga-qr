import { useState, useEffect } from 'react'
import { NavRail } from '@/components/NavRail'
import { BottomNav } from '@/components/BottomNav'
import { TopBar } from '@/components/TopBar'
import { apiClient } from '@/lib/api'

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

const NIVEL_CONFIG = {
  critico: {
    borderColor: '#DC2626',
    textColor: 'text-[#DC2626]',
    barColor: 'bg-[#DC2626]',
    label: 'Crítico',
    range: '<60%',
  },
  riesgo: {
    borderColor: '#DC2626',
    textColor: 'text-[#DC2626]',
    barColor: 'bg-[#DC2626]',
    label: 'En riesgo',
    range: '60–69%',
  },
  atencion: {
    borderColor: '#D97706',
    textColor: 'text-[#D97706]',
    barColor: 'bg-[#D97706]',
    label: 'Atención',
    range: '70–79%',
  },
}

export function AtRisk() {
  const [data, setData] = useState<AtRiskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAtRisk = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getAtRisk()

        const alumnos = result.map((estudiante: any) => ({
          estudiante_id: estudiante.estudiante_id,
          nombre: estudiante.nombre,
          no_control: estudiante.no_control,
          grupo: '',
          total_sesiones: estudiante.total_sesiones,
          asistencias_validas: estudiante.asistencias,
          porcentaje: estudiante.porcentaje,
          nivel: estudiante.porcentaje < 60 ? 'critico' : estudiante.porcentaje < 70 ? 'riesgo' : 'atencion'
        }))

        setData({
          total_alumnos_revisados: alumnos.length,
          alumnos
        })
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

  const criteriosByNivel = {
    critico: data?.alumnos.filter((a) => a.nivel === 'critico') || [],
    riesgo: data?.alumnos.filter((a) => a.nivel === 'riesgo') || [],
    atencion: data?.alumnos.filter((a) => a.nivel === 'atencion') || [],
  }

  return (
    <div className="flex h-screen bg-[#F5F4EF]">
      <NavRail />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName="Docente" userRole="Panel de riesgo académico" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A18]">
                Alumnos en Riesgo Académico
              </h1>
              <p className="text-sm text-[#5A5A56] mt-1">
                Semestre Ene-May 2026 · Umbral: 80% asistencia
              </p>
            </div>

            {error && (
              <div className="bg-white border border-[#E5E4DF] border-l-[3px] border-l-[#DC2626] rounded-lg p-4">
                <p className="text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white rounded-lg border border-[#E5E4DF] animate-pulse" />
                ))}
              </div>
            ) : !data ? (
              <div className="bg-white rounded-lg border border-[#E5E4DF] p-12 text-center">
                <p className="text-sm text-[#5A5A56]">No se pudieron cargar los datos</p>
              </div>
            ) : (
              <div className="space-y-5">

                {(['critico', 'riesgo', 'atencion'] as const).map((nivel) => {
                  const cfg = NIVEL_CONFIG[nivel]
                  const alumnos = criteriosByNivel[nivel]

                  return (
                    <div
                      key={nivel}
                      className="bg-white rounded-lg border border-[#E5E4DF] overflow-hidden"
                      style={{ borderLeftWidth: 3, borderLeftColor: cfg.borderColor }}
                    >
                      <div className="px-5 py-3 border-b border-[#E5E4DF]">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-[#9A9A94] ml-2">{cfg.range}</span>
                        <span className="text-xs text-[#9A9A94] ml-2">
                          · {alumnos.length} {alumnos.length === 1 ? 'alumno' : 'alumnos'}
                        </span>
                      </div>

                      {alumnos.length === 0 ? (
                        <div className="px-5 py-4">
                          <p className="text-sm text-[#9A9A94]">Sin alumnos en este nivel</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E5E4DF]">
                          {alumnos.map((alumno) => (
                            <div
                              key={alumno.estudiante_id}
                              className="px-5 py-3.5 flex items-center gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm text-[#1A1A18]">
                                  {alumno.nombre}
                                </span>
                                <span className="text-sm text-[#5A5A56] ml-2">
                                  {alumno.no_control}
                                  {alumno.grupo ? ` · ${alumno.grupo}` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="w-28 h-1 bg-[#E5E4DF] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${cfg.barColor}`}
                                    style={{ width: `${alumno.porcentaje}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-semibold w-12 text-right ${cfg.textColor}`}>
                                  {alumno.porcentaje.toFixed(1)}%
                                </span>
                                <span className="text-xs text-[#9A9A94] w-14 text-right">
                                  {alumno.asistencias_validas}/{alumno.total_sesiones}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Resumen */}
                <div className="bg-white rounded-lg border border-[#E5E4DF] px-5 py-4 flex items-center gap-6">
                  <div>
                    <p className="text-xs text-[#5A5A56] uppercase tracking-wide font-medium">
                      Total revisados
                    </p>
                    <p className="text-xl font-semibold text-[#1A1A18] mt-0.5">
                      {data.total_alumnos_revisados}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[#E5E4DF]" />
                  <div>
                    <p className="text-xs text-[#5A5A56] uppercase tracking-wide font-medium">
                      En riesgo
                    </p>
                    <p className="text-xl font-semibold text-[#DC2626] mt-0.5">
                      {criteriosByNivel.critico.length + criteriosByNivel.riesgo.length}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[#E5E4DF]" />
                  <div>
                    <p className="text-xs text-[#5A5A56] uppercase tracking-wide font-medium">
                      En atención
                    </p>
                    <p className="text-xl font-semibold text-[#D97706] mt-0.5">
                      {criteriosByNivel.atencion.length}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
