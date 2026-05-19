export function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7]">
      <div className="animate-pulse-scale w-[7px] h-[7px] rounded-full bg-[#16A34A] flex-shrink-0" />
      <span className="text-[11px] font-bold text-[#16A34A] tracking-wider">EN VIVO</span>
    </div>
  );
}
