import { Pencil } from 'lucide-react';
import { StatusDot } from './StatusDot';

type Status = 'present' | 'pending' | 'manual' | 'absent';

interface StudentRowProps {
  controlNumber: string;
  name: string;
  status: Status;
  alternateBackground?: boolean;
  isDropdownOpen?: boolean;
  onEdit?: () => void;
  onStatusChange?: (status: Status) => void;
}

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: 'present', label: 'Presente',  color: '#22C55E' },
  { value: 'pending', label: 'Pendiente', color: '#9CA3AF' },
  { value: 'absent',  label: 'Ausente',   color: '#DC2626' },
  { value: 'manual',  label: 'Manual',    color: '#F97316' },
];

export function StudentRow({
  controlNumber,
  name,
  status,
  alternateBackground = false,
  isDropdownOpen = false,
  onEdit,
  onStatusChange,
}: StudentRowProps) {
  return (
    <div
      className={`grid grid-cols-[1fr_110px_100px_40px] gap-3 px-4 py-2.5 border-b border-border-subtle last:border-b-0 items-center transition-colors ${
        alternateBackground ? 'bg-bg-lighter' : 'bg-white'
      } hover:bg-bg-lighter`}
    >
      <span className="text-xs font-medium text-charcoal truncate">{name}</span>

      <span className="text-xs text-secondary font-mono">{controlNumber}</span>

      <div className="flex items-center gap-1.5">
        <StatusDot status={status} size="sm" />
      </div>

      {/* Edit button + inline dropdown */}
      <div className="relative">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-xs border border-border-subtle bg-white hover:bg-bg-subtle flex items-center justify-center text-secondary hover:text-charcoal transition-colors"
        >
          <Pencil size={11} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-8 z-20 bg-white border border-border-subtle rounded-md shadow-md py-1 min-w-30">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange?.(opt.value)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-subtle transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                <span style={{ color: opt.value === status ? opt.color : '#1A1A18', fontWeight: opt.value === status ? 600 : 400 }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
