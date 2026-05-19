import { useState } from "react";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentMobile } from "./components/StudentMobile";

type View = "teacher" | "student";

export default function App() {
  const [view, setView] = useState<View>("teacher");

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", backgroundColor: "#F5F4EF" }}>
      {/* View switcher pill */}
      <div style={{
        position: "fixed",
        top: 14,
        right: 14,
        zIndex: 9999,
        display: "flex",
        backgroundColor: "#2C2C2A",
        borderRadius: 22,
        padding: 4,
        gap: 2,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}>
        {(
          [
            ["teacher", "🖥  Vista Docente"],
            ["student", "📱  Vista Alumno"],
          ] as [View, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "6px 16px",
              borderRadius: 18,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              backgroundColor: view === v ? "#ffffff" : "transparent",
              color: view === v ? "#2C2C2A" : "rgba(255,255,255,0.72)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "teacher" ? <TeacherDashboard /> : <StudentMobile />}
    </div>
  );
}
