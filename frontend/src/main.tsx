import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-bg-app p-lg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-md">SGA-QR</h1>
          <p className="text-lg text-secondary mb-lg">
            Sistema de Gestión de Asistencia Escolar con Validación QR
          </p>
          <div className="bg-bg-surface border border-border-light rounded-lg p-xl shadow-md">
            <p className="text-base-lg text-charcoal">
              ✅ Tokens de diseño configurados en Tailwind CSS
            </p>
            <p className="text-sm text-secondary mt-sm">
              Listo para empezar a desarrollar componentes
            </p>
          </div>
        </div>

        {/* Color palette preview */}
        <div className="mt-2xl grid grid-cols-2 md:grid-cols-3 gap-md">
          <div className="p-lg rounded-sm bg-charcoal text-white text-center">
            <p className="font-semibold">#2C2C2A</p>
            <p className="text-xs">Charcoal</p>
          </div>
          <div className="p-lg rounded-sm bg-success text-white text-center">
            <p className="font-semibold">#22C55E</p>
            <p className="text-xs">Success</p>
          </div>
          <div className="p-lg rounded-sm bg-warning text-white text-center">
            <p className="font-semibold">#F97316</p>
            <p className="text-xs">Warning</p>
          </div>
          <div className="p-lg rounded-sm bg-error text-white text-center">
            <p className="font-semibold">#DC2626</p>
            <p className="text-xs">Error</p>
          </div>
          <div className="p-lg rounded-sm bg-beige border border-border-light text-center">
            <p className="font-semibold text-charcoal">#F5F4EF</p>
            <p className="text-xs text-secondary">Beige</p>
          </div>
          <div className="p-lg rounded-sm bg-secondary text-white text-center">
            <p className="font-semibold">#9CA3AF</p>
            <p className="text-xs">Secondary</p>
          </div>
        </div>

        {/* Animation demo */}
        <div className="mt-2xl">
          <h2 className="text-2xl font-bold text-charcoal mb-lg">Animaciones</h2>
          <div className="flex gap-lg flex-wrap">
            {/* Pulse dot */}
            <div className="flex flex-col items-center gap-md">
              <div className="w-3xl h-3xl rounded-full bg-success animate-pulse"></div>
              <p className="text-sm text-secondary">Pulse</p>
            </div>

            {/* Pulse scale */}
            <div className="flex flex-col items-center gap-md">
              <div className="live-dot"></div>
              <p className="text-sm text-secondary">Pulse Scale</p>
            </div>

            {/* Spinning dot */}
            <div className="flex flex-col items-center gap-md">
              <div className="w-3xl h-3xl border-4 border-charcoal border-t-success rounded-full animate-spin-slow"></div>
              <p className="text-sm text-secondary">Spin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
