import base64
import io
import time
from datetime import date, datetime, timedelta

import pytz
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.academic import Grupo, Horario, Aula, Materia, Inscripcion
from app.models.attendance import Asistencia
from app.models.session import SesionClase, SesionActiva
from app.models.user import Usuario
from app.schemas.teacher import (
    AttendanceRecord,
    AttendanceUpdate,
    QRResponse,
    SessionStats,
    StartSessionRequest,
    StartSessionResponse,
    TodayClass,
)
from app.services.auth import decode_token, get_current_user
from app.services.realtime import manager
from app.services.totp import generar_secret, generar_token

router = APIRouter()
bearer = HTTPBearer()

ZONA_MX = pytz.timezone("America/Mexico_City")
DIAS = {0: "lunes", 1: "martes", 2: "miercoles", 3: "jueves", 4: "viernes", 5: "sabado", 6: "domingo"}


def _ahora_mx() -> datetime:
    return datetime.now(ZONA_MX)


def _hoy_mx() -> date:
    return _ahora_mx().date()


def _make_qr_base64(token: str) -> str:
    img = qrcode.make(token)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _seconds_until_next_interval(interval: int = 15) -> int:
    return interval - (int(time.time()) % interval)


async def _require_docente(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_async_session),
) -> Usuario:
    user = await get_current_user(credentials.credentials, db)
    if user.rol != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso solo para docentes")
    return user


@router.get("/classes/today", response_model=list[TodayClass])
async def classes_today(
    all: bool = False,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    hoy_fecha = _hoy_mx()
    hoy_dia = DIAS[_ahora_mx().weekday()]

    query = (
        select(
            Horario.id.label("horario_id"),
            Materia.nombre.label("materia"),
            Grupo.nombre.label("grupo"),
            Aula.nombre.label("aula"),
            Horario.hora_inicio,
            Horario.hora_fin,
            SesionClase.id.label("sesion_activa_id"),
        )
        .join(Grupo, Horario.grupo_id == Grupo.id)
        .join(Materia, Grupo.materia_id == Materia.id)
        .join(Aula, Horario.aula_id == Aula.id)
        .outerjoin(
            SesionClase,
            and_(
                SesionClase.horario_id == Horario.id,
                SesionClase.fecha == hoy_fecha,
                SesionClase.activa == True,
            ),
        )
        .where(
            Horario.dia_semana == hoy_dia,
            Grupo.docente_id == docente.id,
        )
    )

    rows = await db.execute(query)
    classes = rows.all()
    return [
        TodayClass(
            horario_id=r.horario_id,
            materia=r.materia,
            grupo=r.grupo,
            aula=r.aula,
            hora_inicio=r.hora_inicio.strftime("%H:%M"),
            hora_fin=r.hora_fin.strftime("%H:%M"),
            sesion_activa_id=r.sesion_activa_id,
        )
        for r in classes
    ]


@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(
    body: StartSessionRequest,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    # Load horario and its group/materia to check for TEST exception
    horario_result = await db.execute(
        select(Horario).where(Horario.id == body.horario_id)
    )
    horario = horario_result.scalar_one_or_none()
    if not horario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Horario no encontrado")

    grupo_result = await db.execute(select(Grupo).where(Grupo.id == horario.grupo_id))
    grupo = grupo_result.scalar_one()
    materia_result = await db.execute(select(Materia).where(Materia.id == grupo.materia_id))
    materia = materia_result.scalar_one()

    es_test = grupo.nombre == "TEST" or materia.clave == "TEST-001"
    fecha_hoy = _hoy_mx()

    if not es_test:
        ahora_time = _ahora_mx().time()
        base = datetime.today()
        ventana_inicio = (datetime.combine(base, horario.hora_inicio) - timedelta(minutes=30)).time()
        ventana_fin   = (datetime.combine(base, horario.hora_fin)    + timedelta(minutes=30)).time()
        if not (ventana_inicio <= ahora_time <= ventana_fin):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Fuera del horario permitido. Esta clase es de "
                    f"{horario.hora_inicio.strftime('%H:%M')} a "
                    f"{horario.hora_fin.strftime('%H:%M')}. "
                    f"Solo se puede iniciar 30 minutos antes o después del horario."
                ),
            )

    # Verify no active session for this horario today
    existing = await db.execute(
        select(SesionClase).where(
            SesionClase.horario_id == body.horario_id,
            SesionClase.fecha == fecha_hoy,
            SesionClase.activa == True,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una sesión activa para este horario hoy",
        )

    sesion = SesionClase(horario_id=body.horario_id, docente_id=docente.id, fecha=fecha_hoy)
    db.add(sesion)
    await db.flush()

    secret = generar_secret()
    sesion_activa = SesionActiva(
        sesion_id=sesion.id,
        totp_secret=secret,
        lat_centro=body.lat,
        lng_centro=body.lng,
        radio_metros=15,
    )
    db.add(sesion_activa)
    await db.commit()
    await db.refresh(sesion_activa)

    token = generar_token(secret)
    qr_b64 = _make_qr_base64(token)
    expires_in = _seconds_until_next_interval()

    return StartSessionResponse(
        session_id=sesion.id,
        qr_base64=qr_b64,
        token=token,
        expires_in=expires_in,
    )


@router.get("/session/{session_id}/qr", response_model=QRResponse)
async def get_qr(
    session_id: int,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    sesion = await db.get(SesionClase, session_id)
    if not sesion or sesion.docente_id != docente.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")

    result = await db.execute(
        select(SesionActiva).where(SesionActiva.sesion_id == session_id)
    )
    sa = result.scalar_one_or_none()
    if not sa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión activa no encontrada")

    token = generar_token(sa.totp_secret)
    qr_b64 = _make_qr_base64(token)
    return QRResponse(
        qr_base64=qr_b64,
        token=token,
        expires_in=_seconds_until_next_interval(),
    )


@router.get("/session/{session_id}/stats", response_model=SessionStats)
async def get_stats(
    session_id: int,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    sesion = await db.get(SesionClase, session_id)
    if not sesion or sesion.docente_id != docente.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")

    horario_result = await db.execute(
        select(Horario).where(Horario.id == sesion.horario_id)
    )
    horario = horario_result.scalar_one()

    # All enrolled students
    enrolled = await db.execute(
        select(Usuario)
        .join(Inscripcion, Inscripcion.estudiante_id == Usuario.id)
        .where(Inscripcion.grupo_id == horario.grupo_id, Inscripcion.activo == True)
    )
    students = enrolled.scalars().all()

    # Attendance records for this session
    att_result = await db.execute(
        select(Asistencia).where(Asistencia.sesion_id == session_id)
    )
    att_map = {a.estudiante_id: a for a in att_result.scalars().all()}

    records = []
    presentes = 0
    for s in students:
        att = att_map.get(s.id)
        estado = att.estado if att else "pendiente"
        ts = att.timestamp if att else None
        if estado == "presente":
            presentes += 1
        records.append(
            AttendanceRecord(
                estudiante_id=s.id,
                no_control=s.no_control,
                nombre=s.nombre_completo,
                timestamp=ts,
                estado=estado,
            )
        )

    total = len(students)
    return SessionStats(
        presentes=presentes,
        pendientes=total - presentes,
        total=total,
        students=records,
    )


@router.post("/session/{session_id}/close")
async def close_session(
    session_id: int,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    sesion = await db.get(SesionClase, session_id)
    if not sesion or sesion.docente_id != docente.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")

    result = await db.execute(
        select(SesionActiva).where(SesionActiva.sesion_id == session_id)
    )
    sa = result.scalar_one_or_none()
    if sa:
        sa.lat_centro = None
        sa.lng_centro = None

    sesion.activa = False
    sesion.fin_at = datetime.utcnow()
    await db.commit()

    manager.close_session(session_id)
    return {"ok": True, "mensaje": "Sesión cerrada"}


@router.patch("/attendance/{asistencia_id}")
async def update_attendance(
    asistencia_id: int,
    body: AttendanceUpdate,
    docente: Usuario = Depends(_require_docente),
    db: AsyncSession = Depends(get_async_session),
):
    asistencia = await db.get(Asistencia, asistencia_id)
    if not asistencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")

    sesion = await db.get(SesionClase, asistencia.sesion_id)
    if not sesion or sesion.docente_id != docente.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permiso para modificar este registro")

    asistencia.estado = body.estado
    asistencia.metodo = "manual"
    await db.commit()
    await db.refresh(asistencia)

    estudiante = await db.get(Usuario, asistencia.estudiante_id)
    await manager.broadcast_to_session(
        asistencia.sesion_id,
        {
            "type": "attendance_updated",
            "estudiante_id": asistencia.estudiante_id,
            "no_control": estudiante.no_control if estudiante else None,
            "nombre": estudiante.nombre_completo if estudiante else None,
            "estado": asistencia.estado,
            "timestamp": asistencia.timestamp.isoformat() if asistencia.timestamp else None,
        },
    )
    return {"ok": True, "estado": asistencia.estado}
