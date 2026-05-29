import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.session import SesionActiva, SesionClase
from app.tasks.cleanup import cleanup_stale_sessions

@pytest.mark.asyncio
async def test_cleanup_stale_sessions():
    # 1. Insert a zombie session with created_at > 3 hours ago
    async with AsyncSessionLocal() as db:
        # Buscamos alguna sesión existente o creamos una
        sa_result = await db.execute(select(SesionActiva).limit(1))
        sesion_activa = sa_result.scalar_one_or_none()
        if not sesion_activa:
            pytest.skip("No hay sesión activa para probar cleanup")
        
        # Guardar ID original para validacion posterior
        target_sesion_id = sesion_activa.sesion_id
        
        # Asegurarnos de que SesionClase.activa = True
        sesion_clase = await db.get(SesionClase, target_sesion_id)
        if not sesion_clase.activa:
            sesion_clase.activa = True
            db.add(sesion_clase)
            await db.commit()
            
        # Simular que es muy vieja
        old_time = datetime.now() - timedelta(hours=4)
        sesion_activa.creado_at = old_time
        db.add(sesion_activa)
        await db.commit()
        
    # 2. Ejecutar la función de limpieza
    await cleanup_stale_sessions()
    
    # 3. Verificar que se haya limpiado de la BD
    async with AsyncSessionLocal() as db:
        # La SesionActiva debió ser borrada
        sa_result = await db.execute(select(SesionActiva).where(SesionActiva.sesion_id == target_sesion_id))
        sa_cleaned = sa_result.scalar_one_or_none()
        
        assert sa_cleaned is None, "La SesionActiva zombie no fue borrada"
        
        # La SesionClase debió ser marcada inactiva
        sc_cleaned = await db.get(SesionClase, target_sesion_id)
        assert sc_cleaned.activa is False, "La SesionClase no fue marcada como inactiva"
