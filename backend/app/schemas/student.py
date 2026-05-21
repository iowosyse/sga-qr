from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SessionInfoResponse(BaseModel):
    lat_docente: Optional[float]
    lng_docente: Optional[float]
    radio_metros: int
    materia: str
    grupo: str
    aula: str


class AttendRequest(BaseModel):
    token_qr: str
    lat: float
    lng: float


class AttendResponse(BaseModel):
    ok: bool
    mensaje: str
    materia: str
    grupo: str
    aula: str
    timestamp: datetime
