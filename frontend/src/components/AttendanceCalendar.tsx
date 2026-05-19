interface AttendanceCalendarProps {
  month: number;
  year: number;
  data?: { date: number; percentage: number }[];
}

export function AttendanceCalendar({ month, year, data = [] }: AttendanceCalendarProps) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun … 6=Sat, matches column order
  const lastDate = new Date(year, month + 1, 0).getDate();

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 85) return '#22C55E';
    if (percentage >= 70) return '#F97316';
    return '#DC2626';
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= lastDate; i++) days.push(i);

  const dataMap = new Map(data.map((d) => [d.date, d.percentage]));

  return (
    <div className="bg-white border border-border-subtle rounded-lg p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-4">
        {new Date(year, month).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-xs font-semibold text-secondary text-center py-1">
            {day}
          </div>
        ))}

        {days.map((date, idx) => {
          if (date === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const percentage = dataMap.get(date);
          const color = percentage ? getPercentageColor(percentage) : '#E5E7EB';

          return (
            <div key={date} className="aspect-square flex items-center justify-center rounded-xs hover:bg-bg-light transition-colors cursor-pointer group">
              {percentage !== undefined ? (
                <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: `${color}20` }}>
                  <div className="text-[10px] font-bold" style={{ color }}>
                    {percentage}%
                  </div>
                  <div className="text-[8px]" style={{ color }}>
                    {date}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-secondary">{date}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
