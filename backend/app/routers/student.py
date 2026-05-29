from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.database import get_async_session
from app.models.academic import Aula, Grupo, Horario, Inscripcion, Materia
from app.models.attendance import Asistencia
from app.models.session import SesionActiva, SesionClase
from app.models.user import Usuario
from app.schemas.student import AttendRequest, AttendResponse, SessionInfoResponse
from app.services.auth import get_current_user
from app.services.geofencing import esta_en_rango
from app.services.realtime import manager
from app.services.totp import validar_token

router = APIRouter()
bearer = HTTPBearer()


@router.get("/session-info", response_model=SessionInfoResponse)
async def get_session_info(
    token_qr: str,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Public endpoint — no student auth required.
    Returns teacher geofence center and class info for a given QR token.
    Used by the student map before confirming attendance.
    """
    all_active = await db.execute(select(SesionActiva))
    sesion_activa = None
    for sa in all_active.scalars().all():
        if validar_token(sa.totp_secret, token_qr):
            sesion_activa = sa
            break

    if not sesion_activa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR inválido o expirado")

    sesion = await db.get(SesionClase, sesion_activa.sesion_id)
    if not sesion or not sesion.activa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no activa")

    horario_result = await db.execute(select(Horario).where(Horario.id == sesion.horario_id))
    horario = horario_result.scalar_one()
    grupo_result = await db.execute(select(Grupo).where(Grupo.id == horario.grupo_id))
    grupo = grupo_result.scalar_one()
    materia_result = await db.execute(select(Materia).where(Materia.id == grupo.materia_id))
    materia = materia_result.scalar_one()
    aula_result = await db.execute(select(Aula).where(Aula.id == horario.aula_id))
    aula = aula_result.scalar_one()

    return SessionInfoResponse(
        lat_docente=float(sesion_activa.lat_centro) if sesion_activa.lat_centro is not None else None,
        lng_docente=float(sesion_activa.lng_centro) if sesion_activa.lng_centro is not None else None,
        radio_metros=sesion_activa.radio_metros,
        materia=materia.nombre,
        grupo=grupo.nombre,
        aula=aula.nombre,
    )


async def _require_estudiante(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_async_session),
) -> Usuario:
    user = await get_current_user(credentials.credentials, db)
    if user.rol != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso solo para estudiantes")
    return user


from app.services.ratelimiter import attend_rate_limiter

@router.post("/attend", response_model=AttendResponse)
async def attend(
    body: AttendRequest,
    estudiante: Usuario = Depends(_require_estudiante),
    db: AsyncSession = Depends(get_async_session),
    _: None = Depends(attend_rate_limiter),
):
    # 1. Find sesion_activa whose secret validates the token
    all_active = await db.execute(select(SesionActiva))
    sesion_activa = None
    for sa in all_active.scalars().all():
        if validar_token(sa.totp_secret, body.token_qr):
            sesion_activa = sa
            break

    if not sesion_activa:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Código QR inválido o expirado",
        )

    # 2. Verify sesion_clase is active
    sesion = await db.get(SesionClase, sesion_activa.sesion_id)
    if not sesion or not sesion.activa:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La sesión de clase ya fue cerrada",
        )

    # 3. Verify student is enrolled
    horario_result = await db.execute(
        select(Horario).where(Horario.id == sesion.horario_id)
    )
    horario = horario_result.scalar_one()

    inscripcion = await db.execute(
        select(Inscripcion).where(
            Inscripcion.estudiante_id == estudiante.id,
            Inscripcion.grupo_id == horario.grupo_id,
            Inscripcion.activo == True,
        )
    )
    if not inscripcion.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No estás inscrito en esta clase",
        )

    # 4. Verify no duplicate attendance
    dup = await db.execute(
        select(Asistencia).where(
            Asistencia.sesion_id == sesion.id,
            Asistencia.estudiante_id == estudiante.id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tu asistencia ya fue registrada",
        )

    # 5. Geofence validation — coordinates evaluated here, never persisted
    if sesion_activa.lat_centro is None or sesion_activa.lng_centro is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La sesión no tiene ubicación de geofence configurada",
        )

    dentro, distancia = esta_en_rango(
        lat_alumno=body.lat,
        lng_alumno=body.lng,
        lat_docente=float(sesion_activa.lat_centro),
        lng_docente=float(sesion_activa.lng_centro),
        radio_metros=float(sesion_activa.radio_metros),
    )
    if not dentro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Estás fuera del rango del aula ({distancia:.0f}m, máximo {sesion_activa.radio_metros}m)",
        )

    # 6. Register attendance — without lat/lng
    now = datetime.now()
    asistencia = Asistencia(
        sesion_id=sesion.id,
        estudiante_id=estudiante.id,
        timestamp=now,
        metodo="qr",
        estado="presente",
    )
    db.add(asistencia)
    
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tu asistencia ya fue registrada simultáneamente.",
        )

    # 7. Get session details for response
    grupo_result = await db.execute(select(Grupo).where(Grupo.id == horario.grupo_id))
    grupo = grupo_result.scalar_one()

    materia_result = await db.execute(select(Materia).where(Materia.id == grupo.materia_id))
    materia = materia_result.scalar_one()

    aula_result = await db.execute(select(Aula).where(Aula.id == horario.aula_id))
    aula = aula_result.scalar_one()

    # 8. Broadcast WebSocket event
    await manager.broadcast_to_session(
        sesion.id,
        {
            "type": "attendance",
            "estudiante_id": estudiante.id,
            "no_control": estudiante.no_control,
            "nombre": estudiante.nombre_completo,
            "timestamp": now.isoformat(),
            "estado": "presente",
        },
    )

    # 9. Return confirmation
    return AttendResponse(
        ok=True,
        mensaje=f"¡Asistencia registrada correctamente en {materia.nombre}!",
        materia=materia.nombre,
        grupo=grupo.nombre,
        aula=aula.nombre,
        timestamp=now,
    )
