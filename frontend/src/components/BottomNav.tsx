import { NavLink, useNavigate, useLocation } from 'react-router';
import {
  IconLayoutDashboard,
  IconChartBar,
  IconUsers,
  IconCalendarTime,
  IconLogout,
  IconFileText,
  IconHistory,
  IconRadar,
} from '@tabler/icons-react';

const teacherNavItems = [
  { icon: IconLayoutDashboard, label: 'Mis clases', path: '/teacher/dashboard' },
  { icon: IconChartBar,        label: 'Reportes',   path: '/teacher/reports'   },
  { icon: IconUsers,           label: 'Alumnos',    path: '/teacher/students'  },
  { icon: IconCalendarTime,    label: 'Horarios',   path: '/teacher/schedule'  },
];

const studentNavItems = [
  { icon: IconRadar,           label: 'Escanear',   path: '/student/scanner'   },
  { icon: IconHistory,         label: 'Historial',  path: '/student/history'   },
  { icon: IconFileText,        label: 'Faltas',     path: '/student/ausencias' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isTeacher = location.pathname.startsWith('/teacher');
  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E4DF', height: 60 }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]"
            style={({ isActive }) => ({
              color: isActive ? '#2C2C2A' : '#9A9A94',
              textDecoration: 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} stroke={isActive ? 2 : 1.5} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Logout */}
      <button
        onClick={() => navigate('/login')}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] bg-transparent border-none cursor-pointer"
        style={{ color: '#9A9A94' }}
      >
        <IconLogout size={20} stroke={1.5} />
        <span style={{ fontSize: 10, fontWeight: 500 }}>Salir</span>
      </button>
    </nav>
  );
}
