import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IconSchool, IconChartBar, IconAlertTriangle, IconAlertCircle,
  IconDownload,
} from '@tabler/icons-react';
import { NavRail } from '@/components/NavRail';
import { TopBar } from '@/components/TopBar';

// ── Data ────────────────────────────────────────────────────────────────────

const TREND_DATA = [
  { semana: 1,  pct: 92 }, { semana: 2,  pct: 90 }, { semana: 3,  pct: 91 },
  { semana: 4,  pct: 88 }, { semana: 5,  pct: 85 }, { semana: 6,  pct: 83 },
  { semana: 7,  pct: 80 }, { semana: 8,  pct: 78 }, { semana: 9,  pct: 79 },
  { semana: 10, pct: 81 }, { semana: 11, pct: 80 }, { semana: 12, pct: 82 },
  { semana: 13, pct: 83 }, { semana: 14, pct: 84 }, { semana: 15, pct: 84 },
  { semana: 16, pct: 84 },
];

const SUBJECTS = [
  { name: 'Ingeniería de Software',              group: '8A', total: 18, avg: 86 },
  { name: 'Fundamentos de Ingeniería de Software', group: '7C', total: 16, avg: 82 },
  { name: 'Taller de Investigación',              group: '9A', total: 14, avg: 78 },
];

const AT_RISK = [
  { control: '23M00006', name: 'Flores Ortega, Óscar Manuel',         subject: 'Ing. de Software',   pct: 79, absences: 4  },
  { control: '23M00009', name: 'Hernández Rojas, Camila Beatriz',     subject: 'Fund. Ing. de SW',   pct: 74, absences: 5  },
  { control: '23M00012', name: 'Martínez Soto, Héctor Iván',          subject: 'Taller de Inv.',     pct: 68, absences: 6  },
  { control: '23M00016', name: 'Pacheco Torres, Kevin Josué',         subject: 'Fund. Ing. de SW',   pct: 75, absences: 4  },
  { control: '23M00020', name: 'Torres Guzmán, Emmanuel Alexis',      subject: 'Ing. de Software',   pct: 62, absences: 7  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function subjectBadge(avg: number) {
  if (avg > 85) return { bg: '#F0FDF4', color: '#16A34A', label: 'Regular' };
  if (avg >= 70) return { bg: '#FFF7ED', color: '#C2410C', label: 'En riesgo' };
  return { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' };
}

function riskBadge(pct: number) {
  if (pct > 70) return { bg: '#FFF7ED', color: '#C2410C', label: 'En riesgo' };
  return { bg: '#FEF2F2', color: '#DC2626', label: 'Crítico' };
}

const BORDER = '#E5E4DF';
const TH = {
  padding: '10px 14px',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: '#9A9A94',
  backgroundColor: '#FAFAFA',
  borderBottom: `1px solid ${BORDER}`,
  textAlign: 'left' as const,
};
const TD = (alt: boolean) => ({
  padding: '12px 14px',
  fontSize: 12,
  color: '#1A1A18',
  borderBottom: `1px solid ${BORDER}`,
  backgroundColor: alt ? '#FAFAF8' : '#FFFFFF',
});

// ── Component ────────────────────────────────────────────────────────────────

export function Reports() {
  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName="MATI. Villaseñor Béjar" userRole="Docente · Depto. ISC" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Breadcrumb */}
          <div className="shrink-0">
            <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>Reportes</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>
              Semestre en curso · MATI. Villaseñor Béjar
            </p>
          </div>

          {/* ── SECCIÓN 1: Tarjetas de resumen ── */}
          <div className="grid grid-cols-4 gap-4">
            {/* Clases impartidas */}
            <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#F5F4EF' }}>
                <IconSchool size={20} style={{ color: '#2C2C2A' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#1A1A18' }}>48</div>
                <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Clases impartidas</div>
              </div>
            </div>

            {/* Promedio global */}
            <div className="bg-white rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: BORDER }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
                <IconChartBar size={20} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#16A34A' }}>83%</div>
                <div className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>Asistencia promedio</div>
              </div>
            </div>

            {/* En riesgo — fondo amarillo suave */}
            <div className="rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFEDD5' }}>
                <IconAlertTriangle size={20} style={{ color: '#C2410C' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#C2410C' }}>4</div>
                <div className="text-xs mt-0.5" style={{ color: '#C2410C' }}>Alumnos en riesgo (&lt;80%)</div>
              </div>
            </div>

            {/* Crítico — fondo rojo suave */}
            <div className="rounded-lg border p-5 flex items-start gap-4" style={{ borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}>
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                <IconAlertCircle size={20} style={{ color: '#DC2626' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#DC2626' }}>1</div>
                <div className="text-xs mt-0.5" style={{ color: '#DC2626' }}>Alumnos críticos (&lt;70%)</div>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 2: Gráfica de tendencia ── */}
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: BORDER }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: '#1A1A18' }}>
              Tendencia de asistencia — Semestre actual
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: '#9A9A94' }}
                  label={{ value: 'Semana', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9A9A94' }}
                />
                <YAxis
                  domain={[60, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#9A9A94' }}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Asistencia']}
                  labelFormatter={(l) => `Semana ${l}`}
                  contentStyle={{ fontSize: 12, borderColor: BORDER, borderRadius: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#2C2C2A"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2C2C2A' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── SECCIÓN 3: Resumen por materia + botón exportar ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: '#1A1A18' }}>Resumen por materia</h2>
              <button
                onClick={() => alert('Exportando...')}
                className="flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold transition-colors hover:bg-bg-subtle"
                style={{ borderColor: BORDER, color: '#5A5A56', backgroundColor: '#FFFFFF' }}
              >
                <IconDownload size={14} />
                Exportar reporte CSV
              </button>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Materia', 'Grupo', 'Total clases', 'Asistencia promedio', 'Estado'].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUBJECTS.map((s, i) => {
                    const badge = subjectBadge(s.avg);
                    return (
                      <tr key={s.name}>
                        <td style={{ ...TD(i % 2 === 1), fontWeight: 500 }}>{s.name}</td>
                        <td style={TD(i % 2 === 1)}>{s.group}</td>
                        <td style={TD(i % 2 === 1)}>{s.total}</td>
                        <td style={TD(i % 2 === 1)}>
                          <span style={{ fontWeight: 700, color: badge.color }}>{s.avg}%</span>
                        </td>
                        <td style={TD(i % 2 === 1)}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SECCIÓN 4: Alumnos en riesgo ── */}
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#1A1A18' }}>
              Alumnos en riesgo de reprobación
            </h2>
            <p className="text-xs mt-0.5 mb-3" style={{ color: '#9A9A94' }}>
              Asistencia por debajo del 80%
            </p>

            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: BORDER }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['No. Control', 'Nombre', 'Materia', '% Asistencia', 'Faltas', 'Estado'].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AT_RISK.map((s, i) => {
                    const badge = riskBadge(s.pct);
                    return (
                      <tr key={s.control}>
                        <td style={{ ...TD(i % 2 === 1), fontFamily: 'monospace' }}>{s.control}</td>
                        <td style={{ ...TD(i % 2 === 1), fontWeight: 500 }}>{s.name}</td>
                        <td style={{ ...TD(i % 2 === 1), color: '#5A5A56' }}>{s.subject}</td>
                        <td style={TD(i % 2 === 1)}>
                          <span style={{ fontWeight: 700, color: badge.color }}>{s.pct}%</span>
                        </td>
                        <td style={{ ...TD(i % 2 === 1), color: '#5A5A56' }}>{s.absences}</td>
                        <td style={TD(i % 2 === 1)}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 99,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* bottom spacing */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
