import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import {
  IconZoomIn, IconZoomOut, IconMaximize, IconMinimize, IconRefresh,
} from '@tabler/icons-react';
import { NavRail } from '@/components/NavRail';
import { TopBar } from '@/components/TopBar';
import { StudentRow } from '@/components/StudentRow';
import { LiveBadge } from '@/components/LiveBadge';
import { CountdownBar } from '@/components/CountdownBar';
import { apiClient, type AttendanceRecord } from '@/lib/api';

const QR_MIN = 150;
const QR_MAX = 500;
const QR_STEP = 50;

type Status = 'present' | 'pending' | 'manual' | 'absent';
type MobileTab = 'qr' | 'monitor';

interface StudentEntry {
  estudiante_id: number;
  no_control: string;
  nombre: string;
  status: Status;
  asistencia_id?: number;
}

interface SessionState {
  session_id: number;
  token: string;
  materia: string;
  grupo: string;
  aula: string;
}

function estadoToStatus(estado: string): Status {
  if (estado === 'presente') return 'present';
  if (estado === 'ausente') return 'absent';
  if (estado === 'justificado') return 'manual';
  return 'pending';
}

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function ActiveSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as SessionState | null;

  const sessionId = state?.session_id ?? 0;
  const materia  = state?.materia ?? 'Materia';
  const grupo    = state?.grupo   ?? 'Grupo';
  const aula     = state?.aula    ?? 'Aula';

  const [qrToken, setQrToken] = useState(state?.token ?? '');
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('qr');
  const [qrSize, setQrSize] = useState(200);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nombre = localStorage.getItem('nombre') ?? 'Docente';

  const presentCount = students.filter((s) => s.status === 'present').length;
  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const manualCount  = students.filter((s) => s.status === 'manual').length;
  const total = students.length;

  // When arriving from "Ver pase activo" (laptop joining existing session),
  // token is empty — fetch the current QR immediately before the 14s interval fires.
  useEffect(() => {
    if (!sessionId || qrToken) return;
    apiClient.getSessionQR(sessionId).then((qr) => setQrToken(qr.token));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sessionId) return;
    apiClient.getSessionStats(sessionId).then((stats) => {
      setStudents(
        stats.students.map((r: AttendanceRecord) => ({
          estudiante_id: r.estudiante_id,
          no_control: r.no_control,
          nombre: r.nombre,
          status: estadoToStatus(r.estado),
        })),
      );
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    qrIntervalRef.current = setInterval(() => {
      apiClient.getSessionQR(sessionId).then((qr) => setQrToken(qr.token));
    }, 14000);
    return () => { if (qrIntervalRef.current) clearInterval(qrIntervalRef.current); };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const token = localStorage.getItem('access_token') ?? '';
    const ws = new WebSocket(`${WS_BASE}/ws/session/${sessionId}?token=${token}`);
    wsRef.current = ws;
    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'attendance' || msg.type === 'attendance_updated') {
          setStudents((prev) =>
            prev.map((s) =>
              s.estudiante_id === msg.estudiante_id
                ? { ...s, status: estadoToStatus(msg.estado) }
                : s,
            ),
          );
        }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [sessionId]);

  // Escape key exits fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRefreshQR = useCallback(() => {
    if (!sessionId) return;
    apiClient.getSessionQR(sessionId).then((qr) => setQrToken(qr.token));
  }, [sessionId]);

  const handleCloseSession = async () => {
    try { await apiClient.closeSession(sessionId); } catch { /* proceed anyway */ }
    wsRef.current?.close();
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    navigate('/teacher/dashboard');
  };

  const handleStatusChange = async (no_control: string, newStatus: Status) => {
    setOpenDropdownId(null);
    setStudents((prev) =>
      prev.map((s) => (s.no_control === no_control ? { ...s, status: newStatus } : s)),
    );
    const student = students.find((s) => s.no_control === no_control);
    if (!student?.asistencia_id) return;
    const estadoMap: Record<Status, string> = {
      present: 'presente', pending: 'pendiente', manual: 'justificado', absent: 'ausente',
    };
    try {
      await apiClient.updateAttendance(student.asistencia_id, estadoMap[newStatus]);
    } catch {
      setStudents((prev) =>
        prev.map((s) => (s.no_control === no_control ? { ...s, status: student.status } : s)),
      );
    }
  };

  const toggleDropdown = (id: string) =>
    setOpenDropdownId((prev) => (prev === id ? null : id));

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-app">
        <div className="text-center px-4">
          <p className="text-sm text-secondary mb-4">No hay sesión activa.</p>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="px-4 py-3 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: '#2C2C2A' }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Shared monitor panel content ──────────────────────────────────────────

  const MonitorPanel = (
    <div className="flex flex-col gap-3 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-base lg:text-lg font-bold text-charcoal truncate">Monitor de Asistencia</h2>
          <p className="text-xs text-secondary mt-0.5 truncate">
            {materia} · Grupo {grupo}
            {connected && <span className="ml-2 text-green-600">●</span>}
          </p>
        </div>
        <LiveBadge />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-[#F0FDF4] border border-border-subtle rounded-lg p-2 lg:p-3.5">
          <div className="text-[9px] lg:text-[10px] text-secondary font-semibold uppercase mb-1">Presentes</div>
          <div className="text-xl lg:text-2xl font-bold text-success">{presentCount}</div>
        </div>
        <div className="bg-[#FFF7ED] border border-border-subtle rounded-lg p-2 lg:p-3.5">
          <div className="text-[9px] lg:text-[10px] text-secondary font-semibold uppercase mb-1">Pendientes</div>
          <div className="text-xl lg:text-2xl font-bold text-warning">{pendingCount}</div>
        </div>
        <div className="bg-[#F9FAFB] border border-border-subtle rounded-lg p-2 lg:p-3.5">
          <div className="text-[9px] lg:text-[10px] text-secondary font-semibold uppercase mb-1">Manual</div>
          <div className="text-xl lg:text-2xl font-bold text-secondary">{manualCount}</div>
        </div>
        <div className="bg-white border border-border-subtle rounded-lg p-2 lg:p-3.5">
          <div className="text-[9px] lg:text-[10px] text-secondary font-semibold uppercase mb-1">Total</div>
          <div className="text-xl lg:text-2xl font-bold text-charcoal">{total}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-border-subtle rounded-lg p-3 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-secondary">Progreso</span>
          <span className="text-xs font-semibold text-charcoal">
            {total > 0 ? Math.round((presentCount / total) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${total > 0 ? (presentCount / total) * 100 : 0}%` }}
            className="bg-success transition-all duration-300"
          />
          <div
            style={{ width: `${total > 0 ? (manualCount / total) * 100 : 0}%` }}
            className="bg-warning"
          />
        </div>
      </div>

      {/* Student list */}
      <div className="flex-1 bg-white border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="grid grid-cols-[1fr_90px_90px_36px] gap-2 px-3 py-2 bg-[#FAFAFA] border-b border-border-subtle font-bold text-[9px] text-secondary uppercase tracking-wider shrink-0">
          <span>Nombre</span>
          <span>Matrícula</span>
          <span>Estado</span>
          <span />
        </div>
        <div className="flex-1 overflow-y-auto">
          {students.map((student, idx) => (
            <StudentRow
              key={student.no_control}
              controlNumber={student.no_control}
              name={student.nombre}
              status={student.status}
              alternateBackground={idx % 2 === 1}
              isDropdownOpen={openDropdownId === student.no_control}
              onEdit={() => toggleDropdown(student.no_control)}
              onStatusChange={(status) => handleStatusChange(student.no_control, status)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP layout (lg+) ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex h-screen bg-bg-app"
        onClick={() => setOpenDropdownId(null)}
      >
        <NavRail />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar userName={nombre} userRole="Docente · Depto. ISC" />
          <div className="flex-1 flex overflow-hidden p-5 gap-5">
            {/* Desktop QR panel with zoom + fullscreen */}
            <div
              className="shrink-0 flex flex-col gap-4"
              style={{ width: Math.max(280, qrSize + 80) }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border border-border-subtle rounded-lg p-5 shadow-sm flex flex-col items-center gap-4">
                {/* Header */}
                <div className="w-full flex items-start justify-between">
                  <div>
                    <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Sesión activa</div>
                    <div className="text-base font-bold text-charcoal mt-0.5">{materia}</div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7]">
                    <div className="animate-pulse w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[11px] font-bold text-[#16A34A]">ACTIVA</span>
                  </div>
                </div>

                {/* Info chips */}
                <div className="w-full flex gap-2">
                  <div className="flex-1 bg-bg-light border border-border-subtle rounded-xs px-3 py-2">
                    <div className="text-[9px] text-secondary font-semibold uppercase tracking-wider">Grupo</div>
                    <div className="text-xs font-semibold text-charcoal mt-0.5">{grupo}</div>
                  </div>
                  <div className="flex-1 bg-bg-light border border-border-subtle rounded-xs px-3 py-2">
                    <div className="text-[9px] text-secondary font-semibold uppercase tracking-wider">Aula</div>
                    <div className="text-xs font-semibold text-charcoal mt-0.5">{aula}</div>
                  </div>
                </div>

                {/* Zoom controls */}
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => setQrSize((s) => Math.max(QR_MIN, s - QR_STEP))}
                    disabled={qrSize <= QR_MIN}
                    title="Reducir QR"
                    className="p-1.5 rounded border border-border-light text-secondary hover:text-charcoal hover:bg-bg-subtle disabled:opacity-30 transition-colors"
                  >
                    <IconZoomOut size={16} />
                  </button>
                  <span className="flex-1 text-center text-xs text-secondary">{qrSize}px</span>
                  <button
                    onClick={() => setQrSize((s) => Math.min(QR_MAX, s + QR_STEP))}
                    disabled={qrSize >= QR_MAX}
                    title="Ampliar QR"
                    className="p-1.5 rounded border border-border-light text-secondary hover:text-charcoal hover:bg-bg-subtle disabled:opacity-30 transition-colors"
                  >
                    <IconZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    title="Pantalla completa"
                    className="p-1.5 rounded border border-border-light text-secondary hover:text-charcoal hover:bg-bg-subtle transition-colors"
                  >
                    <IconMaximize size={16} />
                  </button>
                </div>

                {/* QR Code */}
                <div className="p-3 bg-white border-2 border-border-subtle rounded-sm">
                  <QRCodeSVG value={qrToken || ' '} size={qrSize} level="H" includeMargin />
                </div>

                <div className="text-[9px] text-secondary font-bold tracking-wider uppercase">Escanea con SGA-QR</div>

                {/* Countdown — always visible */}
                <CountdownBar
                  initialSeconds={15}
                  totalSeconds={15}
                  onExpire={handleRefreshQR}
                  autoRestart
                />

                {/* Actions */}
                <div className="w-full flex gap-2.5">
                  <button
                    onClick={handleRefreshQR}
                    className="flex-1 px-3 py-2 rounded-xs border border-border-light bg-white hover:bg-bg-subtle text-charcoal text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <IconRefresh size={13} />
                    Regenerar
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex-1 px-3 py-2 rounded-xs bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-xs font-semibold transition-colors"
                  >
                    Cerrar clase
                  </button>
                </div>
              </div>
            </div>
            <div
              className="flex-1 flex flex-col gap-3.5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {MonitorPanel}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (<lg) ──────────────────────────────────────────── */}
      <div
        className="lg:hidden flex flex-col h-screen bg-bg-app"
        onClick={() => setOpenDropdownId(null)}
      >
        {/* Mobile header */}
        <div
          className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-border-subtle"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-charcoal truncate">{materia}</p>
            <p className="text-xs text-secondary">Grupo {grupo} · {aula}</p>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge />
            <button
              onClick={() => setShowConfirm(true)}
              className="px-3 rounded-lg text-xs font-bold text-white"
              style={{ backgroundColor: '#DC2626', minHeight: 36 }}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="shrink-0 flex border-b border-border-subtle bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {(['qr', 'monitor'] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className="flex-1 py-3 text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer"
              style={{
                color: mobileTab === tab ? '#2C2C2A' : '#9A9A94',
                borderBottom: mobileTab === tab ? '2px solid #2C2C2A' : '2px solid transparent',
              }}
            >
              {tab === 'qr' ? 'Código QR' : 'Monitor'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {mobileTab === 'qr' ? (
            /* ── QR tab ── */
            <div className="flex flex-col items-center gap-4 p-4">
              {/* Session info chips */}
              <div className="w-full flex gap-2">
                <div className="flex-1 bg-bg-light border border-border-subtle rounded-lg px-3 py-2">
                  <div className="text-[9px] text-secondary font-semibold uppercase">Grupo</div>
                  <div className="text-sm font-semibold text-charcoal">{grupo}</div>
                </div>
                <div className="flex-1 bg-bg-light border border-border-subtle rounded-lg px-3 py-2">
                  <div className="text-[9px] text-secondary font-semibold uppercase">Aula</div>
                  <div className="text-sm font-semibold text-charcoal">{aula}</div>
                </div>
              </div>

              {/* QR code — large for projection */}
              <div className="bg-white border-2 border-border-subtle rounded-xl p-4 shadow-sm">
                <QRCodeSVG value={qrToken || ' '} size={260} level="H" includeMargin />
              </div>

              <p className="text-xs text-secondary font-semibold uppercase tracking-wider">
                Escanea con SGA-QR
              </p>

              <div className="w-full">
                <CountdownBar
                  initialSeconds={15}
                  totalSeconds={15}
                  onExpire={handleRefreshQR}
                  autoRestart
                />
              </div>

              <button
                onClick={handleRefreshQR}
                className="w-full py-3 rounded-lg border text-sm font-semibold text-charcoal transition-colors"
                style={{ borderColor: '#D4D3CD' }}
              >
                Regenerar QR
              </button>
            </div>
          ) : (
            /* ── Monitor tab ── */
            <div
              className="p-4 h-full flex flex-col"
              style={{ minHeight: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {MonitorPanel}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen QR overlay ─────────────────────────────────────────── */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black">
          <QRCodeSVG
            value={qrToken || ' '}
            size={Math.round(Math.min(window.innerHeight * 0.78, window.innerWidth * 0.78))}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />

          <div className="w-full max-w-sm px-6">
            <CountdownBar
              initialSeconds={15}
              totalSeconds={15}
              onExpire={handleRefreshQR}
              autoRestart
            />
          </div>

          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
          >
            <IconMinimize size={16} />
            Salir de pantalla completa
            <span className="ml-2 text-white/50 text-xs">Esc</span>
          </button>
        </div>
      )}

      {/* ── Confirm close dialog (shared) ─────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
            <h3 className="text-base font-bold text-charcoal mb-2">¿Cerrar la clase?</h3>
            <p className="text-sm text-secondary mb-5">
              Se terminará la sesión activa. Los registros de asistencia ya guardados se conservan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 rounded-lg border text-sm font-semibold text-charcoal transition-colors"
                style={{ borderColor: '#D4D3CD', minHeight: 44 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseSession}
                className="px-4 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: '#DC2626', minHeight: 44 }}
              >
                Cerrar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
