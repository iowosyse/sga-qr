from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, UniqueConstraint
from app.database import Base


class Asistencia(Base):
    __tablename__ = "asistencias"

    id            = Column(Integer, primary_key=True)
    sesion_id     = Column(Integer, ForeignKey("sesiones_clase.id"))
    estudiante_id = Column(Integer, ForeignKey("usuarios.id"))
    timestamp     = Column(DateTime, server_default=func.now(), nullable=False)
    metodo        = Column(String(10), nullable=False, default="qr")
    estado        = Column(String(15), nullable=False, default="presente")

    __table_args__ = (
        UniqueConstraint("sesion_id", "estudiante_id", name="asistencias_sesion_id_estudiante_id_key"),
    )


class Justificante(Base):
    __tablename__ = "justificantes"

    id              = Column(Integer, primary_key=True)
    asistencia_id   = Column(Integer, ForeignKey("asistencias.id"), nullable=False)
    estudiante_id   = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    archivo_base64  = Column(String, nullable=False)
    archivo_nombre  = Column(String(255), nullable=False)
    estado          = Column(String(15), nullable=False, default="pendiente")
    motivo_rechazo  = Column(String)
    creado_at       = Column(DateTime, server_default=func.now(), nullable=False)
    revisado_at     = Column(DateTime)
    revisor_id      = Column(Integer, ForeignKey("usuarios.id"))
