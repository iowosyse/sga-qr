from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    horario_id: int
    lat: float
    lng: float


class StartSessionResponse(BaseModel):
    session_id: int
    qr_base64: str
    token: str
    expires_in: int


class QRResponse(BaseModel):
    qr_base64: str
    token: str
    expires_in: int


class AttendanceRecord(BaseModel):
    estudiante_id: int
    no_control: str
    nombre: str
    timestamp: Optional[datetime]
    estado: str


class SessionStats(BaseModel):
    presentes: int
    pendientes: int
    total: int
    students: list[AttendanceRecord]


class AttendanceUpdate(BaseModel):
    estado: str


class TodayClass(BaseModel):
    horario_id: int
    materia: str
    grupo: str
    aula: str
    hora_inicio: str
    hora_fin: str
    sesion_activa_id: Optional[int] = None
