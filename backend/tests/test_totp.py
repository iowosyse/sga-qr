import pytest
from freezegun import freeze_time
from datetime import datetime, timedelta
from app.services.totp import generar_secret, generar_token, validar_token

def test_totp_expiration_strictness():
    secret = generar_secret()
    
    # 1. Congelamos el tiempo en T_0
    initial_time = datetime(2026, 1, 1, 12, 0, 0)
    
    with freeze_time(initial_time):
        token_t0 = generar_token(secret)
        
        # Validar en el mismo segundo debe ser VERDADERO
        assert validar_token(secret, token_t0) is True, "Token must be valid at T+0s"

    # 2. Validar el token a los 14 segundos (Aún en la ventana primaria)
    with freeze_time(initial_time + timedelta(seconds=14)):
        assert validar_token(secret, token_t0) is True, "Token must be valid at T+14s"

    # 3. Validar el token a los 29 segundos (En la ventana secundaria, ya que valid_window=1 da +- 15s extra)
    # PyOTP evalúa T+29 en un nuevo intervalo, pero valid_window=1 cubre el intervalo anterior!
    with freeze_time(initial_time + timedelta(seconds=29)):
        assert validar_token(secret, token_t0) is True, "Token must be valid at T+29s due to valid_window=1"

    # 4. Validar el token a los 31 segundos (T+31 ya pertenece a DOS intervalos en el futuro)
    # Con interval=15, T+31 es intervalo + 2. Como valid_window=1, esto debe FALLAR.
    with freeze_time(initial_time + timedelta(seconds=31)):
        assert validar_token(secret, token_t0) is False, "Token MUST BE INVALID at T+31s"
