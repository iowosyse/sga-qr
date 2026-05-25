import { useState, useEffect } from 'react'
import axios from 'axios'
import { IconFileText, IconX, IconCheck, IconAlertCircle, IconLoader } from '@tabler/icons-react'
import { BottomNav } from '@/components/BottomNav'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Justificante {
  id: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  motivo_rechazo: string | null
}

interface Ausencia {
  asistencia_id: number
  fecha: string
  materia: string
  hora_inicio: string
  justificante: Justificante | null
}

export function Ausencias() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [selectedAusenciaId, setSelectedAusenciaId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const getAuthToken = () => localStorage.getItem('access_token') || ''

  // Fetch ausencias on mount
  useEffect(() => {
    const fetchAusencias = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_URL}/api/student/ausencias`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        })
        setAusencias(response.data.ausencias || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching ausencias:', err)
        setError('No se pudieron cargar las ausencias')
      } finally {
        setLoading(false)
      }
    }
    fetchAusencias()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedAusenciaId) return

    try {
      setUploading(true)

      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1]

        const response = await axios.post(
          `${API_URL}/api/student/justificante`,
          {
            asistencia_id: selectedAusenciaId,
            archivo_base64: base64,
            archivo_nombre: file.name,
          },
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        )

        // Update local state
        setAusencias((prev) =>
          prev.map((a) =>
            a.asistencia_id === selectedAusenciaId
              ? {
                  ...a,
                  justificante: {
                    id: response.data.id,
                    estado: 'pendiente',
                    motivo_rechazo: null,
                  },
                }
              : a
          )
        )

        // Close sheet
        setShowSheet(false)
        setFile(null)
        setPreview(null)
        setSelectedAusenciaId(null)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading justificante:', err)
      setError('Error al subir el justificante')
    } finally {
      setUploading(false)
    }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha + 'T00:00:00')
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ]
    const day = date.getDate()
    const monthName = meses[date.getMonth()]
    const dayName = dias[date.getDay()]
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day} de ${monthName}`
  }

  const ausenciasJustificadas = ausencias.filter((a) => a.justificante).length
  const ausenciasTotal = ausencias.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <IconLoader className="animate-spin mx-auto mb-4 text-blue-600" size={32} />
          <p className="text-gray-600">Cargando ausencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mis Faltas</h1>
          <p className="text-sm text-gray-600 mt-1">
            {ausenciasJustificadas} de {ausenciasTotal} justificadas
          </p>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <IconAlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {ausencias.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <IconCheck className="mx-auto mb-3 text-green-600" size={32} />
            <p className="text-green-800 font-medium">¡Sin ausencias registradas!</p>
            <p className="text-sm text-green-700 mt-1">Excelente asistencia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ausencias.map((ausencia) => {
              const j = ausencia.justificante
              const isSinJustificante = !j
              const isPendiente = j?.estado === 'pendiente'
              const isAprobado = j?.estado === 'aprobado'
              const isRechazado = j?.estado === 'rechazado'

              let bgColor = 'bg-white'
              let borderColor = 'border-gray-200'

              if (isRechazado) {
                bgColor = 'bg-red-50'
                borderColor = 'border-red-200'
              } else if (isAprobado) {
                bgColor = 'bg-green-50'
                borderColor = 'border-green-200'
              } else if (isPendiente) {
                bgColor = 'bg-yellow-50'
                borderColor = 'border-yellow-200'
              }

              return (
                <div key={ausencia.asistencia_id} className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{formatFecha(ausencia.fecha)}</p>
                      <p className="text-sm text-gray-600">{ausencia.materia}</p>
                      <p className="text-xs text-gray-500 mt-1">Hora: {ausencia.hora_inicio}</p>
                    </div>
                    <div className="text-right ml-3">
                      {isSinJustificante && (
                        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                          Sin justificar
                        </span>
                      )}
                      {isPendiente && (
                        <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-700 text-xs font-medium rounded">
                          En revisión
                        </span>
                      )}
                      {isAprobado && (
                        <span className="inline-block px-2 py-1 bg-green-200 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                          <IconCheck size={14} /> Aprobada
                        </span>
                      )}
                      {isRechazado && (
                        <span className="inline-block px-2 py-1 bg-red-200 text-red-700 text-xs font-medium rounded flex items-center gap-1">
                          <IconX size={14} /> Rechazada
                        </span>
                      )}
                    </div>
                  </div>

                  {isRechazado && j?.motivo_rechazo && (
                    <div className="mt-3 p-3 bg-white border border-red-100 rounded text-sm text-red-700">
                      <p className="font-medium mb-1">Motivo del rechazo:</p>
                      <p>{j.motivo_rechazo}</p>
                    </div>
                  )}

                  {isSinJustificante && (
                    <button
                      onClick={() => {
                        setSelectedAusenciaId(ausencia.asistencia_id)
                        setShowSheet(true)
                      }}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                    >
                      Justificar
                    </button>
                  )}

                  {isPendiente && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                      Tu justificante está siendo revisado por el docente
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      {showSheet && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => {
              setShowSheet(false)
              setFile(null)
              setPreview(null)
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Subir justificante</h2>
              <button
                onClick={() => {
                  setShowSheet(false)
                  setFile(null)
                  setPreview(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <IconFileText className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-sm font-medium text-gray-900">
                    {file ? file.name : 'Selecciona un archivo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Imágenes o PDF</p>
                </label>
              </div>

              {preview && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Vista previa:</p>
                  <img src={preview} alt="preview" className="max-h-48 w-full object-cover rounded" />
                </div>
              )}

              {file && !preview && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <IconFileText className="text-gray-400" size={24} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">PDF</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <IconLoader className="animate-spin" size={20} />
                    Enviando...
                  </>
                ) : (
                  'Enviar justificante'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
