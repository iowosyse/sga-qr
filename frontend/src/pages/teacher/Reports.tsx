import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react'
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

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [atRisk, setAtRisk] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Estudiante
    direction: 'asc' | 'desc'
  }>({ key: 'no_control', direction: 'asc' })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getGroups()
        setGrupos(result.grupos)
      } catch (err) {
        console.error('Error fetching grupos:', err)
        setError('No se pudieron cargar los grupos')
      } finally {
        setLoading(false)
      }
    }
    fetchGrupos()
  }, [])

  useEffect(() => {
    if (!grupoSeleccionado) {
      setResumen(null)
      setAtRisk([])
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [resumenRes, atRiskRes] = await Promise.all([
          apiClient.getReportsSummary(grupoSeleccionado),
          apiClient.getAtRisk(grupoSeleccionado, 80),
        ])

        setResumen(resumenRes)
        setAtRisk(atRiskRes)
        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar el reporte')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [grupoSeleccionado])

  const metricas = {
    promedio:
      resumen && resumen.estudiantes.length > 0
        ? parseFloat(
            (resumen.estudiantes.reduce((sum, e) => sum + e.porcentaje, 0) /
              resumen.estudiantes.length).toFixed(1)
          )
        : 0,
    enRiesgo: resumen ? resumen.estudiantes.filter(e => e.en_riesgo).length : 0,
    activos: resumen ? resumen.estudiantes.length : 0,
  }

  const estudiantesSorted = () => {
    if (!resumen) return []
    const sorted = [...resumen.estudiantes]
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
    return sorted
  }

  const handleExport = async () => {
    if (!grupoSeleccionado) return
    try {
      setExporting(true)
      const blob = await apiClient.exportCSV(grupoSeleccionado)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `asistencia-${grupoSeleccionado}-${
        new Date().toISOString().split('T')[0]
      }.csv`
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

  const estudiantesOrdenados = estudiantesSorted()

  // Para el eje X de la gráfica, usar solo el primer apellido
  const chartData = estudiantesOrdenados.map(e => ({
    ...e,
    shortName: e.nombre.split(' ')[1] ?? e.nombre.split(' ')[0],
  }))

  if (error && !resumen && !loading) {
    return (
      <div className="flex h-screen bg-[#F5F4EF]">
        <NavRail />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <IconAlertTriangle size={40} className="mx-auto mb-3 text-[#DC2626]" />
              <p className="text-[#DC2626] mb-4 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#2C2C2A] text-white text-sm rounded-lg hover:bg-[#1A1A18] transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
          <BottomNav />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F5F4EF]">
      <NavRail />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-5 max-w-7xl mx-auto">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A18]">
                Reportes de Asistencia
              </h1>
              <p className="text-sm text-[#5A5A56] mt-1">
                Selecciona un grupo para ver el reporte de asistencia
              </p>
            </div>

            {/* Group selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-[#5A5A56] whitespace-nowrap">
                Grupo
              </label>
              <select
                value={grupoSeleccionado || ''}
                onChange={(e) =>
                  setGrupoSeleccionado(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-72 px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm text-[#1A1A18] focus:outline-none focus:ring-2 focus:ring-[#2C2C2A]/20 focus:border-[#2C2C2A]"
              >
                <option value="">— Selecciona un grupo —</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>

            {!grupoSeleccionado ? (
              <div className="bg-white rounded-lg border border-[#E5E4DF] p-12 text-center">
                <p className="text-[#5A5A56]">Selecciona un grupo para ver el reporte</p>
              </div>
            ) : (
              <>
                {/* Metric cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg border border-[#E5E4DF] p-5">
                    <p className="text-xs font-medium text-[#5A5A56] uppercase tracking-wide">
                      Total de sesiones
                    </p>
                    {loading ? (
                      <div className="h-8 bg-[#EEEDE8] rounded animate-pulse mt-2" />
                    ) : (
                      <p className="text-3xl font-semibold text-[#2563EB] mt-2">
                        {resumen?.total_sesiones ?? 0}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E5E4DF] p-5">
                    <p className="text-xs font-medium text-[#5A5A56] uppercase tracking-wide">
                      Promedio de asistencia
                    </p>
                    {loading ? (
                      <div className="h-8 bg-[#EEEDE8] rounded animate-pulse mt-2" />
                    ) : (
                      <p className="text-3xl font-semibold text-[#16A34A] mt-2">
                        {metricas.promedio.toFixed(1)}%
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E5E4DF] p-5">
                    <p className="text-xs font-medium text-[#5A5A56] uppercase tracking-wide">
                      Alumnos en riesgo
                    </p>
                    {loading ? (
                      <div className="h-8 bg-[#EEEDE8] rounded animate-pulse mt-2" />
                    ) : (
                      <p className="text-3xl font-semibold text-[#DC2626] mt-2">
                        {metricas.enRiesgo}
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E5E4DF] p-5">
                    <p className="text-xs font-medium text-[#5A5A56] uppercase tracking-wide">
                      Alumnos activos
                    </p>
                    {loading ? (
                      <div className="h-8 bg-[#EEEDE8] rounded animate-pulse mt-2" />
                    ) : (
                      <p className="text-3xl font-semibold text-[#2563EB] mt-2">
                        {metricas.activos}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vertical bar chart */}
                <div className="bg-white rounded-lg border border-[#E5E4DF] p-5">
                  <h2 className="text-sm font-semibold text-[#1A1A18] mb-4">
                    Asistencia por estudiante
                  </h2>
                  {loading ? (
                    <div className="h-72 bg-[#EEEDE8] rounded animate-pulse flex items-center justify-center">
                      <p className="text-[#5A5A56] text-sm">Cargando gráfica...</p>
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E4DF"
                        />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fontSize: 11, fill: '#5A5A56' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#5A5A56' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Asistencia']}
                          labelFormatter={(label) => {
                            const match = chartData.find(d => d.shortName === label)
                            return match?.nombre ?? label
                          }}
                          contentStyle={{
                            border: '1px solid #E5E4DF',
                            borderRadius: 8,
                            fontSize: 12,
                            color: '#1A1A18',
                          }}
                        />
                        <ReferenceLine
                          y={80}
                          stroke="#DC2626"
                          strokeDasharray="4 4"
                          label={{ value: '80%', position: 'right', fontSize: 11, fill: '#DC2626' }}
                        />
                        <Bar dataKey="porcentaje" fill="#16A34A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-[#5A5A56] text-sm">
                      Sin datos
                    </div>
                  )}
                </div>

                {/* Students table */}
                <div className="bg-white rounded-lg border border-[#E5E4DF] overflow-hidden">
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-5 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-10 bg-[#EEEDE8] rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E5E4DF]">
                            {[
                              { key: 'no_control' as const, label: 'No. Control' },
                              { key: 'nombre' as const, label: 'Nombre' },
                              { key: 'total_sesiones' as const, label: 'Sesiones' },
                              { key: 'asistencias' as const, label: 'Asistencias' },
                              { key: 'ausencias' as const, label: 'Ausencias' },
                              { key: 'porcentaje' as const, label: '%' },
                            ].map((col) => (
                              <th
                                key={col.key}
                                onClick={() =>
                                  setSortConfig({
                                    key: col.key,
                                    direction:
                                      sortConfig.key === col.key &&
                                      sortConfig.direction === 'asc'
                                        ? 'desc'
                                        : 'asc',
                                  })
                                }
                                className="px-5 py-3 text-left text-xs font-medium text-[#5A5A56] uppercase tracking-wide cursor-pointer hover:text-[#1A1A18] transition-colors"
                              >
                                <span className="flex items-center gap-1">
                                  {col.label}
                                  {sortConfig.key === col.key && (
                                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                  )}
                                </span>
                              </th>
                            ))}
                            <th className="px-5 py-3 text-left text-xs font-medium text-[#5A5A56] uppercase tracking-wide">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantesOrdenados.map((est) => {
                            let estadoColor = 'text-[#16A34A]'
                            let estadoLabel = 'Regular'

                            if (est.porcentaje < 70) {
                              estadoColor = 'text-[#DC2626]'
                              estadoLabel = 'En Riesgo'
                            } else if (est.porcentaje < 80) {
                              estadoColor = 'text-[#D97706]'
                              estadoLabel = 'Atención'
                            }

                            return (
                              <tr
                                key={est.estudiante_id}
                                className="border-b border-[#E5E4DF] last:border-0 hover:bg-[#F5F4EF]/60 transition-colors"
                              >
                                <td className="px-5 py-3.5 text-sm font-medium text-[#1A1A18]">
                                  {est.no_control}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-[#1A1A18]">
                                  {est.nombre}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-[#5A5A56]">
                                  {est.total_sesiones}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-[#5A5A56]">
                                  {est.asistencias}
                                </td>
                                <td className="px-5 py-3.5 text-sm text-[#5A5A56]">
                                  {est.ausencias}
                                </td>
                                <td className="px-5 py-3.5 text-sm font-semibold text-[#1A1A18]">
                                  {est.porcentaje.toFixed(1)}%
                                </td>
                                <td className="px-5 py-3.5 text-sm">
                                  <span className={`font-medium ${estadoColor}`}>
                                    {estadoLabel}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Export */}
                <div className="flex justify-end pb-2">
                  <button
                    onClick={handleExport}
                    disabled={!grupoSeleccionado || exporting || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2A] text-white text-sm font-medium rounded-lg hover:bg-[#1A1A18] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <IconDownload size={16} />
                    {exporting ? 'Descargando...' : 'Descargar CSV'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}
