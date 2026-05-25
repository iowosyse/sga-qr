import traceback
import logging
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, func, and_, case, or_, Numeric
from sqlalchemy.ext.asyncio import AsyncSession
from io import StringIO
from datetime import date, datetime
from typing import Optional, List

from app.database import get_async_session
from app.models.user import Usuario
from app.models.academic import Grupo, Inscripcion, Horario, Aula, Materia
from app.models.session import SesionClase
from app.models.attendance import Asistencia
from app.services.auth import get_current_user as _get_current_user
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])
bearer = HTTPBearer()


# ── dependency wrapper para get_current_user ─────────────────────────────────
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_async_session),
) -> Usuario:
    return await _get_current_user(credentials.credentials, db)


# ── schemas ──────────────────────────────────────────────────────────────────

class EstudianteResumen(BaseModel):
    estudiante_id: int
    no_control: str
    nombre: str
    total_sesiones: int
    asistencias: int
    ausencias: int
    porcentaje: float
    en_riesgo: bool


class PeriodoResumen(BaseModel):
    inicio: str
    fin: str


class SummaryResponse(BaseModel):
    total_sesiones: int
    periodo: PeriodoResumen
    estudiantes: List[EstudianteResumen]


class SesionResumen(BaseModel):
    id: int
    materia: str
    grupo: str
    aula: str
    fecha: str
    hora_inicio: str
    hora_fin: str
    total_alumnos: int
    presentes: int
    porcentaje: float


class SessionsResponse(BaseModel):
    sesiones: List[SesionResumen]


class GrupoInfo(BaseModel):
    id: int
    nombre: str


class GroupsResponse(BaseModel):
    grupos: List[GrupoInfo]


# ── endpoints ────────────────────────────────────────────────────────────────

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    grupo_id: Optional[int] = Query(None),
    materia_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retorna resumen de asistencia por estudiante.
    Filtrable por grupo y materia.
    """
    try:
        query = select(
            Usuario.id,
            Usuario.no_control,
            Usuario.nombre_completo,
            func.count(func.distinct(SesionClase.id)).label("total_sesiones"),
            func.count(
                case((Asistencia.estado == "presente", 1))
            ).label("asistencias"),
            func.count(
                case((Asistencia.estado == "ausente", 1))
            ).label("ausencias"),
        ).join(
            Inscripcion, Inscripcion.estudiante_id == Usuario.id
        ).join(
            Grupo, Grupo.id == Inscripcion.grupo_id
        ).join(
            Horario, Horario.grupo_id == Grupo.id
        ).join(
            SesionClase, SesionClase.horario_id == Horario.id
        ).join(
            Materia, Materia.id == Grupo.materia_id
        ).outerjoin(
            Asistencia, and_(
                Asistencia.sesion_id == SesionClase.id,
                Asistencia.estudiante_id == Usuario.id
            )
        ).where(
            and_(
                SesionClase.activa == False,
                SesionClase.fin_at.isnot(None),
                Usuario.rol == "estudiante",
                Inscripcion.activo == True,
            )
        ).group_by(
            Usuario.id,
            Usuario.no_control,
            Usuario.nombre_completo,
        )

        if grupo_id:
            query = query.where(Grupo.id == grupo_id)
        if materia_id:
            query = query.where(Materia.id == materia_id)

        result = await session.execute(query)
        rows = result.all()

        estudiantes = []
        total_sesiones_max = 0

        for row in rows:
            total = row.total_sesiones if row.total_sesiones else 0
            pres = row.asistencias if row.asistencias else 0
            ausencias = row.ausencias if row.ausencias else 0

            porcentaje = round((pres / total * 100) if total > 0 else 0, 1)
            en_riesgo = porcentaje < 80

            total_sesiones_max = max(total_sesiones_max, total)

            estudiantes.append(
                EstudianteResumen(
                    estudiante_id=row.id,
                    no_control=row.no_control,
                    nombre=row.nombre_completo,
                    total_sesiones=total,
                    asistencias=pres,
                    ausencias=ausencias,
                    porcentaje=porcentaje,
                    en_riesgo=en_riesgo,
                )
            )

        return SummaryResponse(
            total_sesiones=total_sesiones_max,
            periodo=PeriodoResumen(
                inicio="2026-01-26",
                fin="2026-05-22",
            ),
            estudiantes=estudiantes,
        )
    except Exception as e:
        import sys
        print(f"\n{'='*60}", flush=True, file=sys.stderr)
        print(f"ERROR get_summary: {e}", flush=True, file=sys.stderr)
        import traceback as tb
        tb.print_exc(file=sys.stderr)
        print(f"{'='*60}\n", flush=True, file=sys.stderr)
        raise


@router.get("/at-risk", response_model=List[EstudianteResumen])
async def get_at_risk(
    umbral: float = Query(80.0),
    grupo_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retorna solo estudiantes cuyo porcentaje de asistencia < umbral.
    Filtrable por grupo_id. Ordenado por porcentaje ASC.
    """
    try:
        query = select(
            Usuario.id,
            Usuario.no_control,
            Usuario.nombre_completo,
            func.count(func.distinct(SesionClase.id)).label("total_sesiones"),
            func.count(
                case((Asistencia.estado == "presente", 1))
            ).label("asistencias"),
            func.count(
                case((Asistencia.estado == "ausente", 1))
            ).label("ausencias"),
        ).join(
            Inscripcion, Inscripcion.estudiante_id == Usuario.id
        ).join(
            Grupo, Grupo.id == Inscripcion.grupo_id
        ).join(
            Horario, Horario.grupo_id == Grupo.id
        ).join(
            SesionClase, SesionClase.horario_id == Horario.id
        ).outerjoin(
            Asistencia, and_(
                Asistencia.sesion_id == SesionClase.id,
                Asistencia.estudiante_id == Usuario.id
            )
        ).where(
            and_(
                SesionClase.activa == False,
                SesionClase.fin_at.isnot(None),
                Usuario.rol == "estudiante",
                Inscripcion.activo == True,
            )
        )

        if grupo_id:
            query = query.where(Grupo.id == grupo_id)

        query = query.group_by(
            Usuario.id,
            Usuario.no_control,
            Usuario.nombre_completo,
        ).having(
            func.cast(
                func.count(case((Asistencia.estado == "presente", 1))) * 100.0
                / func.count(func.distinct(SesionClase.id)),
                Numeric,
            ) < umbral
        ).order_by(
            func.cast(
                func.count(case((Asistencia.estado == "presente", 1))) * 100.0
                / func.count(func.distinct(SesionClase.id)),
                Numeric,
            )
        )

        result = await session.execute(query)
        rows = result.all()

        at_risk = []
        for row in rows:
            total = row.total_sesiones if row.total_sesiones else 0
            pres = row.asistencias if row.asistencias else 0
            ausencias = row.ausencias if row.ausencias else 0
            porcentaje = round((pres / total * 100) if total > 0 else 0, 1)

            at_risk.append(
                EstudianteResumen(
                    estudiante_id=row.id,
                    no_control=row.no_control,
                    nombre=row.nombre_completo,
                    total_sesiones=total,
                    asistencias=pres,
                    ausencias=ausencias,
                    porcentaje=porcentaje,
                    en_riesgo=True,
                )
            )

        return at_risk
    except Exception as e:
        import traceback
        print("="*50)
        print(f"ERROR REAL: {e}")
        print(traceback.format_exc())
        print("="*50)
        raise


@router.get("/sessions", response_model=SessionsResponse)
async def get_sessions(
    grupo_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Lista de sesiones pasadas con estadísticas de asistencia.
    """
    query = select(
        SesionClase.id,
        Materia.nombre,
        Grupo.nombre,
        Aula.nombre,
        SesionClase.fecha,
        SesionClase.inicio_at,
        SesionClase.fin_at,
        func.count(func.distinct(Inscripcion.estudiante_id)).label("total_alumnos"),
        func.count(
            case((Asistencia.estado == "presente", 1))
        ).label("presentes"),
    ).join(
        Horario, Horario.id == SesionClase.horario_id
    ).join(
        Grupo, Grupo.id == Horario.grupo_id
    ).join(
        Materia, Materia.id == Grupo.materia_id
    ).join(
        Aula, Aula.id == Horario.aula_id
    ).join(
        Inscripcion, Inscripcion.grupo_id == Grupo.id
    ).outerjoin(
        Asistencia, and_(
            Asistencia.sesion_id == SesionClase.id,
            Asistencia.estudiante_id == Inscripcion.estudiante_id
        )
    ).where(
        and_(
            SesionClase.activa == False,
            SesionClase.fin_at.isnot(None),
            Inscripcion.activo == True,
        )
    ).group_by(
        SesionClase.id,
        Materia.nombre,
        Grupo.nombre,
        Aula.nombre,
        SesionClase.fecha,
        SesionClase.inicio_at,
        SesionClase.fin_at,
    ).order_by(
        SesionClase.fecha.desc()
    ).limit(limit)

    if grupo_id:
        query = query.where(Grupo.id == grupo_id)

    result = await session.execute(query)
    rows = result.all()

    sesiones = []
    for row in rows:
        total_alumnos = row.total_alumnos if row.total_alumnos else 0
        presentes = row.presentes if row.presentes else 0
        porcentaje = round((presentes / total_alumnos * 100) if total_alumnos > 0 else 0, 1)

        sesiones.append(
            SesionResumen(
                id=row.id,
                materia=row[1],
                grupo=row[2],
                aula=row[3],
                fecha=str(row.fecha),
                hora_inicio=row.inicio_at.strftime("%H:%M") if row.inicio_at else "00:00",
                hora_fin=row.fin_at.strftime("%H:%M") if row.fin_at else "00:00",
                total_alumnos=total_alumnos,
                presentes=presentes,
                porcentaje=porcentaje,
            )
        )

    return SessionsResponse(sesiones=sesiones)


@router.get("/export/csv")
async def export_csv(
    grupo_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Exporta datos de asistencia como archivo CSV.
    """
    query = select(
        Usuario.no_control,
        Usuario.nombre_completo,
        func.count(func.distinct(SesionClase.id)).label("total_sesiones"),
        func.count(
            case((Asistencia.estado == "presente", 1))
        ).label("asistencias"),
        func.count(
            case((Asistencia.estado == "ausente", 1))
        ).label("ausencias"),
    ).join(
        Inscripcion, Inscripcion.estudiante_id == Usuario.id
    ).join(
        Grupo, Grupo.id == Inscripcion.grupo_id
    ).join(
        Horario, Horario.grupo_id == Grupo.id
    ).join(
        SesionClase, SesionClase.horario_id == Horario.id
    ).outerjoin(
        Asistencia, and_(
            Asistencia.sesion_id == SesionClase.id,
            Asistencia.estudiante_id == Usuario.id
        )
    ).where(
        and_(
            SesionClase.activa == False,
            SesionClase.fin_at.isnot(None),
            Usuario.rol == "estudiante",
            Inscripcion.activo == True,
        )
    ).group_by(
        Usuario.id,
        Usuario.no_control,
        Usuario.nombre_completo,
    ).order_by(
        Usuario.no_control
    )

    if grupo_id:
        query = query.where(Grupo.id == grupo_id)

    result = await session.execute(query)
    rows = result.all()

    csv_buffer = StringIO()
    csv_buffer.write("No. Control,Nombre,Sesiones,Asistencias,Ausencias,Porcentaje,Estado\n")

    for row in rows:
        no_control = row.no_control
        nombre = row.nombre_completo
        total = row[2] if row[2] else 0
        asistencias = row[3] if row[3] else 0
        ausencias = row[4] if row[4] else 0
        porcentaje = round((asistencias / total * 100) if total > 0 else 0, 1)
        estado = "En riesgo" if porcentaje < 80 else "Normal"

        csv_buffer.write(
            f'"{no_control}","{nombre}",{total},{asistencias},{ausencias},{porcentaje},"{estado}"\n'
        )

    csv_content = csv_buffer.getvalue()

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=asistencia.csv"},
    )


@router.get("/groups", response_model=GroupsResponse)
async def get_groups(
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Lista todos los grupos disponibles.
    """
    query = select(Grupo.id, Grupo.nombre).order_by(Grupo.nombre)

    result = await session.execute(query)
    rows = result.all()

    grupos = [GrupoInfo(id=row.id, nombre=row.nombre) for row in rows]

    return GroupsResponse(grupos=grupos)
