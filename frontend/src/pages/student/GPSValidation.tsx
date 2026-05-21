import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IconMapPin, IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { apiClient, type SessionInfo } from '@/lib/api';

// Fix Leaflet default marker icons broken by Vite's asset bundling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const teacherIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Child component that updates map view when coords change
function MapUpdater({
  studentCoords,
  teacherCoords,
}: {
  studentCoords: { lat: number; lng: number } | null;
  teacherCoords: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (studentCoords && teacherCoords) {
      map.fitBounds(
        [
          [studentCoords.lat, studentCoords.lng],
          [teacherCoords.lat, teacherCoords.lng],
        ],
        { padding: [40, 40], maxZoom: 19 },
      );
    } else if (teacherCoords) {
      map.setView([teacherCoords.lat, teacherCoords.lng], 18);
    }
  }, [map, studentCoords, teacherCoords]);
  return null;
}

type GpsState = 'idle' | 'loading' | 'submitting' | 'denied';

export function GPSValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = (location.state as { token?: string } | null)?.token ?? '';

  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [studentCoords, setStudentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Fetch teacher's geofence center to show on map
  useEffect(() => {
    if (!token || token === 'MOCK_TOKEN_DEV_2026') return;
    apiClient.getSessionInfo(token).then(setSessionInfo).catch(() => {/* ignore — map simply won't show teacher marker */});
  }, [token]);

  const teacherCoords =
    sessionInfo?.lat_docente != null && sessionInfo?.lng_docente != null
      ? { lat: sessionInfo.lat_docente, lng: sessionInfo.lng_docente }
      : null;

  // Default map center: teacher location or ITM campus
  const mapCenter: [number, number] = teacherCoords
    ? [teacherCoords.lat, teacherCoords.lng]
    : [19.7059, -101.1946];

  const handleConfirm = () => {
    if (gpsState === 'loading' || gpsState === 'submitting') return;

    if (!navigator.geolocation) {
      setGpsState('denied');
      return;
    }

    setGpsState('loading');
    setApiError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setStudentCoords({ lat, lng });
        setGpsState('submitting');
        try {
          const data = await apiClient.attend(token, lat, lng);
          navigate('/student/success', { state: data });
        } catch (err: unknown) {
          const axErr = err as { response?: { data?: { detail?: string } } };
          setApiError(axErr.response?.data?.detail ?? 'No se pudo registrar la asistencia.');
          setGpsState('idle');
        }
      },
      () => {
        setGpsState('denied');
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const showMap = teacherCoords !== null;

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-2 shrink-0">
        <button
          onClick={() => navigate('/student/scanner')}
          className="p-1 bg-transparent border-none cursor-pointer transition-colors shrink-0"
          style={{ color: '#6B7280' }}
        >
          <IconArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2A' }}>
          Verificar ubicación
        </span>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-10 pt-2 overflow-y-auto">
        {/* Icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 18,
              backgroundColor: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <IconMapPin size={32} style={{ color: '#3B82F6' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', marginBottom: 4 }}>
            ¿Estás en el aula?
          </div>
          {sessionInfo && (
            <div style={{ fontSize: 13, color: '#5A5A56' }}>
              {sessionInfo.materia} · Grupo {sessionInfo.grupo} · {sessionInfo.aula}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#9A9A94', marginTop: 4, lineHeight: 1.5 }}>
            Tu posición debe estar a menos de {sessionInfo?.radio_metros ?? 50} m del docente.
          </div>
        </div>

        {/* Leaflet map — shows after teacher coords are available */}
        {showMap && (
          <div
            style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid #DBEAFE',
              marginBottom: 16,
              height: 260,
              flexShrink: 0,
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={18}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {/* Teacher/aula marker (green) */}
              <Marker position={[teacherCoords.lat, teacherCoords.lng]} icon={teacherIcon}>
                <Popup>Ubicación de la clase</Popup>
              </Marker>

              {/* Geofence circle */}
              <Circle
                center={[teacherCoords.lat, teacherCoords.lng]}
                radius={sessionInfo?.radio_metros ?? 50}
                pathOptions={{ color: '#16A34A', fillColor: '#22C55E', fillOpacity: 0.15, weight: 2 }}
              />

              {/* Student marker (blue — default) */}
              {studentCoords && (
                <Marker position={[studentCoords.lat, studentCoords.lng]}>
                  <Popup>Tu ubicación</Popup>
                </Marker>
              )}

              <MapUpdater studentCoords={studentCoords} teacherCoords={teacherCoords} />
            </MapContainer>
          </div>
        )}

        {/* GPS status chips */}
        {gpsState === 'loading' && (
          <div
            style={{
              backgroundColor: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}
          >
            <div
              className="animate-spin-slow"
              style={{
                width: 16, height: 16, flexShrink: 0,
                border: '2.5px solid #FED7AA', borderTopColor: '#F97316', borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9A3412' }}>
              Obteniendo ubicación...
            </span>
          </div>
        )}

        {gpsState === 'submitting' && studentCoords && (
          <div
            style={{
              backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#22C55E', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Ubicación obtenida ✓</div>
              <div style={{ fontSize: 11, color: '#22C55E', marginTop: 1 }}>
                {`${studentCoords.lat.toFixed(6)}, ${studentCoords.lng.toFixed(6)}`}
              </div>
            </div>
          </div>
        )}

        {gpsState === 'denied' && (
          <div
            style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16,
            }}
          >
            <IconAlertCircle size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>
                Permiso de ubicación denegado
              </div>
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2, lineHeight: 1.5 }}>
                Activa la ubicación en la configuración del navegador e intenta de nuevo.
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <div
            style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>
              {apiError}
            </div>
            <button
              onClick={() => navigate('/student/scanner')}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #FECACA', backgroundColor: 'white',
                color: '#DC2626', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleConfirm}
            disabled={gpsState === 'loading' || gpsState === 'submitting' || gpsState === 'denied'}
            style={{
              padding: '15px', borderRadius: 12, border: 'none',
              backgroundColor: gpsState === 'idle' ? '#2C2C2A' : '#D1D5DB',
              color: 'white', fontSize: 15, fontWeight: 700,
              cursor: gpsState === 'idle' ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background-color 0.2s',
            }}
          >
            {gpsState === 'loading' ? (
              <>
                <div
                  className="animate-spin-slow"
                  style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
                Obteniendo ubicación…
              </>
            ) : gpsState === 'submitting' ? (
              <>
                <div
                  className="animate-spin-slow"
                  style={{ width: 17, height: 17, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
                Verificando…
              </>
            ) : (
              <>
                <IconMapPin size={16} />
                Confirmar asistencia
              </>
            )}
          </button>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
            🔒 Tu ubicación solo se usa para verificar presencia<br />
            y no se almacena (LFPDPPP).
          </p>
        </div>
      </div>
    </div>
  );
}
