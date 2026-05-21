from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.user import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import (
    check_and_register_attempt,
    create_access_token,
    is_blocked,
    verify_password,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_session),
):
    ip = request.client.host if request.client else None

    if await is_blocked(body.no_control, db):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta en 15 minutos.",
        )

    result = await db.execute(
        select(Usuario).where(Usuario.no_control == body.no_control, Usuario.activo == True)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        await check_and_register_attempt(body.no_control, ip, exitoso=False, db=db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    await check_and_register_attempt(body.no_control, ip, exitoso=True, db=db)

    token = create_access_token(
        {"sub": user.no_control, "rol": user.rol, "nombre": user.nombre_completo}
    )
    return TokenResponse(
        access_token=token,
        rol=user.rol,
        nombre=user.nombre_completo,
    )
