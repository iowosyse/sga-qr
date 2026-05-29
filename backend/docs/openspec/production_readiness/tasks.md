# Tasks: Production Readiness (SGA QR)

## Fase 1: Pruebas Unitarias Core (Matemáticas y Temporizadores)
- [x] **Test (Rojo)**: Escribir test parametrizado en `tests/test_geofence.py` validando los límites matemáticos de la fórmula de Haversine (dentro y fuera).
- [x] **Code (Verde)**: Verificar que `esta_en_rango` en `app/services/geofencing.py` pasa la prueba (refactorizar si hay precisiones flotantes sueltas).
- [x] **Test (Rojo)**: Escribir test en `tests/test_totp.py` validando la generación estricta de tokens de 30 segundos (simulando saltos temporales).
- [x] **Code (Verde)**: Confirmar que la validación en `app/services/totp.py` respeta estrictamente la ventana actual y anterior, rechazando expirados.

## Fase 2: Cron Job de Limpieza (APScheduler)
- [x] **Instalar Dependencia**: `pip install apscheduler` y añadir a `requirements.txt`.
- [x] **Test (Rojo)**: Crear `tests/test_cleanup_task.py`. Crear en BD sesiones expiradas artificialmente, invocar la función asíncrona de limpieza y verificar que se borran de la DB y se marca la `SesionClase` en `False`.
- [x] **Code (Verde)**: Implementar la lógica SQL/ORM en `app/tasks/cleanup.py`.
- [x] **Integración**: Acoplar `AsyncIOScheduler` en el `lifespan` de FastAPI en `app/main.py`.

## Fase 3: Pruebas de Estrés (Locust)
- [x] **Instalar Dependencia**: `pip install locust` y añadir a `requirements.txt` (o en `requirements-dev.txt` si se separa).
- [x] **Script de Carga**: Crear `load_tests/locustfile.py`. Simular 50+ alumnos emitiendo peticiones `POST /api/student/attend` concurrentes.
- [x] **Ejecución Local**: Correr Locust (vía consola) y confirmar que el Rate Limiter (HTTP 429) y el `UniqueConstraint` (HTTP 409) protegen el endpoint bajo estrés sin tumbar el worker de Uvicorn. Evaluar si la BD requiere optimización del Pool.
