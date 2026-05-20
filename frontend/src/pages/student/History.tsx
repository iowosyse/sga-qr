import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';

type AttendanceStatus = 'presente' | 'ausente' | 'justificado';

interface AttendanceRecord {
  id: number;
  date: string;
  materia: string;
  grupo: string;
  aula: string;
  estado: AttendanceStatus;
}

const MOCK_DATA: AttendanceRecord[] = [
  { id: 1,  date: '2026-05-20', materia: 'Programación Web',        grupo: '7A-TIC', aula: 'E-204', estado: 'presente' },
  { id: 2,  date: '2026-05-19', materia: 'Bases de Datos',          grupo: '7B-TIC', aula: 'D-102', estado: 'ausente' },
  { id: 3,  date: '2026-05-18', materia: 'Ingeniería de Software',   grupo: '7A-TIC', aula: 'E-205', estado: 'presente' },
  { id: 4,  date: '2026-05-17', materia: 'Programación Web',        grupo: '7A-TIC', aula: 'E-204', estado: 'presente' },
  { id: 5,  date: '2026-05-16', materia: 'Redes de Computadoras',   grupo: '7C-TIC', aula: 'C-301', estado: 'justificado' },
  { id: 6,  date: '2026-05-15', materia: 'Bases de Datos',          grupo: '7B-TIC', aula: 'D-102', estado: 'presente' },
  { id: 7,  date: '2026-05-14', materia: 'Ingeniería de Software',   grupo: '7A-TIC', aula: 'E-205', estado: 'presente' },
  { id: 8,  date: '2026-05-13', materia: 'Programación Web',        grupo: '7A-TIC', aula: 'E-204', estado: 'ausente' },
  { id: 9,  date: '2026-05-12', materia: 'Redes de Computadoras',   grupo: '7C-TIC', aula: 'C-301', estado: 'presente' },
  { id: 10, date: '2026-05-11', materia: 'Bases de Datos',          grupo: '7B-TIC', aula: 'D-102', estado: 'justificado' },
];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string; dot: string }> = {
  presente:    { label: 'Presente',    bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  ausente:     { label: 'Ausente',     bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  justificado: { label: 'Justificado', bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' },
};

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function History() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_DATA;
    const q = query.toLowerCase();
    return MOCK_DATA.filter(
      (r) =>
        r.materia.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.grupo.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div
      className="min-h-screen flex flex-col max-w-sm mx-auto"
      style={{ backgroundColor: '#F5F4EF', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '14px 20px 12px',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/student/scanner')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              display: 'flex',
              padding: 4,
            }}
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2A' }}>
              Historial de asistencias
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              {MOCK_DATA.length} registros · Mayo 2026
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <IconSearch
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por materia, grupo o fecha…"
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: 10,
              border: '1.5px solid #E5E7EB',
              fontSize: 13,
              color: '#2C2C2A',
              backgroundColor: '#F9FAFB',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Summary chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px 8px',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {(['presente', 'ausente', 'justificado'] as AttendanceStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = MOCK_DATA.filter((r) => r.estado === s).length;
          return (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                backgroundColor: cfg.bg,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: cfg.dot,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.text }}>
                {count} {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#9CA3AF',
              fontSize: 13,
            }}
          >
            No se encontraron registros.
          </div>
        ) : (
          filtered.map((record) => {
            const cfg = STATUS_CONFIG[record.estado];
            return (
              <div
                key={record.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#2C2C2A',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {record.materia}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                    {record.grupo} · {record.aula}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {formatDate(record.date)}
                  </div>
                </div>

                {/* Right: badge */}
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    backgroundColor: cfg.bg,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: cfg.dot,
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 600, color: cfg.text }}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
