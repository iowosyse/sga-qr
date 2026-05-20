import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Html5Qrcode } from 'html5-qrcode';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';

const READER_ID = 'qr-camera-feed';

export function Scanner() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qr = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = qr;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        qr.stop()
          .catch(() => {})
          .finally(() => {
            navigate('/student/gps', { state: { token: decodedText } });
          });
      },
      () => {}
    ).catch(() => {
      setError(
        'No se pudo acceder a la cámara. Por favor verifica que hayas dado permiso al navegador.'
      );
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: '#1A1A18', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        #${READER_ID} { position: absolute; inset: 0; }
        #${READER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${READER_ID}__scan_region {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
          border: none !important;
        }
        #${READER_ID}__dashboard { display: none !important; }
        #${READER_ID} img { display: none !important; }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ padding: '12px 20px 14px' }}
      >
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            display: 'flex',
            padding: 4,
          }}
        >
          <IconArrowLeft size={22} />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Escanear QR</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            Coloca el QR del profesor frente a la cámara
          </div>
        </div>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <IconAlertTriangle size={48} style={{ color: '#EF4444' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 8,
                padding: '10px 24px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'white',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* html5-qrcode container */}
            <div id={READER_ID} className="absolute inset-0" />

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 55% at 50% 44%, transparent 38%, rgba(0,0,0,0.80) 68%)',
              }}
            />

            {/* Scan frame */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ paddingBottom: '12%' }}
            >
              <div className="relative" style={{ width: 220, height: 220 }}>
                {/* Corners */}
                {[
                  {
                    top: 0,
                    left: 0,
                    borderTop: '2.5px solid white',
                    borderLeft: '2.5px solid white',
                    borderRadius: '3px 0 0 0',
                  },
                  {
                    top: 0,
                    right: 0,
                    borderTop: '2.5px solid white',
                    borderRight: '2.5px solid white',
                    borderRadius: '0 3px 0 0',
                  },
                  {
                    bottom: 0,
                    left: 0,
                    borderBottom: '2.5px solid white',
                    borderLeft: '2.5px solid white',
                    borderRadius: '0 0 0 3px',
                  },
                  {
                    bottom: 0,
                    right: 0,
                    borderBottom: '2.5px solid white',
                    borderRight: '2.5px solid white',
                    borderRadius: '0 0 3px 0',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{ position: 'absolute', width: 28, height: 28, ...s }}
                  />
                ))}

                {/* Scanline */}
                <div
                  className="animate-scanline"
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    height: 2,
                    borderRadius: 2,
                    background:
                      'linear-gradient(to right, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.9) 70%, transparent)',
                    boxShadow: '0 0 8px 2px rgba(255,255,255,0.35)',
                  }}
                />
              </div>
            </div>

            {/* Instruction */}
            <div
              className="absolute"
              style={{ bottom: 96, left: 0, right: 0, textAlign: 'center' }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Coloca el código QR dentro del recuadro
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                El escaneo es automático
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{ gap: 10, padding: '16px 24px 36px' }}
      >
        <button
          onClick={() =>
            navigate('/student/gps', { state: { token: 'MOCK_TOKEN_DEV_2026' } })
          }
          style={{
            padding: '14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Simular escaneo (dev)
        </button>
        <button
          style={{
            padding: '12px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <IconAlertTriangle size={14} />
          Reportar incidencia
        </button>
      </div>
    </div>
  );
}
