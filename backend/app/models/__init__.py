from app.models.user import Usuario, IntentoLogin
from app.models.academic import Materia, Aula, Grupo, Horario, Inscripcion
from app.models.session import SesionClase, SesionActiva
from app.models.attendance import Asistencia, Justificante

__all__ = [
    "Usuario", "IntentoLogin",
    "Materia", "Aula", "Grupo", "Horario", "Inscripcion",
    "SesionClase", "SesionActiva",
    "Asistencia", "Justificante",
]
