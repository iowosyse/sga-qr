import { useState, useEffect } from 'react';

interface CountdownBarProps {
  initialSeconds?: number;
  totalSeconds?: number;
  onExpire?: () => void;
  autoRestart?: boolean;
}

export function CountdownBar({ initialSeconds = 15, totalSeconds = 15, onExpire, autoRestart = false }: CountdownBarProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (onExpire) onExpire();
          if (autoRestart) return totalSeconds;
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire, autoRestart, totalSeconds]);

  const percentage = (seconds / totalSeconds) * 100;
  const isLow = seconds <= 5;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-secondary">Código se renueva en</div>
        <div className={`text-lg font-bold font-mono transition-colors duration-300 ${isLow ? 'text-error' : 'text-charcoal'}`}>{String(seconds).padStart(2, '0')}s</div>
      </div>
      <div className="h-1.5 bg-[#F3F4F6] rounded-sm overflow-hidden">
        <div className={`h-full rounded-sm transition-all duration-900 ${isLow ? 'bg-error' : 'bg-success'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
