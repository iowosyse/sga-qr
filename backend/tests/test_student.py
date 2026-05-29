import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.database import AsyncSessionLocal
from app.models.user import Usuario
from app.models.session import SesionClase, SesionActiva
from app.models.academic import Inscripcion, Horario
from app.services.auth import create_access_token
import pyotp


@pytest.mark.asyncio
async def test_concurrency_attendance_race_condition():
    # 1. Obtener datos de prueba reales
    async with AsyncSessionLocal() as db:
        # Seed data if missing
        sa_result = await db.execute(select(SesionActiva).limit(1))
        sesion_activa = sa_result.scalar_one_or_none()
        
        if not sesion_activa:
            # We need a student, teacher, materia, grupo, horario, sesion, sesion_activa
            import bcrypt
            from app.models.academic import Materia, Grupo, Aula
            
            pwd = bcrypt.hashpw("password".encode(), bcrypt.gensalt()).decode()
            estudiante = Usuario(no_control="999999", nombre_completo="Test Student", email="test@student.com", password_hash=pwd, rol="estudiante")
            docente = Usuario(no_control="888888", nombre_completo="Test Teacher", email="test@teacher.com", password_hash=pwd, rol="docente")
            db.add_all([estudiante, docente])
            await db.flush()
            
            materia = Materia(nombre="Testing", creditos=4)
            db.add(materia)
            await db.flush()
            
            grupo = Grupo(nombre="T1", materia_id=materia.id, docente_id=docente.id)
            aula = Aula(nombre="A1", capacidad=30)
            db.add_all([grupo, aula])
            await db.flush()
            
            horario = Horario(grupo_id=grupo.id, aula_id=aula.id, dia_semana=1, hora_inicio="07:00:00", hora_fin="09:00:00")
            db.add(horario)
            await db.flush()
            
            from datetime import datetime
            inscripcion = Inscripcion(estudiante_id=estudiante.id, grupo_id=grupo.id, fecha_inscripcion=datetime.now().date())
            sesion = SesionClase(docente_id=docente.id, horario_id=horario.id, activa=True)
            db.add_all([inscripcion, sesion])
            await db.flush()
            
            from app.services.totp import generar_secret
            sesion_activa = SesionActiva(sesion_id=sesion.id, totp_secret=generar_secret(), lat_centro=20.0, lng_centro=-103.0, radio_metros=50.0)
            db.add(sesion_activa)
            await db.commit()
            
        else:
            sesion = await db.get(SesionClase, sesion_activa.sesion_id)
            if not sesion.activa:
                sesion.activa = True
                db.add(sesion)
                
            inscripcion_result = await db.execute(select(Inscripcion).join(Horario, Horario.grupo_id == Inscripcion.grupo_id).where(Horario.id == sesion.horario_id).limit(1))
            inscripcion = inscripcion_result.scalar_one_or_none()
            if not inscripcion:
                # Add student to existing group
                import bcrypt
                pwd = bcrypt.hashpw("password".encode(), bcrypt.gensalt()).decode()
                estudiante = Usuario(no_control="999998", nombre_completo="Test Student 2", email="test2@student.com", password_hash=pwd, rol="estudiante")
                db.add(estudiante)
                await db.flush()
                
                horario = await db.get(Horario, sesion.horario_id)
                from datetime import datetime
                inscripcion = Inscripcion(estudiante_id=estudiante.id, grupo_id=horario.grupo_id, fecha_inscripcion=datetime.now().date())
                db.add(inscripcion)
                await db.commit()
                
            estudiante = await db.get(Usuario, inscripcion.estudiante_id)
            
            if sesion_activa.lat_centro is None:
                sesion_activa.lat_centro = 20.659698
                sesion_activa.lng_centro = -103.325414
                sesion_activa.radio_metros = 50.0
                db.add(sesion_activa)
        
        # Eliminar cualquier asistencia previa de este estudiante en esta sesión
        # para asegurar un lienzo limpio para la race condition
        from app.models.attendance import Asistencia
        await db.execute(
            Asistencia.__table__.delete().where(
                Asistencia.sesion_id == sesion.id,
                Asistencia.estudiante_id == estudiante.id
            )
        )
        await db.commit()

    # 2. Generar TOTP válido y JWT
    from app.services.totp import generar_token
    token_qr = generar_token(sesion_activa.totp_secret)
    
    jwt_token = create_access_token(data={"sub": estudiante.no_control, "rol": "estudiante"})
    
    # 3. Preparar 50 peticiones concurrentes
    headers = {"Authorization": f"Bearer {jwt_token}"}
    payload = {
        "token_qr": token_qr,
        "lat": float(sesion_activa.lat_centro) if sesion_activa.lat_centro is not None else 0.0,
        "lng": float(sesion_activa.lng_centro) if sesion_activa.lng_centro is not None else 0.0
    }

    async def make_request(client):
        return await client.post("/api/student/attend", json=payload, headers=headers)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Lanzar 50 peticiones en paralelo (race condition)
        tasks = [make_request(client) for _ in range(50)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    # 4. Validaciones
    for r in responses:
        if isinstance(r, Exception):
            print(f"Exception encountered: {r!r}")
            
    status_codes = [r.status_code for r in responses if not isinstance(r, Exception)]
    
    success_count = status_codes.count(200)
    conflict_count = len([code for code in status_codes if code in (409, 422)])

    # Debería haber exactamente 1 éxito, y 49 rechazos (por conflicto de unicidad o que ya fue registrada)
    if success_count != 1:
        for r in responses:
            if not isinstance(r, Exception) and r.status_code != 200:
                print(r.json())
                break
                
    assert success_count == 1, f"Expected 1 success, got {success_count}. Statuses: {status_codes}"
    assert conflict_count == 49, f"Expected 49 conflicts, got {conflict_count}. Statuses: {status_codes}"

    # Validar en DB que solo hay 1 registro
    async with AsyncSessionLocal() as db:
        asistencias = await db.execute(
            select(Asistencia).where(
                Asistencia.sesion_id == sesion.id,
                Asistencia.estudiante_id == estudiante.id
            )
        )
        db_records = asistencias.scalars().all()
        assert len(db_records) == 1, f"Expected 1 database record, found {len(db_records)}"

@pytest.mark.asyncio
async def test_rate_limiting_attend():
    # 1. Obtener datos de prueba
    async with AsyncSessionLocal() as db:
        sa_result = await db.execute(select(SesionActiva).limit(1))
        sesion_activa = sa_result.scalar_one_or_none()
        if not sesion_activa:
            pytest.skip("No hay sesión activa para probar rate limiting.")
            
        sesion = await db.get(SesionClase, sesion_activa.sesion_id)
        inscripcion_result = await db.execute(select(Inscripcion).join(Horario, Horario.grupo_id == Inscripcion.grupo_id).where(Horario.id == sesion.horario_id).limit(1))
        inscripcion = inscripcion_result.scalar_one_or_none()
        if not inscripcion:
            pytest.skip("No hay estudiante para probar rate limiting.")
            
        estudiante = await db.get(Usuario, inscripcion.estudiante_id)

    # 2. Setup JWT and Payload
    from app.services.auth import create_access_token
    jwt_token = create_access_token(data={"sub": estudiante.no_control, "rol": "estudiante"})
    headers = {"Authorization": f"Bearer {jwt_token}"}
    payload = {
        "token_qr": "invalid_totp_to_fail_fast",
        "lat": 0.0,
        "lng": 0.0
    }

    # 3. Mandar 6 peticiones secuenciales rápidamente
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        status_codes = []
        for _ in range(6):
            res = await client.post("/api/student/attend", json=payload, headers=headers)
            status_codes.append(res.status_code)
            
    # Las primeras 5 deben ser 422 (invalid TOTP) u otro error normal
    # La 6ta debe ser 429 Too Many Requests
    assert status_codes[5] == 429, f"Expected 429 Too Many Requests on 6th request, got {status_codes[5]}. All statuses: {status_codes}"
