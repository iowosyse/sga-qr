
interface CountdownBarProps {
  seconds: number;
}

export function CountdownBar({ seconds }: CountdownBarProps) {
  const percentage = (Math.max(0, seconds) / 15) * 100;
  const isLow = seconds <= 5;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-secondary">Código se renueva en</div>
        <div className={`text-lg font-bold font-mono transition-colors duration-300 ${isLow ? 'text-[#D97706] animate-pulse' : 'text-[#22C55E]'}`}>{String(Math.max(0, seconds)).padStart(2, '0')}s</div>
      </div>
      <div className="h-1.5 bg-[#E5E4DF] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-250 ${isLow ? 'bg-[#D97706] animate-pulse' : 'bg-[#22C55E]'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
