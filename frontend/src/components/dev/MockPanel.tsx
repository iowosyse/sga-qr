import { generateFakeQR } from '@/lib/hardwareMock';
import { IconBug } from '@tabler/icons-react';

interface MockPanelProps {
  onSimulateQR: (token: string) => void;
}

export default function MockPanel({ onSimulateQR }: MockPanelProps) {
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleSimulate = () => {
    const token = generateFakeQR();
    onSimulateQR(token);
  };

  return (
    <div className="flex flex-col shrink-0" style={{ gap: 10, padding: '16px 24px 36px' }}>
      <button
        onClick={handleSimulate}
        className="flex items-center justify-center gap-2"
        style={{
          padding: '14px', borderRadius: 12,
          border: '1px dashed rgba(239, 68, 68, 0.5)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#FCA5A5',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <IconBug size={18} />
        🛠️ Inyectar Asistencia (DEV)
      </button>
    </div>
  );
}
