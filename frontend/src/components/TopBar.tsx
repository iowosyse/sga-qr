import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface TopBarProps {
  userName?: string;
  userRole?: string;
}

export function TopBar({ userName = 'MATI. Villaseñor Béjar', userRole = 'Docente · Depto. ISC' }: TopBarProps) {
  const [dateTime, setDateTime] = useState<{ date: string; time: string }>({ date: '', time: '' });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setDateTime({ date, time });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[60px] bg-white border-b border-border-subtle flex items-center px-5 gap-3 flex-shrink-0">
      {/* Logo area */}
      <div className="w-14 flex-shrink-0 flex justify-center">
        <div className="w-8 h-8 rounded-sm bg-charcoal flex items-center justify-center text-white text-xs font-bold">SQ</div>
      </div>

      {/* App name */}
      <div className="flex flex-col gap-0 leading-tight">
        <div className="text-sm font-bold text-charcoal">SGA-QR</div>
        <div className="text-[10px] text-secondary tracking-wider">ITM · Sistema de Asistencias</div>
      </div>

      <div className="flex-1" />

      {/* Date */}
      <div className="text-xs text-secondary capitalize">{dateTime.date}</div>

      {/* Separator */}
      <div className="w-px h-7 bg-border-subtle" />

      {/* Notifications */}
      <button className="w-9 h-9 rounded-sm bg-transparent flex items-center justify-center text-secondary hover:bg-bg-subtle hover:text-charcoal transition-colors">
        <Bell size={17} />
      </button>

      {/* Separator */}
      <div className="w-px h-7 bg-border-subtle" />

      {/* User profile */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-charcoal flex items-center justify-center text-white text-xs font-bold">
          {userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex flex-col gap-0 leading-snug">
          <div className="text-sm font-semibold text-charcoal">{userName}</div>
          <div className="text-xs text-secondary">{userRole}</div>
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-7 bg-border-subtle" />

      {/* Time */}
      <div className="text-base font-bold text-charcoal tracking-wider min-w-[74px]">{dateTime.time}</div>
    </div>
  );
}
