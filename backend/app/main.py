from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
import sys

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.teacher import router as teacher_router
from app.routers.student import router as student_router
from app.routers.websocket import router as ws_router
from app.routers.reports import router as reports_router
from app.routers.justificantes import router as justificantes_router

from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.tasks.cleanup import cleanup_stale_sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(cleanup_stale_sessions, 'interval', minutes=30)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="SGA-QR API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("="*60, file=sys.stderr, flush=True)
    print(f"UNHANDLED ERROR: {request.method} {request.url}", file=sys.stderr, flush=True)
    print(traceback.format_exc(), file=sys.stderr, flush=True)
    print("="*60, file=sys.stderr, flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )


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
app.include_router(justificantes_router, prefix="/api", tags=["justificantes"])
app.include_router(reports_router, tags=["reports"])
app.include_router(ws_router, tags=["websocket"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
