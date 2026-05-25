import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface DayData {
  porcentaje: number;
  presentes: number;
  total: number;
  sesion_id: number;
}

interface AttendanceCalendarProps {
  grupoId: number | null;
}

export function AttendanceCalendar({ grupoId }: AttendanceCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [sessionMap, setSessionMap] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch sessions cuando viewDate o grupoId cambian
  useEffect(() => {
    if (!grupoId) {
      setSessionMap(new Map());
      return;
    }

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const sessions = await apiClient.getSessionsReport(grupoId);
        const sessionsArray = Array.isArray(sessions) ? sessions : sessions.sesiones ?? [];

        const map = new Map<string, DayData>();
        sessionsArray.forEach((session: any) => {
          const key = session.fecha; // Assume already formatted as "YYYY-MM-DD"
          map.set(key, {
            porcentaje: Math.round(session.porcentaje ?? 0),
            presentes: session.presentes ?? 0,
            total: session.total_alumnos ?? 0,
            sesion_id: session.id,
          });
        });
        setSessionMap(map);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setSessionMap(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [grupoId]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Calcula el primer día visible en la grid (Lunes = 0)
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // Convert Sun=0 to Mon=0
  const gridStart = new Date(firstDay);
  gridStart.setDate(1 - startDow);

  // Genera todas las celdas de la grid (mínimo 4 semanas, máximo 6)
  const lastDay = new Date(year, month + 1, 0);
  const gridEnd = new Date(lastDay);
  const endDow = (lastDay.getDay() + 6) % 7;
  gridEnd.setDate(lastDay.getDate() + (6 - endDow));

  const days: Date[] = [];
  const current = new Date(gridStart);
  while (current <= gridEnd) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const todayKey = new Date().toISOString().split('T')[0];

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 85) return { bg: '#DCFCE7', text: '#16A34A' };
    if (percentage >= 70) return { bg: '#FEF9C3', text: '#CA8A04' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthName = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate);

  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="bg-white rounded-lg p-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="text-lg text-charcoal hover:bg-[#E5E4DF] rounded-md p-1 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <h3 className="text-base font-semibold text-charcoal">
          {capitalizedMonthName}
        </h3>

        <button
          onClick={handleNextMonth}
          className="text-lg text-charcoal hover:bg-[#E5E4DF] rounded-md p-1 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 border-t border-l border-[#E5E4DF]">
        {/* Headers de días */}
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName) => (
          <div
            key={dayName}
            className="text-xs uppercase font-semibold text-secondary text-center py-2 border-r border-b border-[#E5E4DF] tracking-wide"
          >
            {dayName}
          </div>
        ))}

        {/* Celdas de días */}
        {days.map((date, idx) => {
          const dateKey = formatDate(date);
          const data = sessionMap.get(dateKey);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = dateKey === todayKey;
          const dayNum = date.getDate();
          const dayColor = isCurrentMonth ? '#5A5A56' : '#C8C8C0';

          return (
            <div
              key={idx}
              className="h-24 border-r border-b border-[#E5E4DF] hover:bg-[#FAFAF8] transition-colors cursor-pointer relative flex items-center justify-center"
            >
              {/* Número del día */}
              <div className="absolute top-2 right-2">
                {isToday ? (
                  <div className="bg-[#1A1A18] text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {dayNum}
                  </div>
                ) : (
                  <div className="text-xs font-medium" style={{ color: dayColor }}>
                    {dayNum}
                  </div>
                )}
              </div>

              {/* Círculo de porcentaje (solo si hay datos) */}
              {data ? (
                <div className="flex flex-col items-center justify-center">
                  {loading && !sessionMap.size ? (
                    <div className="w-10 h-10 rounded-full bg-[#E5E4DF] animate-pulse" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex flex-col items-center justify-center"
                      style={{ backgroundColor: getPercentageColor(data.porcentaje).bg }}
                    >
                      <div
                        className="text-xs font-semibold"
                        style={{ color: getPercentageColor(data.porcentaje).text }}
                      >
                        {data.porcentaje}%
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: getPercentageColor(data.porcentaje).text }}
                      >
                        {data.presentes}/{data.total}
                      </div>
                    </div>
                  )}
                </div>
              ) : isCurrentMonth && loading ? (
                <div className="w-10 h-10 rounded-full bg-[#E5E4DF] animate-pulse" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!grupoId && (
        <div className="text-center mt-4 py-6">
          <p className="text-sm text-secondary">
            Selecciona un grupo para ver asistencias
          </p>
        </div>
      )}
    </div>
  );
}
