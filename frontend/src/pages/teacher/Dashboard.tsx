import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { NavRail } from '@/components/NavRail';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';
import { AttendanceCalendar } from '@/components/AttendanceCalendar';
import { apiClient, type TodayClass } from '@/lib/api';

const DEBUG_ALL = import.meta.env.VITE_DEBUG_ALL_CLASSES === 'true';

export function Dashboard() {
  const navigate = useNavigate();
  const nombre = localStorage.getItem('nombre') ?? 'Docente';

  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [geoLoadingId, setGeoLoadingId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const attendanceData = [
    { date: 1,  percentage: 95 },
    { date: 4,  percentage: 75 },
    { date: 5,  percentage: 90 },
    { date: 6,  percentage: 88 },
    { date: 7,  percentage: 92 },
    { date: 8,  percentage: 87 },
    { date: 11, percentage: 80 },
    { date: 12, percentage: 93 },
    { date: 13, percentage: 86 },
    { date: 14, percentage: 91 },
    { date: 15, percentage: 89 },
    { date: 18, percentage: 94 },
  ];

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoadingClasses(true);
    apiClient
      .getClassesToday(DEBUG_ALL)
      .then(setClasses)
      .catch(() => setClassesError('No se pudieron cargar las clases.'))
      .finally(() => setLoadingClasses(false));
  }, []);

  const handleStartSession = (cls: TodayClass) => {
    if (!navigator.geolocation) {
      setStartError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoadingId(cls.horario_id);
    setStartError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const data = await apiClient.startSession(cls.horario_id, lat, lng);
          navigate('/teacher/session', {
            state: {
              session_id: data.session_id,
              token: data.token,
              materia: cls.materia,
              grupo: cls.grupo,
              aula: cls.aula,
            },
          });
        } catch (err: unknown) {
          const axErr = err as { response?: { data?: { detail?: string } } };
          setStartError(axErr.response?.data?.detail ?? 'No se pudo iniciar la sesión.');
        } finally {
          setGeoLoadingId(null);
        }
      },
      () => {
        setStartError('Debes permitir el acceso a tu ubicación para iniciar el pase de lista.');
        setGeoLoadingId(null);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="flex h-screen bg-bg-app">
      {/* Desktop sidebar */}
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar userName={nombre} userRole="Docente · Depto. ISC" />

        {/* Scrollable content — add bottom padding on mobile for BottomNav */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6 pb-20 lg:pb-6">

            {/* Section title */}
            <h2 className="text-sm font-bold text-charcoal">
              Clases de hoy{DEBUG_ALL ? ' (debug)' : ''}
            </h2>

            {/* Error / loading states */}
            {loadingClasses && (
              <p className="text-sm text-secondary">Cargando clases...</p>
            )}
            {classesError && (
              <p className="text-sm text-red-600">{classesError}</p>
            )}
            {startError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {startError}
              </div>
            )}
            {!loadingClasses && !classesError && classes.length === 0 && (
              <p className="text-sm text-secondary">No tienes clases programadas para hoy.</p>
            )}

            {/* Class cards */}
            <div className="space-y-3">
              {classes.map((cls) => {
                const isLoading = geoLoadingId === cls.horario_id;
                const hasActive = cls.sesion_activa_id !== null;
                return (
                  <div
                    key={cls.horario_id}
                    className="flex items-center justify-between bg-white border border-border-subtle rounded-lg px-4 py-3 gap-3"
                    style={{ minHeight: 64 }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">{cls.materia}</p>
                      <p className="text-xs text-secondary mt-0.5">
                        Grupo {cls.grupo} · {cls.aula} · {cls.hora_inicio}–{cls.hora_fin}
                      </p>
                    </div>
                    {hasActive ? (
                      /* Laptop joins an already-running session started from mobile */
                      <button
                        onClick={() =>
                          navigate('/teacher/session', {
                            state: {
                              session_id: cls.sesion_activa_id,
                              token: '',        // will be fetched on mount
                              materia: cls.materia,
                              grupo: cls.grupo,
                              aula: cls.aula,
                            },
                          })
                        }
                        className="shrink-0 px-4 rounded-lg text-xs font-bold text-white transition-opacity"
                        style={{ backgroundColor: '#2E7D32', minHeight: 44, whiteSpace: 'nowrap' }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Ver pase activo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartSession(cls)}
                        disabled={isLoading || geoLoadingId !== null}
                        className="shrink-0 px-4 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: '#2C2C2A', minHeight: 44, whiteSpace: 'nowrap' }}
                        onMouseOver={(e) => !isLoading && (e.currentTarget.style.opacity = '0.85')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        {isLoading ? 'Obteniendo ubicación...' : 'Iniciar pase de lista'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Attendance calendar — full width on mobile */}
            <div>
              <AttendanceCalendar month={currentMonth} year={currentYear} data={attendanceData} />
            </div>

          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
