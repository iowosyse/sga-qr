from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id              = Column(Integer, primary_key=True)
    no_control      = Column(String(8), unique=True, nullable=False)
    nombre_completo = Column(String(100), nullable=False)
    email           = Column(String(100), unique=True)
    password_hash   = Column(String(255), nullable=False)
    rol             = Column(String(20), nullable=False)
    activo          = Column(Boolean, nullable=False, default=True)
    created_at      = Column(DateTime, server_default=func.now(), nullable=False)


class IntentoLogin(Base):
    __tablename__ = "intentos_login"

    id         = Column(Integer, primary_key=True)
    no_control = Column(String(8), nullable=False)
    ip         = Column(String(45))
    intento_at = Column(DateTime, server_default=func.now(), nullable=False)
    exitoso    = Column(Boolean, nullable=False, default=False)
