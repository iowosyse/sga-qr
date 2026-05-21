from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import Usuario, IntentoLogin

_BLOCK_WINDOW_MINUTES = 15
_MAX_ATTEMPTS = 5


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


async def get_current_user(token: str, db: AsyncSession) -> Usuario:
    from fastapi import HTTPException, status

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    no_control: str = payload.get("sub")
    if not no_control:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    result = await db.execute(select(Usuario).where(Usuario.no_control == no_control))
    user = result.scalar_one_or_none()
    if not user or not user.activo:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")
    return user


async def is_blocked(no_control: str, db: AsyncSession) -> bool:
    window = datetime.utcnow() - timedelta(minutes=_BLOCK_WINDOW_MINUTES)
    result = await db.execute(
        select(func.count())
        .select_from(IntentoLogin)
        .where(
            IntentoLogin.no_control == no_control,
            IntentoLogin.exitoso == False,
            IntentoLogin.intento_at >= window,
        )
    )
    count = result.scalar()
    return count >= _MAX_ATTEMPTS


async def check_and_register_attempt(
    no_control: str,
    ip: Optional[str],
    exitoso: bool,
    db: AsyncSession,
) -> None:
    attempt = IntentoLogin(no_control=no_control, ip=ip, exitoso=exitoso)
    db.add(attempt)
    await db.commit()
