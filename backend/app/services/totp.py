import pyotp


def generar_secret() -> str:
    return pyotp.random_base32()


def generar_token(secret: str) -> str:
    return pyotp.TOTP(secret, interval=15).now()


def validar_token(secret: str, token: str) -> bool:
    return pyotp.TOTP(secret, interval=15).verify(token, valid_window=1)
