import { useState } from 'react';
import { Search } from 'lucide-react';
import { NavRail } from '@/components/NavRail';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';

interface Student {
  controlNumber: string;
  name: string;
  career: string;
  semester: number;
  attendance: number;
}

const RAW_STUDENTS: Student[] = [
  { controlNumber: '23M00001', name: 'Aguilar Reyes, Sofía Valentina',      career: 'ISC', semester: 6, attendance: 92 },
  { controlNumber: '23M00002', name: 'Bautista Herrera, Diego Alejandro',   career: 'TIC', semester: 6, attendance: 78 },
  { controlNumber: '23M00003', name: 'Castillo Mendoza, Valeria Isabel',    career: 'ISC', semester: 6, attendance: 61 },
  { controlNumber: '23M00004', name: 'Domínguez Vargas, Rodrigo Emilio',    career: 'IA',  semester: 6, attendance: 88 },
  { controlNumber: '23M00005', name: 'Espinoza Cruz, Fernanda Lucía',       career: 'TIC', semester: 6, attendance: 74 },
  { controlNumber: '23M00006', name: 'Flores Ortega, Óscar Manuel',         career: 'ISC', semester: 6, attendance: 55 },
  { controlNumber: '23M00007', name: 'García Salinas, Ximena Paola',        career: 'IA',  semester: 6, attendance: 95 },
  { controlNumber: '23M00008', name: 'Gutiérrez Luna, Andrés Felipe',       career: 'TIC', semester: 6, attendance: 83 },
  { controlNumber: '23M00009', name: 'Hernández Rojas, Camila Beatriz',     career: 'ISC', semester: 6, attendance: 67 },
  { controlNumber: '23M00010', name: 'Jiménez Peña, Luis Enrique',          career: 'IA',  semester: 6, attendance: 91 },
  { controlNumber: '23M00011', name: 'López Cervantes, Mariana Estefanía',  career: 'TIC', semester: 6, attendance: 72 },
  { controlNumber: '23M00012', name: 'Martínez Soto, Héctor Iván',          career: 'ISC', semester: 6, attendance: 48 },
  { controlNumber: '23M00013', name: 'Morales Jiménez, Diana Patricia',     career: 'IA',  semester: 6, attendance: 87 },
  { controlNumber: '23M00014', name: 'Navarro Ibáñez, Sebastián Omar',      career: 'TIC', semester: 6, attendance: 76 },
  { controlNumber: '23M00015', name: 'Ortiz Ramírez, Gabriela Susana',      career: 'ISC', semester: 6, attendance: 93 },
  { controlNumber: '23M00016', name: 'Pacheco Torres, Kevin Josué',         career: 'IA',  semester: 6, attendance: 63 },
  { controlNumber: '23M00017', name: 'Quiroz Medina, Natalia Renata',       career: 'TIC', semester: 6, attendance: 89 },
  { controlNumber: '23M00018', name: 'Ramos Delgado, Miguel Ángel',         career: 'ISC', semester: 6, attendance: 70 },
  { controlNumber: '23M00019', name: 'Sánchez Villanueva, Itzel Monserrat', career: 'IA',  semester: 6, attendance: 96 },
  { controlNumber: '23M00020', name: 'Torres Guzmán, Emmanuel Alexis',      career: 'TIC', semester: 6, attendance: 58 },
];

// Orden alfabético por apellido (el nombre completo ya está en formato "Apellido, Nombre")
const STUDENTS = [...RAW_STUDENTS].sort((a, b) =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
);

const COLS = '40px 130px 1fr 70px 80px 120px 100px';

function getAttendanceBadge(pct: number): { bg: string; color: string } {
  if (pct > 85)  return { bg: '#F0FDF4', color: '#16A34A' };
  if (pct >= 70) return { bg: '#FFF7ED', color: '#C2410C' };
  return           { bg: '#FEF2F2', color: '#DC2626' };
}

function getStatus(pct: number): { label: string; color: string } {
  if (pct > 85)  return { label: 'Regular',    color: '#16A34A' };
  if (pct >= 70) return { label: 'En riesgo',  color: '#C2410C' };
  return           { label: 'Crítico',  color: '#DC2626' };
}

export function Students() {
  const [query, setQuery] = useState('');

  const filtered = STUDENTS.filter((s) => {
    const q = query.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.controlNumber.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName="MATI. Villaseñor Béjar" userRole="Docente · Depto. ISC" />

        {/* Content: fixed header area + scrollable table, never overflows the screen */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 pb-20 lg:pb-6 gap-5">

          {/* Page header — fixed height */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>Alumnos</h1>
              <p className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>
                Mostrando {filtered.length} de {STUDENTS.length} alumnos
              </p>
            </div>

            <div className="relative w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9A9A94' }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o No. Control…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border text-sm focus:outline-none"
                style={{ borderColor: '#E5E4DF', backgroundColor: '#FFFFFF', color: '#1A1A18' }}
              />
            </div>
          </div>

          {/* Table — takes remaining height; rows scroll independently */}
          <div
            className="flex-1 flex flex-col overflow-hidden rounded-lg border"
            style={{ borderColor: '#E5E4DF', backgroundColor: '#FFFFFF' }}
          >
            {/* Sticky header */}
            <div
              className="grid gap-3 px-4 py-2.5 border-b shrink-0 font-bold text-[10px] uppercase tracking-wider"
              style={{
                gridTemplateColumns: COLS,
                backgroundColor: '#FAFAFA',
                borderColor: '#E5E4DF',
                color: '#9A9A94',
              }}
            >
              <span>N° Lista</span>
              <span>No. Control</span>
              <span>Nombre</span>
              <span>Carrera</span>
              <span>Semestre</span>
              <span>% Asistencia</span>
              <span>Estado</span>
            </div>

            {/* Scrollable rows */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: '#9A9A94' }}>
                  Sin resultados para "{query}"
                </div>
              ) : (
                filtered.map((student, idx) => {
                  const badge  = getAttendanceBadge(student.attendance);
                  const status = getStatus(student.attendance);

                  return (
                    <div
                      key={student.controlNumber}
                      className="grid gap-3 px-4 py-3 border-b last:border-b-0 items-center transition-colors hover:bg-[#F9F8F3]"
                      style={{
                        gridTemplateColumns: COLS,
                        borderColor: '#E5E4DF',
                        backgroundColor: idx % 2 === 1 ? '#FAFAF8' : '#FFFFFF',
                      }}
                    >
                      <span className="text-xs font-mono text-center" style={{ color: '#9A9A94' }}>
                        {idx + 1}
                      </span>

                      <span className="text-xs font-mono" style={{ color: '#5A5A56' }}>
                        {student.controlNumber}
                      </span>

                      <span className="text-xs font-medium truncate" style={{ color: '#1A1A18' }}>
                        {student.name}
                      </span>

                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                        style={{ backgroundColor: '#EEEDE8', color: '#5A5A56' }}
                      >
                        {student.career}
                      </span>

                      <span className="text-xs" style={{ color: '#5A5A56' }}>
                        {student.semester}°
                      </span>

                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full w-fit"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {student.attendance}%
                      </span>

                      <span className="text-xs font-semibold" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
