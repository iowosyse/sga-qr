from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.teacher import router as teacher_router
from app.routers.student import router as student_router
from app.routers.websocket import router as ws_router

app = FastAPI(title="SGA-QR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(teacher_router, prefix="/api/teacher", tags=["teacher"])
app.include_router(student_router, prefix="/api/student", tags=["student"])
app.include_router(ws_router, tags=["websocket"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
