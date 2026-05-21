from sqlalchemy import Column, Integer, String, Boolean, Date, Time, ForeignKey
from app.database import Base


class Materia(Base):
    __tablename__ = "materias"

    id       = Column(Integer, primary_key=True)
    nombre   = Column(String(100), nullable=False)
    clave    = Column(String(20), unique=True, nullable=False)
    semestre = Column(Integer)
    carrera  = Column(String(100))


class Aula(Base):
    __tablename__ = "aulas"

    id        = Column(Integer, primary_key=True)
    nombre    = Column(String(20), nullable=False)
    edificio  = Column(String(50))
    capacidad = Column(Integer)


class Grupo(Base):
    __tablename__ = "grupos"

    id            = Column(Integer, primary_key=True)
    materia_id    = Column(Integer, ForeignKey("materias.id"))
    docente_id    = Column(Integer, ForeignKey("usuarios.id"))
    nombre        = Column(String(10), nullable=False)
    capacidad     = Column(Integer, nullable=False, default=30)
    semestre      = Column(Integer)
    ciclo_escolar = Column(String(10))


class Horario(Base):
    __tablename__ = "horarios"

    id          = Column(Integer, primary_key=True)
    grupo_id    = Column(Integer, ForeignKey("grupos.id"))
    aula_id     = Column(Integer, ForeignKey("aulas.id"))
    dia_semana  = Column(String(10), nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin    = Column(Time, nullable=False)


class Inscripcion(Base):
    __tablename__ = "inscripciones"

    id                = Column(Integer, primary_key=True)
    estudiante_id     = Column(Integer, ForeignKey("usuarios.id"))
    grupo_id          = Column(Integer, ForeignKey("grupos.id"))
    fecha_inscripcion = Column(Date)
    activo            = Column(Boolean, nullable=False, default=True)
