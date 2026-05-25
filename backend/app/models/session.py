from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Numeric, ForeignKey, func
from app.database import Base


class SesionClase(Base):
    __tablename__ = "sesiones_clase"

    id         = Column(Integer, primary_key=True)
    horario_id = Column(Integer, ForeignKey("horarios.id"))
    docente_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha      = Column(Date, server_default=func.current_date(), nullable=False)
    inicio_at  = Column(DateTime, server_default=func.now(), nullable=False)
    fin_at     = Column(DateTime)
    activa     = Column(Boolean, nullable=False, default=True)


class SesionActiva(Base):
    __tablename__ = "sesiones_activas"

    id           = Column(Integer, primary_key=True)
    sesion_id    = Column(Integer, ForeignKey("sesiones_clase.id"), unique=True)
    totp_secret  = Column(String(32), nullable=False)
    lat_centro   = Column(Numeric(10, 8))
    lng_centro   = Column(Numeric(11, 8))
    radio_metros = Column(Integer, nullable=False, default=15)
    creado_at    = Column(DateTime, server_default=func.now(), nullable=False)
