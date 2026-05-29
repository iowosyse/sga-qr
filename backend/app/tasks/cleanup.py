import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.session import SesionActiva, SesionClase
from app.services.realtime import manager

logger = logging.getLogger(__name__)

async def cleanup_stale_sessions():
    """
    Busca sesiones activas cuyo actualizado_en tenga más de 3 horas y las cierra.
    """
    logger.info("Iniciando tarea de limpieza de sesiones zombie...")
    cutoff_time = datetime.now() - timedelta(hours=3)
    
    async with AsyncSessionLocal() as db:
        stmt = select(SesionActiva).where(SesionActiva.creado_at < cutoff_time)
        result = await db.execute(stmt)
        stale_sessions = result.scalars().all()
        
        count = 0
        for sa in stale_sessions:
            sesion_id = sa.sesion_id
            
            sc = await db.get(SesionClase, sesion_id)
            if sc:
                sc.activa = False
                db.add(sc)
            
            await db.delete(sa)
            
            try:
                await manager.broadcast_to_session(sesion_id, {"type": "session_closed", "reason": "timeout"})
            except Exception as e:
                logger.error(f"Error emitiendo evento websocket: {e}")
                
            count += 1
            
        if count > 0:
            await db.commit()
            logger.info(f"Limpieza terminada. {count} sesiones cerradas por inactividad.")
