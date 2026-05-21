import { NavRail } from '@/components/NavRail';
import { BottomNav } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';

const HOURS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;
type Day = typeof DAYS[number];

interface Block {
  subject: string;
  group: string;
  color: string;
}

// Map: hour → day → block
const SCHEDULE: Record<string, Partial<Record<Day, Block>>> = {
  '08:00': {
    Lunes:     { subject: 'Ing. de Software', group: '8A', color: '#F472B6' },
    Miércoles: { subject: 'Ing. de Software', group: '8A', color: '#F472B6' },
    Viernes:   { subject: 'Ing. de Software', group: '8A', color: '#F472B6' },
  },
  '16:00': {
    Martes: { subject: 'Taller de Inv.',    group: '9A', color: '#FB923C' },
    Jueves: { subject: 'Taller de Inv.',    group: '9A', color: '#FB923C' },
  },
  '17:00': {
    Lunes:     { subject: 'Fund. de Ing. de SW', group: '7C', color: '#60A5FA' },
    Martes:    { subject: 'Fund. de Ing. de SW', group: '7C', color: '#60A5FA' },
    Miércoles: { subject: 'Fund. de Ing. de SW', group: '7C', color: '#60A5FA' },
    Jueves:    { subject: 'Fund. de Ing. de SW', group: '7C', color: '#60A5FA' },
    Viernes:   { subject: 'Fund. de Ing. de SW', group: '7C', color: '#60A5FA' },
  },
};

const BORDER = '1px solid #E5E4DF';
const COL_W  = 160;
const HOUR_W = 72;

export function Schedule() {
  return (
    <div className="flex h-screen bg-bg-app">
      <NavRail />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName="MATI. Villaseñor Béjar" userRole="Docente · Depto. ISC" />

        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 pb-20 lg:pb-6 gap-5">
          {/* Page header */}
          <div className="shrink-0">
            <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>Horarios</h1>
            <p className="text-xs mt-0.5" style={{ color: '#9A9A94' }}>
              Semestre en curso · MATI. Villaseñor Béjar
            </p>
          </div>

          {/* Scrollable table wrapper — fills remaining height */}
          <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: '#E5E4DF' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: HOUR_W }} />
                {DAYS.map((d) => <col key={d} style={{ width: COL_W }} />)}
              </colgroup>

              {/* Sticky header row */}
              <thead>
                <tr>
                  {/* Corner cell — sticky top + left */}
                  <th
                    style={{
                      position: 'sticky', top: 0, left: 0, zIndex: 30,
                      backgroundColor: '#FAFAFA',
                      border: BORDER,
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#9A9A94',
                    }}
                  >
                    Hora
                  </th>

                  {DAYS.map((day) => (
                    <th
                      key={day}
                      style={{
                        position: 'sticky', top: 0, zIndex: 20,
                        backgroundColor: '#FAFAFA',
                        border: BORDER,
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#9A9A94',
                      }}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    {/* Sticky hour label */}
                    <td
                      style={{
                        position: 'sticky', left: 0, zIndex: 10,
                        backgroundColor: '#FAFAFA',
                        border: BORDER,
                        padding: '10px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#9A9A94',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hour}
                    </td>

                    {DAYS.map((day) => {
                      const block = SCHEDULE[hour]?.[day];
                      return (
                        <td
                          key={day}
                          style={{
                            border: BORDER,
                            padding: block ? '8px 12px' : 0,
                            height: 52,
                            verticalAlign: 'middle',
                            backgroundColor: block ? `${block.color}26` : '#FFFFFF',
                          }}
                        >
                          {block && (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#1A1A18',
                                  lineHeight: 1.3,
                                }}
                              >
                                {block.subject}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 500,
                                  color: '#5A5A56',
                                  marginTop: 2,
                                }}
                              >
                                Grupo {block.group}
                              </div>
                              {/* Color accent bar */}
                              <div
                                style={{
                                  marginTop: 4,
                                  height: 3,
                                  borderRadius: 2,
                                  backgroundColor: block.color,
                                  width: '40%',
                                }}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
