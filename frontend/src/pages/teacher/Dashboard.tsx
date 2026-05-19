import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NavRail } from '@/components/NavRail';
import { TopBar } from '@/components/TopBar';
import { AttendanceCalendar } from '@/components/AttendanceCalendar';

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('Programación Web');

  const subjects = [
    {
      id: '1',
      name: 'Programación Web',
      group: '7A-TIC',
      nextClass: '07:00 - 08:30',
    },
    {
      id: '2',
      name: 'Bases de Datos',
      group: '8B-TIC',
      nextClass: '09:00 - 10:30',
    },
    {
      id: '3',
      name: 'Ingeniería de Software',
      group: '9C-TIC',
      nextClass: '11:00 - 12:30',
    },
  ];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // May 2026: starts on Friday. Weekdays only (Mon–Fri); no Sat/Sun entries.
  const attendanceData = [
    { date: 1,  percentage: 95 }, // Fri
    { date: 4,  percentage: 75 }, // Mon
    { date: 5,  percentage: 90 }, // Tue
    { date: 6,  percentage: 88 }, // Wed
    { date: 7,  percentage: 92 }, // Thu
    { date: 8,  percentage: 87 }, // Fri
    { date: 11, percentage: 80 }, // Mon
    { date: 12, percentage: 93 }, // Tue
    { date: 13, percentage: 86 }, // Wed
    { date: 14, percentage: 91 }, // Thu
    { date: 15, percentage: 89 }, // Fri
    { date: 18, percentage: 94 }, // Mon
  ];

  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName="MATI. Villaseñor Béjar" userRole="Docente · Depto. ISC" />

        <div className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 p-6 space-y-6">
            {/* Subject selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-charcoal">Materia:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 rounded-sm border border-border-light bg-white text-charcoal text-sm font-medium focus:outline-none focus:ring-2 focus:ring-charcoal/10"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar and action */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AttendanceCalendar month={currentMonth} year={currentYear} data={attendanceData} />
              </div>

              <div className="flex flex-col gap-4 justify-start">
                <button
                  onClick={() => navigate('/teacher/session')}
                  className="w-full font-semibold transition-opacity shadow-md"
                  style={{
                    backgroundColor: '#2C2C2A',
                    color: '#ffffff',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Iniciar pase de lista
                </button>

                <div className="bg-white border border-border-subtle rounded-lg p-4">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Próxima clase</p>
                  {subjects.find((s) => s.name === selectedSubject) && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-charcoal">{selectedSubject}</p>
                      <p className="text-xs text-secondary">
                        {subjects.find((s) => s.name === selectedSubject)?.nextClass}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
