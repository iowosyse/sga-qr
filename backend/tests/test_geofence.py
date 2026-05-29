import pytest
import math
from app.services.geofencing import haversine, esta_en_rango

# Constante para aproximar un grado de latitud a metros (aprox 111.32 km)
# Usaremos diferencias minúsculas en latitud para las pruebas.
# Si 1 grado = 111320 metros, entonces:
# 50 metros = 50 / 111320 = 0.000449155 grados

@pytest.mark.parametrize("lat_est,lng_est,expected_pass,expected_dist", [
    (20.000000, -103.000000, True, 0.0), # Exactamente en el mismo lugar
    (20.000440, -103.000000, True, 48.9), # ~48.9 metros
    (20.000449, -103.000000, True, 49.9), # ~49.9 metros (Borde exacto interior)
    (20.000451, -103.000000, False, 50.1), # ~50.1 metros (Borde exterior)
    (20.000500, -103.000000, False, 55.6), # ~55.6 metros
])
def test_geofence_haversine_boundaries(lat_est, lng_est, expected_pass, expected_dist):
    lat_doc = 20.0
    lng_doc = -103.0
    radio = 50.0
    
    dentro, distancia = esta_en_rango(lat_est, lng_est, lat_doc, lng_doc, radio)
    
    # Validamos que el resultado lógico de acceso sea el correcto
    assert dentro == expected_pass, f"Expected {expected_pass} but got {dentro} for distance {distancia}"
    
    # Validamos la exactitud matemática del margen de error (1 metro)
    assert math.isclose(distancia, expected_dist, abs_tol=1.0), f"Expected dist {expected_dist}, got {distancia}"
