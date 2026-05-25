from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_async_session
from app.models.user import Usuario
from app.models.academic import Grupo, Inscripcion, Horario, Aula, Materia
from app.models.session import SesionClase
from app.models.attendance import Asistencia, Justificante
from app.services.auth import get_current_user as _get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()
bearer = HTTPBearer()


# ── Dependencies ────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_async_session),
) -> Usuario:
    return await _get_current_user(credentials.credentials, db)


# ── Schemas ─────────────────────────────────────────────────────────────────

class JustificanteInfo(BaseModel):
    id: int
    estado: str
    motivo_rechazo: Optional[str]


class AusenciaInfo(BaseModel):
    asistencia_id: int
    fecha: str
    materia: str
    hora_inicio: str
    justificante: Optional[JustificanteInfo]


class AusenciasResponse(BaseModel):
    ausencias: List[AusenciaInfo]


class JustificanteUpload(BaseModel):
    asistencia_id: int
    archivo_base64: str
    archivo_nombre: str


class JustificantePendiente(BaseModel):
    justificante_id: int
    estudiante_nombre: str
    estudiante_no_control: str
    fecha_ausencia: str
    materia: str
    archivo_nombre: str
    archivo_base64: str
    creado_at: str


class JustificantesResponse(BaseModel):
    pendientes: List[JustificantePendiente]


class JustificanteReview(BaseModel):
    accion: str  # "aprobar" | "rechazar"
    motivo: Optional[str]


# ── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/student/ausencias", response_model=AusenciasResponse)
async def get_student_ausencias(
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retorna todas las ausencias del estudiante autenticado.
    Incluye información del justificante si existe.
    """
    if current_user.rol != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo estudiantes pueden acceder a sus ausencias",
        )

    query = select(
        Asistencia.id,
        SesionClase.fecha,
        SesionClase.inicio_at,
        Asistencia.timestamp,
        Justificante.id,
        Justificante.estado,
        Justificante.motivo_rechazo,
    ).join(
        SesionClase, SesionClase.id == Asistencia.sesion_id
    ).outerjoin(
        Justificante, Justificante.asistencia_id == Asistencia.id
    )

    result = await session.execute(
        query.where(
            and_(
                Asistencia.estudiante_id == current_user.id,
                Asistencia.estado == "ausente",
            )
        ).order_by(SesionClase.fecha.desc())
    )
    rows = result.all()

    # Para cada ausencia, obtener la materia
    ausencias = []
    for row in rows:
        # Obtener materia
        materia_result = await session.execute(
            select(Materia.nombre).join(
                Grupo, Grupo.materia_id == Materia.id
            ).join(
                Horario, Horario.grupo_id == Grupo.id
            ).where(
                Horario.id == (
                    select(SesionClase.horario_id).where(
                        SesionClase.id == Asistencia.sesion_id
                    )
                )
            )
        )
        materia_row = materia_result.scalar()
        materia_nombre = materia_row or "Desconocida"

        justificante_info = None
        if row[4]:  # Justificante ID exists
            justificante_info = JustificanteInfo(
                id=row[4],
                estado=row[5],
                motivo_rechazo=row[6],
            )

        ausencias.append(
            AusenciaInfo(
                asistencia_id=row[0],
                fecha=str(row[1]),
                materia=materia_nombre,
                hora_inicio=row[2].strftime("%H:%M") if row[2] else "00:00",
                justificante=justificante_info,
            )
        )

    return AusenciasResponse(ausencias=ausencias)


@router.post("/student/justificante")
async def upload_justificante(
    body: JustificanteUpload,
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Permite al estudiante subir un justificante para una ausencia.
    """
    if current_user.rol != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo estudiantes pueden subir justificantes",
        )

    # Verificar que la asistencia existe y pertenece al estudiante
    asistencia_result = await session.execute(
        select(Asistencia).where(Asistencia.id == body.asistencia_id)
    )
    asistencia = asistencia_result.scalar_one_or_none()

    if not asistencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asistencia no encontrada",
        )

    if asistencia.estudiante_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes justificar asistencias ajenas",
        )

    if asistencia.estado != "ausente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo puedes justificar ausencias. Estado actual: {asistencia.estado}",
        )

    # Verificar que no existe justificante pendiente o aprobado
    existing_result = await session.execute(
        select(Justificante).where(
            and_(
                Justificante.asistencia_id == body.asistencia_id,
                Justificante.estado.in_(["pendiente", "aprobado"]),
            )
        )
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un justificante en revisión o aprobado para esta ausencia",
        )

    # Crear justificante
    justificante = Justificante(
        asistencia_id=body.asistencia_id,
        estudiante_id=current_user.id,
        archivo_base64=body.archivo_base64,
        archivo_nombre=body.archivo_nombre,
        estado="pendiente",
    )
    session.add(justificante)
    await session.commit()
    await session.refresh(justificante)

    return {
        "id": justificante.id,
        "estado": "pendiente",
        "mensaje": "Justificante enviado a revisión",
    }


@router.get("/teacher/justificantes", response_model=JustificantesResponse)
async def get_pending_justificantes(
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retorna todos los justificantes pendientes de los alumnos
    que pertenezcan a grupos del docente autenticado.
    """
    if current_user.rol != "docente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo docentes pueden revisar justificantes",
        )

    # Obtener todos los justificantes pendientes de los grupos del docente
    query = select(
        Justificante.id,
        Usuario.nombre_completo,
        Usuario.no_control,
        SesionClase.fecha,
        Materia.nombre,
        Justificante.archivo_nombre,
        Justificante.archivo_base64,
        Justificante.creado_at,
    ).join(
        Asistencia, Asistencia.id == Justificante.asistencia_id
    ).join(
        Usuario, Usuario.id == Justificante.estudiante_id
    ).join(
        SesionClase, SesionClase.id == Asistencia.sesion_id
    ).join(
        Horario, Horario.id == SesionClase.horario_id
    ).join(
        Grupo, Grupo.id == Horario.grupo_id
    ).join(
        Materia, Materia.id == Grupo.materia_id
    ).where(
        and_(
            Grupo.docente_id == current_user.id,
            Justificante.estado == "pendiente",
        )
    ).order_by(Justificante.creado_at.desc())

    result = await session.execute(query)
    rows = result.all()

    pendientes = [
        JustificantePendiente(
            justificante_id=row[0],
            estudiante_nombre=row[1],
            estudiante_no_control=row[2],
            fecha_ausencia=str(row[3]),
            materia=row[4],
            archivo_nombre=row[5],
            archivo_base64=row[6],
            creado_at=row[7].isoformat() if row[7] else "",
        )
        for row in rows
    ]

    return JustificantesResponse(pendientes=pendientes)


@router.patch("/teacher/justificante/{justificante_id}")
async def review_justificante(
    justificante_id: int,
    body: JustificanteReview,
    current_user: Usuario = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Permite al docente aprobar o rechazar un justificante.
    """
    if current_user.rol != "docente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo docentes pueden revisar justificantes",
        )

    if body.accion not in ["aprobar", "rechazar"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Acción debe ser 'aprobar' o 'rechazar'",
        )

    if body.accion == "rechazar" and not body.motivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El motivo de rechazo es obligatorio",
        )

    # Obtener justificante
    justificante_result = await session.execute(
        select(Justificante).where(Justificante.id == justificante_id)
    )
    justificante = justificante_result.scalar_one_or_none()

    if not justificante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Justificante no encontrado",
        )

    if justificante.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El justificante ya fue {justificante.estado}",
        )

    # Verificar que el alumno pertenece a un grupo del docente
    grupo_result = await session.execute(
        select(Grupo).join(
            Inscripcion, Inscripcion.grupo_id == Grupo.id
        ).where(
            and_(
                Grupo.docente_id == current_user.id,
                Inscripcion.estudiante_id == justificante.estudiante_id,
            )
        )
    )
    if not grupo_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes revisar justificantes de alumnos ajenos",
        )

    # Obtener asistencia
    asistencia_result = await session.execute(
        select(Asistencia).where(
            Asistencia.id == justificante.asistencia_id
        )
    )
    asistencia = asistencia_result.scalar_one_or_none()

    # Actualizar justificante y asistencia
    justificante.revisado_at = datetime.utcnow()
    justificante.revisor_id = current_user.id

    if body.accion == "aprobar":
        justificante.estado = "aprobado"
        asistencia.estado = "justificada"
    else:  # rechazar
        justificante.estado = "rechazado"
        justificante.motivo_rechazo = body.motivo

    session.add(justificante)
    session.add(asistencia)
    await session.commit()

    return {
        "mensaje": f"Justificante {justificante.estado} correctamente",
        "justificante_id": justificante.id,
    }