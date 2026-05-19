interface StatusDotProps {
  status: 'present' | 'pending' | 'manual' | 'absent';
  size?: 'sm' | 'md' | 'lg';
}

const statusColors: Record<string, { dot: string; text: string; label: string }> = {
  present: { dot: '#22C55E', text: '#22C55E', label: 'Presente' },
  pending: { dot: '#9CA3AF', text: '#9CA3AF', label: 'Pendiente' },
  manual: { dot: '#F97316', text: '#F97316', label: 'Manual' },
  absent: { dot: '#DC2626', text: '#DC2626', label: 'Ausente' },
};

export function StatusDot({ status, size = 'md' }: StatusDotProps) {
  const colors = statusColors[status];
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className={`rounded-full flex-shrink-0 ${sizeClasses[size]}`} style={{ backgroundColor: colors.dot }} />
      <span className="text-xs font-semibold" style={{ color: colors.text }}>
        {colors.label}
      </span>
    </div>
  );
}
