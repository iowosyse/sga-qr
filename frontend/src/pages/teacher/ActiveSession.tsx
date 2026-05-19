import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NavRail } from '@/components/NavRail';
import { TopBar } from '@/components/TopBar';
import { QRDisplay } from '@/components/QRDisplay';
import { StudentRow } from '@/components/StudentRow';
import { LiveBadge } from '@/components/LiveBadge';

type Status = 'present' | 'pending' | 'manual' | 'absent';

interface Student {
  id: string;
  name: string;
  status: Status;
}

const INITIAL_STUDENTS: Student[] = [
  { id: '21M0001', name: 'García Pérez, Ana Isabel',      status: 'present' },
  { id: '21M0002', name: 'López Martínez, Carlos E.',     status: 'pending' },
  { id: '21M0003', name: 'Ramírez Torres, Diana L.',      status: 'present' },
  { id: '21M0004', name: 'Hernández Cruz, Eduardo',       status: 'manual'  },
  { id: '21M0005', name: 'González Vega, Fernanda',       status: 'present' },
  { id: '21M0006', name: 'Martínez Ruiz, Gabriel A.',     status: 'pending' },
  { id: '21M0007', name: 'Sánchez Morales, Hilda',        status: 'present' },
  { id: '21M0008', name: 'Pérez Jiménez, Iván R.',        status: 'present' },
  { id: '21M0009', name: 'Torres Flores, Jacqueline',     status: 'manual'  },
  { id: '21M0010', name: 'Vargas Luna, Kevin M.',         status: 'present' },
  { id: '21M0011', name: 'Reyes Castillo, Laura P.',      status: 'pending' },
  { id: '21M0012', name: 'Mendoza Rivera, Marco A.',      status: 'present' },
];
// 7 present · 3 pending · 2 manual · 12 total

const generateQRValue = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase() +
  Math.random().toString(36).substring(2, 10).toUpperCase();

export function ActiveSession() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [qrValue, setQrValue] = useState(generateQRValue);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const presentCount = students.filter((s) => s.status === 'present').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const manualCount  = students.filter((s) => s.status === 'manual').length;
  const total = students.length;

  const handleRefreshQR = () => setQrValue(generateQRValue());

  const handleStatusChange = (id: string, status: Status) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    setOpenDropdownId(null);
  };

  const toggleDropdown = (id: string) =>
    setOpenDropdownId((prev) => (prev === id ? null : id));

  return (
    <>
      <div
        className="flex h-screen bg-bg-app"
        onClick={() => setOpenDropdownId(null)}
      >
        <NavRail />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar userName="MATI. Villaseñor Béjar" userRole="Docente · Depto. ISC" />

          <div className="flex-1 flex overflow-hidden p-5 gap-5">
            {/* Left panel — QR */}
            <div onClick={(e) => e.stopPropagation()}>
              <QRDisplay
                subject="Programación Web"
                group="7A-TIC"
                classroom="E-204"
                secret={qrValue}
                onRefresh={handleRefreshQR}
                onClose={() => setShowConfirm(true)}
              />
            </div>

            {/* Right panel — Monitor */}
            <div
              className="flex-1 flex flex-col gap-3.5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-charcoal">Monitor de Asistencia</h2>
                  <p className="text-xs text-secondary mt-0.5">
                    Programación Web · Grupo 7A-TIC · En tiempo real
                  </p>
                </div>
                <LiveBadge />
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#F0FDF4] border border-border-subtle rounded-xs p-3.5">
                  <div className="text-[10px] text-secondary font-semibold uppercase mb-1">Presentes</div>
                  <div className="text-2xl font-bold text-success">{presentCount}</div>
                </div>
                <div className="bg-[#FFF7ED] border border-border-subtle rounded-xs p-3.5">
                  <div className="text-[10px] text-secondary font-semibold uppercase mb-1">Pendientes</div>
                  <div className="text-2xl font-bold text-warning">{pendingCount}</div>
                </div>
                <div className="bg-[#F9FAFB] border border-border-subtle rounded-xs p-3.5">
                  <div className="text-[10px] text-secondary font-semibold uppercase mb-1">Manual</div>
                  <div className="text-2xl font-bold text-secondary">{manualCount}</div>
                </div>
                <div className="bg-white border border-border-subtle rounded-xs p-3.5">
                  <div className="text-[10px] text-secondary font-semibold uppercase mb-1">Total</div>
                  <div className="text-2xl font-bold text-charcoal">{total}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-white border border-border-subtle rounded-xs p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-secondary">Progreso de la sesión</span>
                  <span className="text-xs font-semibold text-charcoal">
                    {Math.round((presentCount / total) * 100)}% completado
                  </span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-xs overflow-hidden flex">
                  <div
                    style={{ width: `${(presentCount / total) * 100}%` }}
                    className="bg-success transition-all duration-300"
                  />
                  <div
                    style={{ width: `${(manualCount / total) * 100}%` }}
                    className="bg-warning"
                  />
                </div>
              </div>

              {/* Student list */}
              <div className="flex-1 bg-white border border-border-subtle rounded-lg overflow-hidden flex flex-col">
                <div className="grid grid-cols-[1fr_110px_100px_40px] gap-3 px-4 py-2.5 bg-[#FAFAFA] border-b border-border-subtle font-bold text-[10px] text-secondary uppercase tracking-wider shrink-0">
                  <span>Nombre</span>
                  <span>Matrícula</span>
                  <span>Estado</span>
                  <span />
                </div>

                <div className="flex-1 overflow-y-auto">
                  {students.map((student, idx) => (
                    <StudentRow
                      key={student.id}
                      controlNumber={student.id}
                      name={student.name}
                      status={student.status}
                      alternateBackground={idx % 2 === 1}
                      isDropdownOpen={openDropdownId === student.id}
                      onEdit={() => toggleDropdown(student.id)}
                      onStatusChange={(status) => handleStatusChange(student.id, status)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm close dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-charcoal mb-2">¿Cerrar la clase?</h3>
            <p className="text-sm text-secondary mb-5">
              Se terminará la sesión activa. Los registros de asistencia ya guardados se conservan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xs border border-border-light text-sm font-semibold text-charcoal hover:bg-bg-subtle transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => navigate('/teacher/dashboard')}
                style={{ backgroundColor: '#DC2626', color: '#fff', borderRadius: '6px' }}
                className="px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                Cerrar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
