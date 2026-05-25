"""
verify_seed.py - Script de verificacion de integridad de datos en SGA-QR
Ejecutar con: python backend/verify_seed.py
"""

import asyncio
import asyncpg
import ssl
from urllib.parse import urlparse
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv('.env')
DB = os.environ['DATABASE_URL']


def parse_dsn(url):
    clean = url.replace('postgresql+asyncpg://', 'postgresql://')
    p = urlparse(clean)
    return {
        'host': p.hostname,
        'port': p.port or 5432,
        'user': p.username,
        'password': p.password,
        'database': p.path.lstrip('/')
    }


async def main():
    conn = await asyncpg.connect(**parse_dsn(DB), ssl=ssl.create_default_context())

    print("VERIFICACION DE DATOS - SGA-QR")
    print("=" * 80)

    # -- GRUPOS ------------------------------------------------------------------
    grupos = await conn.fetch('SELECT id, nombre FROM grupos ORDER BY nombre')
    print(f"\nGrupos en BD: {len(grupos)}")
    for g in grupos:
        print(f"  {g['id']}: {g['nombre']}")

    # -- ESTUDIANTES POR GRUPO ---------------------------------------------------
    print("\nEstudiantes por grupo:")
    for g in grupos:
        count = await conn.fetchval(
            'SELECT COUNT(*) FROM inscripciones WHERE grupo_id = $1 AND activo = true',
            g['id']
        )
        print(f"  {g['nombre']} -> {count} alumnos")

    # -- SESIONES DEL SEMESTRE ---------------------------------------------------
    grupo_8a = await conn.fetchval("SELECT id FROM grupos WHERE nombre = '8A'")
    if grupo_8a:
        print(f"\nSesiones del semestre (grupo 8A):")

        # Total sesiones
        total_sesiones = await conn.fetchval(
            """SELECT COUNT(*) FROM sesiones_clase sc
               JOIN horarios h ON h.id = sc.horario_id
               WHERE h.grupo_id = $1""",
            grupo_8a
        )

        # Rango de fechas
        date_range = await conn.fetchrow(
            """SELECT MIN(sc.fecha), MAX(sc.fecha) FROM sesiones_clase sc
               JOIN horarios h ON h.id = sc.horario_id
               WHERE h.grupo_id = $1""",
            grupo_8a
        )

        # Sesiones sin cerrar
        unclosed = await conn.fetchval(
            """SELECT COUNT(*) FROM sesiones_clase sc
               JOIN horarios h ON h.id = sc.horario_id
               WHERE h.grupo_id = $1 AND sc.activa = true""",
            grupo_8a
        )

        print(f"  Total sesiones: {total_sesiones}")
        if date_range[0] and date_range[1]:
            print(f"  Rango: {date_range[0]} -> {date_range[1]}")
        print(f"  Sesiones sin cerrar (activa=true): {unclosed}")
        if unclosed > 0:
            print(f"  [WARN] ALERTA: {unclosed} sesiones abiertas detectadas")

    # -- ASISTENCIA POR ALUMNO ---------------------------------------------------
    if grupo_8a:
        print(f"\nPorcentaje de asistencia por alumno (grupo 8A):")

        estudiantes_data = await conn.fetch(
            """SELECT u.id, u.no_control, u.nombre_completo,
                    COUNT(DISTINCT s.id) as total_sesiones,
                    COUNT(CASE WHEN a.estado IN ('presente', 'justificada') THEN 1 END) as validas
              FROM usuarios u
              JOIN inscripciones i ON i.estudiante_id = u.id
              JOIN horarios h ON h.grupo_id = i.grupo_id
              JOIN sesiones_clase s ON s.horario_id = h.id
              LEFT JOIN asistencias a ON a.sesion_id = s.id AND a.estudiante_id = u.id
              WHERE i.grupo_id = $1 AND i.activo = true
                AND s.activa = false AND s.fin_at IS NOT NULL
              GROUP BY u.id, u.no_control, u.nombre_completo
              ORDER BY u.no_control""",
            grupo_8a
        )

        below_80 = []
        for est in estudiantes_data:
            total = est['total_sesiones'] or 0
            validas = est['validas'] or 0
            pct = (validas / total * 100) if total > 0 else 0
            print(f"  {est['no_control']} - {est['nombre_completo']}: {pct:6.1f}%")
            if pct < 80:
                below_80.append((est['nombre_completo'], pct))

        print(f"\nAlumnos por debajo del 80%: {len(below_80)}")
        for nombre, pct in sorted(below_80, key=lambda x: x[1]):
            print(f"  {nombre}: {pct:.1f}%")

    # -- JUSTIFICANTES -----------------------------------------------------------
    pendientes = await conn.fetchval(
        "SELECT COUNT(*) FROM justificantes WHERE estado = 'pendiente'"
    )
    aprobados = await conn.fetchval(
        "SELECT COUNT(*) FROM justificantes WHERE estado = 'aprobado'"
    )
    rechazados = await conn.fetchval(
        "SELECT COUNT(*) FROM justificantes WHERE estado = 'rechazado'"
    )

    print(f"\nJustificantes:")
    print(f"  Pendientes: {pendientes}")
    print(f"  Aprobados:  {aprobados}")
    print(f"  Rechazados: {rechazados}")

    # -- ALERTAS DE SESIONES --------------------------------------------------
    sessions_with_no_fin = await conn.fetchval(
        """SELECT COUNT(*) FROM sesiones_clase
           WHERE activa = false AND fin_at IS NULL"""
    )

    print(f"\nEstado de la tabla `sesiones_clase`:")
    print(f"  Con fin_at NULL y activa=false: {sessions_with_no_fin}")
    if sessions_with_no_fin > 0:
        print(f"  [WARN] ALERTA: {sessions_with_no_fin} sesiones cerradas sin fin_at")

    # -- ALERTAS DE ASISTENCIAS HUERFANAS ----------------------------------------
    orphaned = await conn.fetchval(
        """SELECT COUNT(*) FROM asistencias
           WHERE sesion_id NOT IN (SELECT id FROM sesiones_clase)"""
    )
    if orphaned > 0:
        print(f"  [WARN] ALERTA: {orphaned} registros de asistencia huerfanos detectados")

    # -- INTEGRIDAD DE FK --------------------------------------------------------
    broken_inscriptions = await conn.fetchval(
        """SELECT COUNT(*) FROM inscripciones
           WHERE estudiante_id NOT IN (SELECT id FROM usuarios)
           OR grupo_id NOT IN (SELECT id FROM grupos)"""
    )
    if broken_inscriptions > 0:
        print(f"  [WARN] ALERTA: {broken_inscriptions} inscripciones con FK rotas")

    print(f"\nVerificacion completada.")
    await conn.close()


if __name__ == '__main__':
    asyncio.run(main())
