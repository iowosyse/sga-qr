import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/api';

export function Login() {
  const navigate = useNavigate();
  const [controlNumber, setControlNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (no_control: string, pwd: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.login(no_control, pwd);
      if (data.rol === 'docente' || data.rol === 'admin') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/scanner');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosErr.response?.status === 423) {
        setError('Cuenta bloqueada temporalmente. Intenta en 15 minutos.');
      } else {
        setError(
          axiosErr.response?.data?.detail ??
          'Credenciales incorrectas. Verifica tu número de control y contraseña.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!controlNumber.trim() || !password.trim()) {
      setError('Ingresa tu número de control y contraseña.');
      return;
    }
    doLogin(controlNumber.trim(), password);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4 sm:px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center shadow-lg"
               style={{ backgroundColor: '#2C2C2A' }}>
            <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
              <rect x="4" y="4" width="36" height="5" rx="2.5" fill="white" />
              <rect x="19" y="9" width="6" height="22" rx="3" fill="white" />
              <rect x="4" y="31" width="36" height="5" rx="2.5" fill="white" />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: '#2C2C2A' }}>SGA-QR</h1>
            <p className="text-xs mt-1" style={{ color: '#5A5A56' }}>
              Instituto Tecnológico de Morelia
              <br />
              <span className="text-[10px]">Sistema de Gestión de Asistencias</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2C2C2A' }}>
              Número de control
            </label>
            <input
              type="text"
              value={controlNumber}
              onChange={(e) => setControlNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="21M0001"
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none transition-all"
              style={{
                borderColor: '#D4D3CD',
                backgroundColor: '#F5F4EF',
                color: '#1A1A18',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#2C2C2A' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm focus:outline-none transition-all"
                style={{
                  borderColor: '#D4D3CD',
                  backgroundColor: '#F5F4EF',
                  color: '#1A1A18',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#9A9A94' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{ color: '#C62828', backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#2C2C2A' }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>

          <button
            type="button"
            className="w-full text-xs font-medium transition-colors bg-transparent border-none cursor-pointer"
            style={{ color: '#9A9A94' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </div>
  );
}
