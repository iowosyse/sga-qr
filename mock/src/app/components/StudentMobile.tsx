import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, MapPin, CheckCircle2, History, AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";

const C = {
  charcoal: "#2C2C2A",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  green: "#22C55E",
  bg: "#F5F4EF",
};

type Screen = 1 | 2 | 3 | 4;

/* ─── Status bar ─── */
function StatusBar({ dark }: { dark?: boolean }) {
  const fg = dark ? "white" : C.charcoal;
  return (
    <div style={{
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 22px",
      position: "relative",
      zIndex: 10,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: fg }}>9:41</span>
      {/* Dynamic island */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 8, width: 110, height: 30, backgroundColor: dark ? "#111" : C.charcoal, borderRadius: 20 }} />
      {/* Battery + signal */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 10 }}>
          {[4, 6, 8, 10].map((h, i) => <div key={i} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: fg }} />)}
        </div>
        <svg width="14" height="10" viewBox="0 0 14 10" fill={fg}>
          <path d="M7 1.5C9 1.5 10.8 2.3 12.1 3.6L13.5 2.2C11.8 0.8 9.5 0 7 0C4.5 0 2.2 0.8 0.5 2.2L1.9 3.6C3.2 2.3 5 1.5 7 1.5Z"/>
          <path d="M7 4.5C8.3 4.5 9.5 5 10.4 5.9L11.8 4.5C10.5 3.3 8.8 2.5 7 2.5C5.2 2.5 3.5 3.3 2.2 4.5L3.6 5.9C4.5 5 5.7 4.5 7 4.5Z"/>
          <circle cx="7" cy="8.5" r="1.5"/>
        </svg>
        <div style={{ width: 20, height: 10, borderRadius: 2.5, border: `1.5px solid ${fg}`, padding: "1px", boxSizing: "border-box" as const, display: "flex", alignItems: "center" }}>
          <div style={{ width: "75%", height: "100%", backgroundColor: fg, borderRadius: 1 }} />
          <div style={{ position: "absolute", marginLeft: 21, width: 2, height: 5, backgroundColor: fg, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Screen 1: Login ─── */
function LoginScreen({ onNext }: { onNext: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [control, setControl] = useState("");
  const [pass, setPass] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 11,
    border: "1.5px solid #E5E7EB",
    fontSize: 15,
    color: C.charcoal,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#F9FAFB",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: C.white, padding: "0 28px 32px" }}>
      {/* Logo block */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 8 }}>
        {/* ITM emblem */}
        <div style={{ width: 80, height: 80, borderRadius: 22, backgroundColor: C.charcoal, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(44,44,42,0.25)" }}>
          <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
            <rect x="4" y="4" width="36" height="5" rx="2.5" fill="white"/>
            <rect x="19" y="9" width="6" height="22" rx="3" fill="white"/>
            <rect x="4" y="31" width="36" height="5" rx="2.5" fill="white"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, letterSpacing: "-0.01em" }}>SGA-QR</div>
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, marginTop: 3 }}>
            Instituto Tecnológico de Morelia<br />
            <span style={{ color: "#9CA3AF", fontSize: 11 }}>Sistema de Gestión de Asistencias</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Número de control</div>
          <input
            type="text"
            value={control}
            onChange={e => setControl(e.target.value)}
            placeholder="21M0001"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>Contraseña</div>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 46 }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.gray, padding: 0, display: "flex" }}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          onClick={onNext}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 12,
            border: "none",
            backgroundColor: C.charcoal,
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 4,
            letterSpacing: "0.01em",
          }}
        >
          Entrar
        </button>

        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.gray, fontFamily: "inherit", textAlign: "center" as const }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  );
}

/* ─── Screen 2: QR Scanner ─── */
function ScannerScreen({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0D0D0D" }}>
      {/* Header */}
      <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Escanear QR</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Programación Web · 7A-TIC</div>
        </div>
      </div>

      {/* Camera */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Simulated camera view */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, #1e1e1e 0%, #0a0a0a 100%)",
        }} />
        {/* Subtle noise texture effect */}
        <svg style={{ position: "absolute", inset: 0, opacity: 0.04, width: "100%", height: "100%" }}>
          <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4"/><feColorMatrix type="saturate" values="0"/></filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>

        {/* Dim vignette */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 240px 240px at center 42%, transparent 45%, rgba(0,0,0,0.72) 68%)",
          pointerEvents: "none",
        }} />

        {/* Scan frame */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -54%)",
          width: 220,
          height: 220,
        }}>
          {/* Corners */}
          {[
            { top: 0, left: 0, borderTop: "3px solid #22C55E", borderLeft: "3px solid #22C55E", borderRadius: "4px 0 0 0" },
            { top: 0, right: 0, borderTop: "3px solid #22C55E", borderRight: "3px solid #22C55E", borderRadius: "0 4px 0 0" },
            { bottom: 0, left: 0, borderBottom: "3px solid #22C55E", borderLeft: "3px solid #22C55E", borderRadius: "0 0 0 4px" },
            { bottom: 0, right: 0, borderBottom: "3px solid #22C55E", borderRight: "3px solid #22C55E", borderRadius: "0 0 4px 0" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 26, height: 26, ...s }} />
          ))}

          {/* Inner guide */}
          <div style={{ position: "absolute", inset: 22, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 8 }} />

          {/* Animated scan line */}
          <motion.div
            style={{
              position: "absolute",
              left: 4,
              right: 4,
              height: 2,
              borderRadius: 2,
              background: "linear-gradient(to right, transparent, #22C55E 30%, #22C55E 70%, transparent)",
              boxShadow: "0 0 10px 2px rgba(34,197,94,0.5)",
            }}
            animate={{ top: ["6%", "88%", "6%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Corner dots */}
          {[
            { top: -4, left: -4 },
            { top: -4, right: -4 },
            { bottom: -4, left: -4 },
            { bottom: -4, right: -4 },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22C55E", boxShadow: "0 0 8px #22C55E", ...s }} />
          ))}
        </div>

        {/* Instruction text */}
        <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center" as const }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500, marginBottom: 5 }}>
            Coloca el código QR dentro del recuadro
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
            El escaneo es automático
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: "16px 24px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onNext}
          style={{
            padding: "14px",
            borderRadius: 12,
            border: "none",
            backgroundColor: "#22C55E",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <RefreshCcw size={15} />
          Simular escaneo exitoso
        </button>
        <button style={{
          padding: "12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          backgroundColor: "transparent",
          color: "rgba(255,255,255,0.65)",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
        }}>
          <AlertTriangle size={14} />
          Reportar incidencia
        </button>
      </div>
    </div>
  );
}

/* ─── Screen 3: GPS ─── */
function GPSScreen({ onNext }: { onNext: () => void }) {
  const [locating, setLocating] = useState(false);

  const handleAllow = () => {
    setLocating(true);
    setTimeout(() => onNext(), 1600);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: C.white, padding: "20px 24px 32px" }}>
      {/* Title */}
      <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <MapPin size={30} color="#3B82F6" />
        </motion.div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, marginBottom: 6 }}>Verificación de ubicación</div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
          Necesitamos confirmar que te<br />encuentras en el Aula E-204
        </div>
      </div>

      {/* Schematic mini-map */}
      <div style={{
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #DBEAFE",
        position: "relative",
        height: 200,
        backgroundColor: "#EFF6FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        flexShrink: 0,
      }}>
        {/* SVG map */}
        <svg width="342" height="200" viewBox="0 0 342 200" style={{ position: "absolute", inset: 0 }}>
          {/* Grid */}
          {Array.from({ length: 9 }).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 25} x2={342} y2={i * 25} stroke="#DBEAFE" strokeWidth={1} />)}
          {Array.from({ length: 14 }).map((_, i) => <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={200} stroke="#DBEAFE" strokeWidth={1} />)}
          {/* Buildings */}
          <rect x={20} y={20} width={65} height={38} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          <rect x={100} y={15} width={85} height={52} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          <rect x={205} y={28} width={55} height={36} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          <rect x={280} y={22} width={45} height={30} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          {/* Target building E-204 */}
          <rect x={20} y={120} width={105} height={62} rx={5} fill="#93C5FD" stroke="#3B82F6" strokeWidth={2.5}/>
          <text x={72} y={156} textAnchor="middle" fontSize={12} fontWeight="700" fill="#1D4ED8">E-204</text>
          <rect x={145} y={128} width={72} height={48} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          <rect x={235} y={122} width={90} height={58} rx={5} fill="#BFDBFE" stroke="#93C5FD" strokeWidth={1.5}/>
          {/* Road */}
          <rect x={0} y={85} width={342} height={28} fill="#E0E7FF" opacity={0.9}/>
          <line x1={0} y1={99} x2={342} y2={99} stroke="white" strokeWidth={1.5} strokeDasharray="12 8"/>
        </svg>

        {/* Concentric rings + dot (centered at E-204) */}
        <div style={{ position: "absolute", left: 72, top: 152, transform: "translate(-50%,-50%)" }}>
          {[64, 44, 26].map((sz, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              style={{
                position: "absolute",
                width: sz,
                height: sz,
                borderRadius: "50%",
                border: `2px solid rgba(59,130,246,${0.3 + i * 0.2})`,
                backgroundColor: `rgba(59,130,246,${0.04 + i * 0.06})`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
              }}
            />
          ))}
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#3B82F6", border: "3px solid white", boxShadow: "0 2px 10px rgba(59,130,246,0.6)", position: "relative", zIndex: 10 }} />
        </div>

        {/* Label */}
        <div style={{ position: "absolute", top: 10, right: 10, backgroundColor: "white", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#1D4ED8", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          Aula E-204
        </div>
      </div>

      {/* Status chip */}
      <div style={{
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22C55E", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Dentro del rango permitido</div>
          <div style={{ fontSize: 11, color: "#22C55E", marginTop: 1 }}>Distancia al aula: ~12 metros</div>
        </div>
      </div>

      <div style={{ marginTop: "auto" as const, display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={handleAllow}
          disabled={locating}
          style={{
            padding: "15px",
            borderRadius: 12,
            border: "none",
            backgroundColor: locating ? "#9CA3AF" : C.charcoal,
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: locating ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "background-color 0.2s",
          }}
        >
          {locating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ width: 17, height: 17, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%" }}
              />
              Verificando ubicación…
            </>
          ) : (
            <>
              <MapPin size={16} />
              Permitir ubicación
            </>
          )}
        </button>
        <div style={{ fontSize: 11, color: C.gray, textAlign: "center" as const, lineHeight: 1.7 }}>
          🔒 Tu ubicación solo se usa para verificar asistencia<br />y no se almacena ni comparte.
        </div>
      </div>
    </div>
  );
}

/* ─── Screen 4: Success ─── */
const RECEIPT = [
  { label: "Materia", value: "Programación Web" },
  { label: "Grupo", value: "7A-TIC" },
  { label: "Aula", value: "E-204" },
  { label: "Hora de registro", value: "07:14:32" },
  { label: "Estado", value: "✓ Presente", color: "#16A34A" },
];

function SuccessScreen({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: C.white, padding: "24px 24px 36px", alignItems: "center" }}>
      {/* Checkmark */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.1 }}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            backgroundColor: "#DCFCE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={56} color="#16A34A" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ textAlign: "center" as const }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, marginBottom: 6, letterSpacing: "-0.01em" }}>¡Asistencia registrada!</div>
          <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>Tu asistencia fue confirmada exitosamente</div>
        </motion.div>
      </div>

      {/* Receipt */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          width: "100%",
          backgroundColor: "#F9FAFB",
          borderRadius: 14,
          padding: "18px 18px 14px",
          border: "1px solid rgba(0,0,0,0.07)",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, color: C.gray, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 14 }}>
          Comprobante de asistencia
        </div>
        {RECEIPT.map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: i < RECEIPT.length - 1 ? 10 : 0,
              marginBottom: i < RECEIPT.length - 1 ? 10 : 0,
              borderBottom: i < RECEIPT.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
            }}
          >
            <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: color || C.charcoal }}>{value}</span>
          </div>
        ))}
        <div style={{ textAlign: "center" as const, marginTop: 12, paddingTop: 10, borderTop: "1px dashed rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize: 10, color: "#D1D5DB", fontVariantNumeric: "tabular-nums" }}>
            Folio: QR-2026-0513-07143-2A
          </span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}
      >
        <button style={{
          padding: "14px",
          borderRadius: 12,
          border: "none",
          backgroundColor: C.charcoal,
          color: "white",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          <History size={16} />
          Ver historial de asistencias
        </button>
        <button
          onClick={onReset}
          style={{
            padding: "13px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            backgroundColor: "transparent",
            color: "#6B7280",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Nueva sesión
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Main export ─── */
const LABELS: Record<Screen, string> = {
  1: "Inicio de sesión",
  2: "Escáner QR",
  3: "Validación GPS",
  4: "Confirmación",
};

export function StudentMobile() {
  const [screen, setScreen] = useState<Screen>(1);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.bg,
      padding: "32px 16px 40px",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        {([1, 2, 3, 4] as Screen[]).map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            title={LABELS[s]}
            style={{
              width: s === screen ? 28 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              backgroundColor: s === screen ? C.charcoal : s < screen ? "#6B7280" : "#D1D5DB",
              transition: "all 0.3s ease",
              padding: 0,
            }}
          />
        ))}
        <span style={{ marginLeft: 6, fontSize: 12, color: C.gray, fontWeight: 500 }}>{LABELS[screen]}</span>
      </div>

      {/* Phone shell */}
      <div style={{
        width: 390,
        height: 760,
        borderRadius: 44,
        overflow: "hidden",
        boxShadow: "0 0 0 12px #2C2C2A, 0 0 0 14px rgba(44,44,42,0.3), 0 30px 90px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: screen === 2 ? "#0D0D0D" : C.white,
      }}>
        {/* Status bar */}
        <StatusBar dark={screen === 2} />

        {/* Screen content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {screen === 1 && <LoginScreen onNext={() => setScreen(2)} />}
            {screen === 2 && <ScannerScreen onNext={() => setScreen(3)} />}
            {screen === 3 && <GPSScreen onNext={() => setScreen(4)} />}
            {screen === 4 && <SuccessScreen onReset={() => setScreen(1)} />}
          </motion.div>
        </AnimatePresence>

        {/* Home indicator */}
        <div style={{
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: screen === 2 ? "#0D0D0D" : C.white,
          flexShrink: 0,
        }}>
          <div style={{ width: 120, height: 5, borderRadius: 3, backgroundColor: screen === 2 ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
        </div>
      </div>

      <p style={{ marginTop: 18, fontSize: 12, color: C.gray, textAlign: "center" as const }}>
        Toca los puntos para navegar entre pantallas
      </p>
    </div>
  );
}
