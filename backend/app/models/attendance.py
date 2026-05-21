from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base


class Asistencia(Base):
    __tablename__ = "asistencias"

    id            = Column(Integer, primary_key=True)
    sesion_id     = Column(Integer, ForeignKey("sesiones_clase.id"))
    estudiante_id = Column(Integer, ForeignKey("usuarios.id"))
    timestamp     = Column(DateTime, server_default=func.now(), nullable=False)
    metodo        = Column(String(10), nullable=False, default="qr")
    estado        = Column(String(15), nullable=False, default="presente")


class Justificante(Base):
    __tablename__ = "justificantes"

    id            = Column(Integer, primary_key=True)
    asistencia_id = Column(Integer, ForeignKey("asistencias.id"))
    archivo_path  = Column(String(255))
    estado        = Column(String(15), nullable=False, default="pendiente")
    revisor_id    = Column(Integer, ForeignKey("usuarios.id"))
    created_at    = Column(DateTime, server_default=func.now(), nullable=False)
