import json
from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, session_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections[session_id].append(websocket)

    async def disconnect(self, session_id: int, websocket: WebSocket) -> None:
        conns = self.connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def broadcast_to_session(self, session_id: int, message: dict) -> None:
        dead = []
        for ws in list(self.connections.get(session_id, [])):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(session_id, ws)

    def close_session(self, session_id: int) -> None:
        self.connections.pop(session_id, None)


manager = WebSocketManager()
