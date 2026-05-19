import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard, QrCode, Users, CalendarDays, Settings2,
  Pencil, RefreshCw, GraduationCap, Bell,
} from "lucide-react";

const C = {
  charcoal: "#2C2C2A",
  bg: "#F5F4EF",
  white: "#FFFFFF",
  green: "#22C55E",
  gray: "#9CA3AF",
  orange: "#F97316",
  border: "rgba(0,0,0,0.07)",
};

function generateQRMatrix(): number[][] {
  const size = 25;
  const m: number[][] = Array.from({ length: size }, () => Array(size).fill(0));

  const setFinder = (sr: number, sc: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[sr + r][sc + c] = onBorder || inCore ? 1 : 0;
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, 18);
  setFinder(18, 0);

  for (let i = 8; i <= 16; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  m[8][7] = 1;

  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) & 0xffff) / 0xffff;
  };

  const reserved = (r: number, c: number) =>
    (r <= 8 && c <= 8) || (r <= 8 && c >= 17) || (r >= 17 && c <= 8) || r === 6 || c === 6;

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!reserved(r, c)) m[r][c] = rand() > 0.42 ? 1 : 0;

  return m;
}

interface Student {
  id: string;
  name: string;
  status: "present" | "pending" | "manual";
}

const STUDENTS: Student[] = [
  { id: "21M0001", name: "García Pérez, Ana Isabel", status: "present" },
  { id: "21M0002", name: "López Martínez, Carlos E.", status: "pending" },
  { id: "21M0003", name: "Ramírez Torres, Diana L.", status: "present" },
  { id: "21M0004", name: "Hernández Cruz, Eduardo", status: "manual" },
  { id: "21M0005", name: "González Vega, Fernanda", status: "present" },
  { id: "21M0006", name: "Martínez Ruiz, Gabriel A.", status: "pending" },
  { id: "21M0007", name: "Sánchez Morales, Hilda", status: "present" },
  { id: "21M0008", name: "Pérez Jiménez, Iván R.", status: "present" },
  { id: "21M0009", name: "Torres Flores, Jacqueline", status: "pending" },
  { id: "21M0010", name: "Vargas Luna, Kevin M.", status: "present" },
  { id: "21M0011", name: "Reyes Castillo, Laura P.", status: "pending" },
  { id: "21M0012", name: "Mendoza Rivera, Marco A.", status: "present" },
  { id: "21M0013", name: "Castro Gutiérrez, Natalia", status: "present" },
  { id: "21M0014", name: "Ortega Díaz, Omar V.", status: "manual" },
  { id: "21M0015", name: "Aguilar Soto, Paola C.", status: "pending" },
  { id: "21M0016", name: "Chávez Moreno, Roberto", status: "present" },
  { id: "21M0017", name: "Fuentes Espinoza, Sandra", status: "present" },
  { id: "21M0018", name: "Guerrero Ramos, Tomás", status: "pending" },
  { id: "21M0019", name: "Ibarra Núñez, Úrsula K.", status: "present" },
  { id: "21M0020", name: "Jiménez Padilla, Víctor", status: "present" },
  { id: "21M0021", name: "Leyva Quintero, Wendy A.", status: "present" },
  { id: "21M0022", name: "Molina Herrera, Xavier J.", status: "present" },
  { id: "21M0023", name: "Navarro Cortés, Yessenia", status: "pending" },
  { id: "21M0024", name: "Orozco Bravo, Zacarías", status: "present" },
  { id: "21M0025", name: "Paredes Alvarado, Alejandra", status: "pending" },
];

const NAV = [
  { icon: LayoutDashboard, label: "Inicio" },
  { icon: QrCode, label: "Sesión QR", active: true },
  { icon: Users, label: "Alumnos" },
  { icon: CalendarDays, label: "Historial" },
  { icon: Settings2, label: "Configuración" },
];

const statusColor = (s: string) =>
  s === "present" ? C.green : s === "manual" ? C.orange : C.gray;
const statusLabel = (s: string) =>
  s === "present" ? "Presente" : s === "manual" ? "Manual" : "Pendiente";

function NavItem({ Icon, label, active }: { Icon: React.ElementType; label: string; active?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: active ? C.charcoal : hovered ? "rgba(44,44,42,0.08)" : "transparent",
          color: active ? "white" : hovered ? C.charcoal : C.gray,
          transition: "all 0.15s",
        }}
      >
        <Icon size={18} />
      </div>
      {hovered && (
        <div style={{
          position: "absolute",
          left: 48,
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: C.charcoal,
          color: "white",
          padding: "5px 11px",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: "nowrap",
          zIndex: 9000,
          pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          <div style={{
            position: "absolute",
            left: -5,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: `5px solid ${C.charcoal}`,
          }} />
          {label}
        </div>
      )}
    </div>
  );
}

function LiveBadge() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      backgroundColor: "#DCFCE7",
      borderRadius: 20,
    }}>
      <motion.div
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#16A34A" }}
      />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", letterSpacing: "0.07em" }}>EN VIVO</span>
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ flex: 1, backgroundColor: bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, color: C.gray, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 8, padding: "8px 12px", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 9, color: C.gray, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export function TeacherDashboard() {
  const [time, setTime] = useState(new Date());
  const [countdown, setCountdown] = useState(15);
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const qrMatrix = useMemo(() => generateQRMatrix(), []);
  const cellSize = 180 / 25;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 15 : c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setStudents(prev => {
        const pendingIdxs = prev.map((s, i) => ({ s, i })).filter(x => x.s.status === "pending").map(x => x.i);
        if (!pendingIdxs.length) return prev;
        const idx = pendingIdxs[Math.floor(Math.random() * pendingIdxs.length)];
        const next = [...prev];
        next[idx] = { ...next[idx], status: "present" };
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const presentCount = students.filter(s => s.status === "present").length;
  const pendingCount = students.filter(s => s.status === "pending").length;
  const manualCount = students.filter(s => s.status === "manual").length;
  const total = students.length;

  const timeStr = time.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: C.bg, overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Bar ── */}
      <div style={{
        height: 60,
        backgroundColor: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 14,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ width: 56, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={17} color="white" />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, lineHeight: 1.2 }}>SGA-QR</div>
          <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.2, letterSpacing: "0.03em" }}>ITM · Sistema de Asistencias</div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 12, color: C.gray, textTransform: "capitalize" as const }}>{dateStr}</div>

        <div style={{ width: 1, height: 28, backgroundColor: C.border }} />

        <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.gray }}>
          <Bell size={17} />
        </button>

        <div style={{ width: 1, height: 28, backgroundColor: C.border }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: C.charcoal, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700 }}>
            RG
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, lineHeight: 1.3 }}>Dr. Ramírez García</div>
            <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.3 }}>Docente · Depto. ISC</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, backgroundColor: C.border }} />

        <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, fontVariantNumeric: "tabular-nums", letterSpacing: "0.03em", minWidth: 74 }}>
          {timeStr}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left Nav Rail */}
        <div style={{
          width: 56,
          backgroundColor: C.white,
          borderRight: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 20,
          paddingBottom: 20,
          gap: 6,
          flexShrink: 0,
        }}>
          {NAV.map(({ icon, label, active }) => (
            <NavItem key={label} Icon={icon} label={label} active={active} />
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 24, gap: 20 }}>

          {/* ── LEFT PANEL: QR ── */}
          <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              backgroundColor: C.white,
              borderRadius: 14,
              padding: "24px 24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: `1px solid ${C.border}`,
            }}>
              {/* Card header */}
              <div style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Sesión activa</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, marginTop: 3 }}>Programación Web</div>
                </div>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  backgroundColor: "#DCFCE7",
                  color: "#16A34A",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 2,
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#16A34A" }}
                  />
                  ACTIVA
                </div>
              </div>

              {/* Class chips */}
              <div style={{ width: "100%", display: "flex", gap: 8 }}>
                <InfoChip label="Grupo" value="7A-TIC" />
                <InfoChip label="Aula" value="E-204" />
                <InfoChip label="Horario" value="07:00–08:30" />
              </div>

              {/* QR Code */}
              <div style={{
                padding: 14,
                backgroundColor: C.white,
                borderRadius: 12,
                border: `2px solid rgba(0,0,0,0.07)`,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}>
                <svg width={180} height={180} style={{ display: "block" }}>
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c * cellSize}
                          y={r * cellSize}
                          width={cellSize - 0.4}
                          height={cellSize - 0.4}
                          fill={C.charcoal}
                          rx={0.6}
                        />
                      ) : null
                    )
                  )}
                </svg>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.gray, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                  ESCANEA CON SGA-QR
                </div>
              </div>

              {/* Countdown */}
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.gray }}>Código se renueva en</div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: countdown <= 5 ? "#EF4444" : C.charcoal,
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.3s",
                  }}>
                    {countdown}s
                  </div>
                </div>
                <div style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(countdown / 15) * 100}%`,
                    backgroundColor: countdown <= 5 ? "#EF4444" : C.green,
                    borderRadius: 3,
                    transition: "width 0.9s linear, background-color 0.3s",
                  }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ width: "100%", display: "flex", gap: 10 }}>
                <button style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 9,
                  border: `1px solid rgba(0,0,0,0.12)`,
                  background: "transparent",
                  color: C.charcoal,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}>
                  <RefreshCw size={13} />
                  Regenerar
                </button>
                <button style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 9,
                  border: "none",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  Cerrar clase
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Attendance Monitor ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden", minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal }}>Monitor de Asistencia</div>
                  <LiveBadge />
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                  Programación Web · Grupo 7A-TIC · {timeStr}
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <StatCard label="Presentes" value={presentCount} color={C.green} bg="#F0FDF4" />
              <StatCard label="Pendientes" value={pendingCount} color={C.orange} bg="#FFF7ED" />
              <StatCard label="Manual" value={manualCount} color="#6B7280" bg="#F9FAFB" />
              <StatCard label="Total" value={total} color={C.charcoal} bg={C.white} />
            </div>

            {/* Progress overview */}
            <div style={{
              backgroundColor: C.white,
              borderRadius: 10,
              padding: "12px 16px",
              border: `1px solid ${C.border}`,
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.gray, marginBottom: 8 }}>
                <span>Progreso de la sesión</span>
                <span style={{ fontWeight: 600, color: C.charcoal }}>{Math.round((presentCount / total) * 100)}% completado</span>
              </div>
              <div style={{ height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(presentCount / total) * 100}%`, backgroundColor: C.green, transition: "width 0.6s ease" }} />
                <div style={{ width: `${(manualCount / total) * 100}%`, backgroundColor: C.orange }} />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                {[["Presente", C.green], ["Manual", C.orange], ["Pendiente", "#D1D5DB"]].map(([l, col]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.gray }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: col }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Student list */}
            <div style={{
              flex: 1,
              backgroundColor: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}>
              {/* List header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 100px 40px",
                gap: 12,
                padding: "10px 16px",
                backgroundColor: "#FAFAFA",
                borderBottom: `1px solid ${C.border}`,
                fontSize: 10,
                fontWeight: 700,
                color: C.gray,
                textTransform: "uppercase" as const,
                letterSpacing: "0.07em",
                flexShrink: 0,
              }}>
                <span>Nombre</span>
                <span>Matrícula</span>
                <span>Estado</span>
                <span></span>
              </div>

              {/* Scrollable rows */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {students.map((student, i) => (
                  <motion.div
                    key={student.id}
                    layout
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 110px 100px 40px",
                      gap: 12,
                      padding: "9px 16px",
                      borderBottom: i < students.length - 1 ? `1px solid rgba(0,0,0,0.04)` : "none",
                      alignItems: "center",
                      backgroundColor: i % 2 === 0 ? "transparent" : "#FAFAFA",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.charcoal, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {student.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.gray, fontVariantNumeric: "tabular-nums" }}>{student.id}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <motion.div
                        layout
                        style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor(student.status), flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: statusColor(student.status), fontWeight: 600 }}>
                        {statusLabel(student.status)}
                      </span>
                    </div>
                    <button style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.gray,
                    }}>
                      <Pencil size={11} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
