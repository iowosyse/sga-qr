import { useState } from 'react';
import { LayoutDashboard, FileText, Users, Clock, LogOut, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';

const navItems = [
  { icon: LayoutDashboard, label: 'Mis clases', path: '/teacher/dashboard' },
  { icon: FileText, label: 'Reportes', path: '/teacher/reports' },
  { icon: Users, label: 'Alumnos', path: '/teacher/students' },
  { icon: Clock, label: 'Horarios', path: '/teacher/schedule' },
];

export function NavRail() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="hidden lg:flex w-15 bg-white border-r border-border-subtle flex-col items-center py-5 gap-1 shrink-0">
      {/* Logo */}
      <div
        className="w-9 h-9 rounded-sm flex items-center justify-center text-white font-bold text-sm mb-2 cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#2C2C2A' }}
        onClick={() => navigate('/teacher/dashboard')}
      >
        SQ
      </div>

      {/* Nav items */}
      {navItems.map((item, idx) => {
        const Icon = item.icon;

        return (
          <div key={idx} className="relative" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
            <NavLink to={item.path}>
              {({ isActive }) => (
                <span
                  className="w-11 h-11 rounded-xs flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{
                    backgroundColor: isActive || hoveredIndex === idx ? '#EEEDE8' : 'transparent',
                    color: isActive || hoveredIndex === idx ? '#2C2C2A' : '#9CA3AF',
                  }}
                >
                  <Icon size={18} />
                </span>
              )}
            </NavLink>

            {hoveredIndex === idx && (
              <div className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-white border border-border-subtle rounded-xs px-3 py-2 text-xs font-medium whitespace-nowrap pointer-events-none shadow-md z-50" style={{ color: '#2C2C2A' }}>
                {item.label}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-white" />
              </div>
            )}
          </div>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile and logout */}
      <div className="flex flex-col gap-1">
        <button className="w-11 h-11 rounded-xs flex items-center justify-center cursor-pointer transition-all duration-150 bg-transparent text-secondary hover:bg-bg-subtle hover:text-charcoal">
          <User size={18} />
        </button>
        <button onClick={() => navigate('/login')} className="w-11 h-11 rounded-xs flex items-center justify-center cursor-pointer transition-all duration-150 bg-transparent text-secondary hover:bg-bg-subtle hover:text-charcoal">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
