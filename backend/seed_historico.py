"""
seed_historico.py — Siembra datos historicos del semestre para SGA-QR.
Ejecutar desde: python backend/seed_historico.py

El grupo IS/8A se almacena como nombre='8A' en la BD.
Los no_control 23121001-23121005 ya existen; se saltan silenciosamente.
Los no_control 23121006-23121011 se insertan como nuevos estudiantes.
"""

import asyncio
import asyncpg
import ssl
import os
import random
from datetime import date, datetime, timedelta, time
from urllib.parse import urlparse

import bcrypt as _bcrypt
from dotenv import load_dotenv

# ── reproducibilidad ─────────────────────────────────────────────────────────
random.seed(42)

# ── entorno ──────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]

PASSWORD_HASH = _bcrypt.hashpw(b"password123", _bcrypt.gensalt(rounds=12)).decode()

# ── datos de los 10 estudiantes a intentar insertar ──────────────────────────
# Los que ya existen (23121002-23121005) se saltan via ON CONFLICT (no_control)
NEW_STUDENTS = [
    ("23121002", "SOFIA RAMIREZ HERNANDEZ",     "sofia.ramirez@itmorelia.edu.mx"),
    ("23121003", "MIGUEL ANGEL TORRES LUNA",    "miguel.torres@itmorelia.edu.mx"),
    ("23121004", "DANIELA GUTIERREZ PEREZ",     "daniela.gutierrez@itmorelia.edu.mx"),
    ("23121005", "CARLOS MENDOZA VILLA",        "carlos.mendoza2@itmorelia.edu.mx"),
    ("23121006", "VALERIA CASTRO MORA",         "valeria.castro@itmorelia.edu.mx"),
    ("23121007", "ANDRES FLORES JIMENEZ",       "andres.flores@itmorelia.edu.mx"),
    ("23121008", "ISABELLA REYES CONTRERAS",    "isabella.reyes@itmorelia.edu.mx"),
    ("23121009", "DIEGO MARTINEZ SALAZAR",      "diego.martinez@itmorelia.edu.mx"),
    ("23121010", "CAMILA RUIZ SANTOS",          "camila.ruiz@itmorelia.edu.mx"),
    ("23121011", "SEBASTIAN NUNEZ VEGA",        "sebastian.nunez@itmorelia.edu.mx"),
]

# ── semestre y feriados ───────────────────────────────────────────────────────
SEMESTER_START = date(2026, 1, 26)
SEMESTER_END   = date(2026, 5, 22)

HOLIDAYS: set[date] = {
    date(2026, 2,  2),
    date(2026, 3, 16),
    date(2026, 3, 30), date(2026, 3, 31),
    date(2026, 4,  1), date(2026, 4,  2), date(2026, 4,  3),
    date(2026, 5,  1),
}

# ── dia_semana (espanol) -> Python weekday (lunes=0) ─────────────────────────
DIA_MAP: dict[str, int] = {
    "lunes":     0, "martes":   1, "miercoles": 2, "miercoles": 2,
    "jueves":    3, "viernes":  4, "sabado":    5,
}

# ── tasas de asistencia ───────────────────────────────────────────────────────
ATTENDANCE_RATES: dict[str, float] = {
    "23121001": 0.92, "23121002": 0.92, "23121003": 0.92,
    "23121004": 0.80, "23121005": 0.80,
    "23121006": 0.80, "23121007": 0.80,
    "23121008": 0.65, "23121009": 0.65,
    "23121010": 0.55, "23121011": 0.55,
}
DEFAULT_RATE = 0.80


# ── helpers ───────────────────────────────────────────────────────────────────

def _parse_dsn(url: str) -> dict:
    clean = url.replace("postgresql+asyncpg://", "postgresql://")
    p = urlparse(clean)
    return {
        "host":     p.hostname,
        "port":     p.port or 5432,
        "user":     p.username,
        "password": p.password,
        "database": p.path.lstrip("/"),
    }


def business_days_for_weekday(weekday: int) -> list[date]:
    days: list[date] = []
    cur = SEMESTER_START
    while cur <= SEMESTER_END:
        if cur.weekday() == weekday and cur not in HOLIDAYS:
            days.append(cur)
        cur += timedelta(days=1)
    return days


def combine_dt(d: date, t: time) -> datetime:
    return datetime(d.year, d.month, d.day, t.hour, t.minute, t.second)


# ── main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    ssl_ctx = ssl.create_default_context()
    conn = await asyncpg.connect(**_parse_dsn(DATABASE_URL), ssl=ssl_ctx)
    print("[OK] Conectado a Neon\n")

    try:
        # ─────────────────────────────────────────────────────────────────────
        # PARTE 1: Estudiantes
        # ─────────────────────────────────────────────────────────────────────
        print("=== PARTE 1: Insertar estudiantes ===")

        # El grupo IS/8A esta almacenado como '8A' en la BD
        grupo_8a_id: int = await conn.fetchval(
            "SELECT id FROM grupos WHERE nombre = '8A'"
        )
        if grupo_8a_id is None:
            raise RuntimeError("Grupo '8A' no encontrado.")

        grupo_test_id: int | None = await conn.fetchval(
            "SELECT id FROM grupos WHERE nombre = 'TEST'"
        )

        usuarios_insertados = 0
        inscripciones_8a    = 0
        inscripciones_test  = 0

        for no_ctrl, nombre, email in NEW_STUDENTS:
            # INSERT usuario — ON CONFLICT (no_control) salta si ya existe
            await conn.execute(
                """
                INSERT INTO usuarios
                    (no_control, nombre_completo, email, password_hash, rol, activo)
                VALUES ($1, $2, $3, $4, 'estudiante', true)
                ON CONFLICT (no_control) DO NOTHING
                """,
                no_ctrl, nombre, email, PASSWORD_HASH,
            )
            usuarios_insertados += 1

            uid: int = await conn.fetchval(
                "SELECT id FROM usuarios WHERE no_control = $1", no_ctrl
            )

            # inscripcion en 8A — WHERE NOT EXISTS para evitar duplicados
            r = await conn.fetchval(
                """
                INSERT INTO inscripciones
                    (estudiante_id, grupo_id, fecha_inscripcion, activo)
                SELECT $1, $2, $3, true
                WHERE NOT EXISTS (
                    SELECT 1 FROM inscripciones
                    WHERE estudiante_id = $1 AND grupo_id = $2
                )
                RETURNING id
                """,
                uid, grupo_8a_id, date(2026, 1, 26),
            )
            if r:
                inscripciones_8a += 1

            # inscripcion en TEST
            if grupo_test_id is not None:
                r2 = await conn.fetchval(
                    """
                    INSERT INTO inscripciones
                        (estudiante_id, grupo_id, fecha_inscripcion, activo)
                    SELECT $1, $2, $3, true
                    WHERE NOT EXISTS (
                        SELECT 1 FROM inscripciones
                        WHERE estudiante_id = $1 AND grupo_id = $2
                    )
                    RETURNING id
                    """,
                    uid, grupo_test_id, date(2026, 1, 26),
                )
                if r2:
                    inscripciones_test += 1

        # contar total de estudiantes en 8A ahora
        total_en_8a = await conn.fetchval(
            "SELECT COUNT(*) FROM inscripciones WHERE grupo_id = $1 AND activo = true",
            grupo_8a_id,
        )
        print(f"  Intentos insercion usuario : {usuarios_insertados}")
        print(f"  Inscripciones nuevas 8A    : {inscripciones_8a}")
        print(f"  Total estudiantes en 8A    : {total_en_8a}")
        if grupo_test_id:
            print(f"  Inscripciones nuevas TEST  : {inscripciones_test}")
        else:
            print("  Grupo TEST no encontrado - omitido")

        # ─────────────────────────────────────────────────────────────────────
        # PARTE 2: Sesiones del semestre
        # ─────────────────────────────────────────────────────────────────────
        print("\n=== PARTE 2: Generar sesiones del semestre ===")

        horarios = await conn.fetch(
            """
            SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin,
                   g.docente_id, m.nombre AS materia_nombre
            FROM horarios h
            JOIN grupos   g ON g.id = h.grupo_id
            JOIN materias m ON m.id = g.materia_id
            WHERE h.grupo_id = $1
            """,
            grupo_8a_id,
        )
        if not horarios:
            raise RuntimeError("No se encontraron horarios para el grupo 8A.")

        docente_id: int = horarios[0]["docente_id"]
        sesiones_por_materia: dict[str, int] = {}
        # lista de (sesion_id, inicio_at) para la parte 3
        sesion_ids: list[tuple[int, datetime]] = []

        for h in horarios:
            dia_str = h["dia_semana"].lower().strip()
            weekday = DIA_MAP.get(dia_str)
            if weekday is None:
                print(f"  [WARN] dia_semana desconocido: '{h['dia_semana']}' - omitido")
                continue

            days    = business_days_for_weekday(weekday)
            materia = h["materia_nombre"]
            count   = 0

            for d in days:
                inicio = combine_dt(d, h["hora_inicio"])
                fin    = combine_dt(d, h["hora_fin"])

                # INSERT solo si no existe sesion para este horario+fecha
                sid: int | None = await conn.fetchval(
                    """
                    INSERT INTO sesiones_clase
                        (horario_id, docente_id, fecha, inicio_at, fin_at, activa)
                    SELECT $1, $2, $3, $4, $5, false
                    WHERE NOT EXISTS (
                        SELECT 1 FROM sesiones_clase
                        WHERE horario_id = $1 AND fecha = $3
                    )
                    RETURNING id
                    """,
                    h["id"], docente_id, d, inicio, fin,
                )
                if sid is not None:
                    sesion_ids.append((sid, inicio))
                    count += 1
                else:
                    # ya existia — recuperar id para la parte 3
                    existing_id: int = await conn.fetchval(
                        "SELECT id FROM sesiones_clase WHERE horario_id = $1 AND fecha = $2",
                        h["id"], d,
                    )
                    if existing_id:
                        sesion_ids.append((existing_id, inicio))

            sesiones_por_materia[materia] = sesiones_por_materia.get(materia, 0) + count

        total_sesiones = sum(sesiones_por_materia.values())
        print(f"  Sesiones nuevas insertadas : {total_sesiones}")
        for mat, cnt in sesiones_por_materia.items():
            print(f"    {mat}: {cnt} sesiones")
        print(f"  Total sesiones para asistencias: {len(sesion_ids)}")

        # ─────────────────────────────────────────────────────────────────────
        # PARTE 3: Registros de asistencia
        # ─────────────────────────────────────────────────────────────────────
        print("\n=== PARTE 3: Registros de asistencia ===")

        estudiantes = await conn.fetch(
            """
            SELECT u.id, u.no_control
            FROM inscripciones i
            JOIN usuarios u ON u.id = i.estudiante_id
            WHERE i.grupo_id = $1 AND i.activo = true
            ORDER BY u.no_control
            """,
            grupo_8a_id,
        )

        conteo_presente: dict[int, int] = {e["id"]: 0 for e in estudiantes}
        conteo_total:    dict[int, int] = {e["id"]: 0 for e in estudiantes}
        asistencias_insertadas = 0

        for sesion_id, inicio_at in sesion_ids:
            for est in estudiantes:
                eid     = est["id"]
                no_ctrl = est["no_control"]
                rate    = ATTENDANCE_RATES.get(no_ctrl, DEFAULT_RATE)
                asiste  = random.random() < rate
                estado  = "presente" if asiste else "ausente"
                metodo  = "qr" if asiste else "manual"
                offset  = random.randint(0, 600)
                ts      = inicio_at + timedelta(seconds=offset)

                # INSERT solo si no existe registro para esta sesion+estudiante
                r = await conn.fetchval(
                    """
                    INSERT INTO asistencias
                        (sesion_id, estudiante_id, timestamp, metodo, estado)
                    SELECT $1, $2, $3, $4, $5
                    WHERE NOT EXISTS (
                        SELECT 1 FROM asistencias
                        WHERE sesion_id = $1 AND estudiante_id = $2
                    )
                    RETURNING id
                    """,
                    sesion_id, eid, ts, metodo, estado,
                )
                if r:
                    asistencias_insertadas += 1

                conteo_total[eid]   += 1
                if asiste:
                    conteo_presente[eid] += 1

        print(f"  Registros insertados: {asistencias_insertadas}")

        # ─────────────────────────────────────────────────────────────────────
        # RESUMEN
        # ─────────────────────────────────────────────────────────────────────
        print("\n=== RESUMEN ===")
        print(f"  Sesiones generadas     : {total_sesiones}")
        print(f"  Registros asistencia   : {asistencias_insertadas}")
        print()
        print(f"  {'No.Control':<12} {'Nombre':<38} {'Pres':>5} {'Tot':>5} {'%':>6}")
        print(f"  {'-'*12} {'-'*38} {'-'*5} {'-'*5} {'-'*6}")

        for est in estudiantes:
            eid    = est["id"]
            nc     = est["no_control"]
            nombre = await conn.fetchval(
                "SELECT nombre_completo FROM usuarios WHERE id = $1", eid
            )
            pres  = conteo_presente[eid]
            total = conteo_total[eid]
            pct   = (pres / total * 100) if total else 0
            # truncar nombre a 38 chars para alineacion
            n38   = (nombre or "")[:38]
            print(f"  {nc:<12} {n38:<38} {pres:>5} {total:>5} {pct:>5.1f}%")

    finally:
        await conn.close()
        print("\n[OK] Conexion cerrada.")


if __name__ == "__main__":
    asyncio.run(main())
