import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';
import React, { Suspense } from 'react';
import { useDevicePermissions } from '@/hooks/useDevicePermissions';
import { PermissionDeniedAlert } from '@/components/PermissionDeniedAlert';

const DevMockPanel = import.meta.env.DEV 
  ? React.lazy(() => import('@/components/dev/MockPanel')) 
  : () => null;

// BarcodeDetector is not in the TS standard lib yet.
// eslint-disable-next-line no-var
declare var BarcodeDetector: any;

export function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { cameraStatus, geolocationStatus } = useDevicePermissions();

  const stopAll = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const onDetected = (value: string) => {
    if (detectedRef.current) return;
    detectedRef.current = true;
    stopAll();
    navigate('/student/gps', { state: { token: value } });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1 — Request camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch {
        if (!cancelled) setError('No se pudo acceder a la cámara. Verifica que hayas dado permiso al navegador.');
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach((t) => t.stop()); return; }

      video.srcObject = stream;
      try { await video.play(); } catch { /* autoplay already started */ }

      // 2 — Choose scan backend
      const hasBarcodeDetector =
        typeof BarcodeDetector !== 'undefined' &&
        (await BarcodeDetector.getSupportedFormats().catch(() => []))
          .includes('qr_code');

      const detector = hasBarcodeDetector ? new BarcodeDetector({ formats: ['qr_code'] }) : null;

      // Lazy-load jsQR only when BarcodeDetector is unavailable (Safari / Firefox)
      let jsQR: ((data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) | null = null;
      if (!detector) {
        const mod = await import('jsqr').catch(() => null);
        jsQR = mod ? (mod.default ?? mod) as typeof jsQR : null;
        if (!jsQR && !cancelled) {
          setError('No se pudo cargar el lector QR. Intenta recargar la página.');
          stopAll();
          return;
        }
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 3 — Scan loop every 500ms
      intervalRef.current = setInterval(async () => {
        if (cancelled || detectedRef.current) return;
        if (video.readyState < video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width === 0 || canvas.height === 0) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          if (detector) {
            const results: Array<{ rawValue: string }> = await detector.detect(canvas);
            if (results.length > 0) onDetected(results[0].rawValue);
          } else if (jsQR) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code) onDetected(code.data);
          }
        } catch {
          // per-frame errors are normal when no QR is visible
        }
      }, 500);
    })();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: '#1A1A18', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '12px 20px 14px' }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', display: 'flex', padding: 4,
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
      <div className="flex-1 relative" style={{ background: '#000', minHeight: '60vh' }}>
        <div className="absolute top-0 left-0 right-0 z-50 p-4">
          <PermissionDeniedAlert status={cameraStatus} type="camera" />
          <PermissionDeniedAlert status={geolocationStatus} type="geolocation" />
        </div>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <IconAlertTriangle size={48} style={{ color: '#EF4444' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 8, padding: '10px 24px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'white', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Native video element — stream assigned directly via ref */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

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
              <div className="relative" style={{ width: 250, height: 250 }}>
                {[
                  { top: 0,    left:  0, borderTop:    '2.5px solid white', borderLeft:   '2.5px solid white', borderRadius: '3px 0 0 0' },
                  { top: 0,    right: 0, borderTop:    '2.5px solid white', borderRight:  '2.5px solid white', borderRadius: '0 3px 0 0' },
                  { bottom: 0, left:  0, borderBottom: '2.5px solid white', borderLeft:   '2.5px solid white', borderRadius: '0 0 0 3px' },
                  { bottom: 0, right: 0, borderBottom: '2.5px solid white', borderRight:  '2.5px solid white', borderRadius: '0 0 3px 0' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
                ))}
                <div
                  className="animate-scanline"
                  style={{
                    position: 'absolute', left: 4, right: 4, height: 2, borderRadius: 2,
                    background:
                      'linear-gradient(to right, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.9) 70%, transparent)',
                    boxShadow: '0 0 8px 2px rgba(255,255,255,0.35)',
                  }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute" style={{ bottom: 96, left: 0, right: 0, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 4 }}>
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
      <div className="flex flex-col shrink-0" style={{ gap: 10, padding: '16px 24px 36px' }}>
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <DevMockPanel onSimulateQR={(token) => navigate('/student/gps', { state: { token } })} />
          </Suspense>
        )}
        <button
          style={{
            padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <IconAlertTriangle size={14} />
          Reportar incidencia
        </button>
      </div>
    </div>
  );
}
