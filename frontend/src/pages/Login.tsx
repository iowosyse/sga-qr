import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [controlNumber, setControlNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (role: 'teacher' | 'student') => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('role', role);
      localStorage.setItem('token', 'mock-token-' + Date.now());
      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/scanner');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-4 sm:px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-lg bg-charcoal flex items-center justify-center shadow-lg">
            <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
              <rect x="4" y="4" width="36" height="5" rx="2.5" fill="white" />
              <rect x="19" y="9" width="6" height="22" rx="3" fill="white" />
              <rect x="4" y="31" width="36" height="5" rx="2.5" fill="white" />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal">SGA-QR</h1>
            <p className="text-xs text-secondary mt-1">
              Instituto Tecnológico de Morelia
              <br />
              <span className="text-[10px]">Sistema de Gestión de Asistencias</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3.5 mb-6">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.75">Número de control</label>
            <input
              type="text"
              value={controlNumber}
              onChange={(e) => setControlNumber(e.target.value)}
              placeholder="21M0001"
              className="w-full px-3.5 py-2.5 rounded-xs border border-border-light bg-bg-light text-charcoal placeholder-secondary focus:outline-none focus:border-charcoal focus:ring-2 focus:ring-charcoal/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.75">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xs border border-border-light bg-bg-light text-charcoal placeholder-secondary focus:outline-none focus:border-charcoal focus:ring-2 focus:ring-charcoal/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-charcoal transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => handleLogin('teacher')}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xs bg-charcoal text-white text-sm font-bold hover:bg-charcoal/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>

          <button className="w-full text-xs text-secondary hover:text-charcoal font-medium transition-colors bg-transparent border-none cursor-pointer">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Quick access for development */}
        <div className="border-t border-border-subtle pt-6 space-y-2">
          <p className="text-[10px] text-secondary text-center font-semibold uppercase">Acceso rápido para desarrollo</p>
          <button
            onClick={() => handleLogin('teacher')}
            disabled={loading}
            className="w-full px-4 py-2 rounded-xs bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition-colors"
          >
            🖥 Entrar como Docente
          </button>
          <button
            onClick={() => handleLogin('student')}
            disabled={loading}
            className="w-full px-4 py-2 rounded-xs bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors"
          >
            📱 Entrar como Estudiante
          </button>
        </div>
      </div>
    </div>
  );
}
