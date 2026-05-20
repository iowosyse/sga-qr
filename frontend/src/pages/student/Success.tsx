import { useNavigate } from 'react-router';
import { IconHistory, IconCircleCheck } from '@tabler/icons-react';

function formatDateTime(date: Date) {
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function Success() {
  const navigate = useNavigate();
  const now = new Date();

  const receipt = [
    { label: 'Materia', value: 'Programación Web' },
    { label: 'Grupo', value: '7A-TIC' },
    { label: 'Aula', value: 'E-204' },
    { label: 'Fecha y hora', value: formatDateTime(now) },
    { label: 'Estado', value: 'Presente ✓', color: '#16A34A' },
  ];

  const folio = `QR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto bg-white"
      style={{ fontFamily: "'Inter', sans-serif", padding: '24px 24px 36px' }}
    >
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-check {
          animation: fadeInScale 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .anim-title {
          animation: fadeInUp 0.35s ease-out 0.3s both;
        }
        .anim-receipt {
          animation: fadeInUp 0.35s ease-out 0.5s both;
        }
        .anim-actions {
          animation: fadeInUp 0.35s ease-out 0.65s both;
        }
      `}</style>

      {/* Checkmark */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div
          className="anim-check"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconCircleCheck size={60} style={{ color: '#16A34A' }} />
        </div>

        <div className="anim-title" style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#2C2C2A',
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}
          >
            ¡Asistencia registrada!
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
            Tu asistencia fue confirmada exitosamente.
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div
        className="anim-receipt"
        style={{
          width: '100%',
          backgroundColor: '#F9FAFB',
          borderRadius: 14,
          padding: '18px 18px 14px',
          border: '1px solid rgba(0,0,0,0.07)',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}
        >
          Comprobante de asistencia
        </div>

        {receipt.map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: i < receipt.length - 1 ? 10 : 0,
              marginBottom: i < receipt.length - 1 ? 10 : 0,
              borderBottom: i < receipt.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: color ?? '#2C2C2A' }}>
              {value}
            </span>
          </div>
        ))}

        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed rgba(0,0,0,0.1)',
          }}
        >
          <span style={{ fontSize: 10, color: '#D1D5DB', fontVariantNumeric: 'tabular-nums' }}>
            Folio: {folio}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="anim-actions" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => navigate('/student/history')}
          style={{
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            backgroundColor: '#2C2C2A',
            color: 'white',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <IconHistory size={16} />
          Ver mi historial
        </button>

        <button
          onClick={() => navigate('/student/scanner')}
          style={{
            padding: '13px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.1)',
            backgroundColor: 'transparent',
            color: '#6B7280',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Nueva sesión
        </button>
      </div>
    </div>
  );
}
