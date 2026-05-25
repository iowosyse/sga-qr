import { useNavigate } from 'react-router'
import { IconAlertOctagon } from '@tabler/icons-react'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <IconAlertOctagon size={80} className="mx-auto mb-4 text-gray-400" stroke={1} />
        <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-600 mb-6">Página no encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
