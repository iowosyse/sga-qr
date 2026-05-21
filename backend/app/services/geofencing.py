import math


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def esta_en_rango(
    lat_alumno: float,
    lng_alumno: float,
    lat_docente: float,
    lng_docente: float,
    radio_metros: float = 50.0,
) -> tuple[bool, float]:
    """Returns (dentro_de_rango, distancia_metros). Coordinates are never persisted."""
    distancia = haversine(lat_alumno, lng_alumno, lat_docente, lng_docente)
    return distancia <= radio_metros, distancia
