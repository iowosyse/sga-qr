from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.session import SesionClase
from app.services.auth import decode_token
from app.services.realtime import manager

router = APIRouter()


@router.websocket("/ws/session/{session_id}")
async def websocket_session(
    websocket: WebSocket,
    session_id: int,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload or payload.get("rol") != "docente":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(SesionClase).where(SesionClase.id == session_id))
        sesion = result.scalar_one_or_none()

        from app.models.user import Usuario
        user_result = await db.execute(
            select(Usuario).where(Usuario.no_control == payload.get("sub"))
        )
        user = user_result.scalar_one_or_none()

    if not sesion or not user or sesion.docente_id != user.id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(session_id, websocket)
    try:
        while True:
            try:
                data = await websocket.receive_json()
                if isinstance(data, dict) and data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except ValueError:
                # Si no es un JSON válido, simplemente lo ignoramos para no caer
                pass
    except WebSocketDisconnect:
        await manager.disconnect(session_id, websocket)
