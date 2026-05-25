import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw } from 'lucide-react';

interface QRDisplayProps {
  subject: string;
  group: string;
  classroom: string;
  secret: string;
  onClose?: () => void;
  onRefresh?: () => void;
}

export function QRDisplay({ subject, group, classroom, secret, onClose, onRefresh }: QRDisplayProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col gap-4">
      <div className="bg-white border border-border-subtle rounded-lg p-6 shadow-subtle flex flex-col items-center gap-4">
        {/* Header */}
        <div className="w-full flex items-start justify-between">
          <div>
            <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Sesión activa</div>
            <div className="text-base font-bold text-charcoal mt-0.5">{subject}</div>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7]">
            <div className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span className="text-[11px] font-bold text-[#16A34A]">ACTIVA</span>
          </div>
        </div>

        {/* Class info chips */}
        <div className="w-full flex gap-2">
          <div className="flex-1 bg-bg-light border border-border-subtle rounded-xs px-3 py-2">
            <div className="text-[9px] text-secondary font-semibold uppercase tracking-wider">Grupo</div>
            <div className="text-xs font-semibold text-charcoal mt-0.5">{group}</div>
          </div>
          <div className="flex-1 bg-bg-light border border-border-subtle rounded-xs px-3 py-2">
            <div className="text-[9px] text-secondary font-semibold uppercase tracking-wider">Aula</div>
            <div className="text-xs font-semibold text-charcoal mt-0.5">{classroom}</div>
          </div>
        </div>

        {/* QR Code */}
        <div className="p-3 bg-white border-2 border-border-subtle rounded-sm">
          <QRCodeSVG value={secret} size={160} level="H" includeMargin />
        </div>

        <div className="text-[9px] text-secondary font-bold tracking-wider uppercase">Escanea con SGA-QR</div>

        {/* Actions */}
        <div className="w-full flex gap-2.5">
          <button
            onClick={onRefresh}
            className="flex-1 px-4 py-2.5 rounded-xs border border-border-light bg-white hover:bg-bg-subtle text-charcoal text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={13} />
            Regenerar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xs bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold transition-colors"
          >
            Cerrar clase
          </button>
        </div>
      </div>
    </div>
  );
}
