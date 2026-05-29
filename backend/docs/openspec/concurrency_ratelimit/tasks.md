# Tasks: Concurrencia y Rate Limiting (TDD)

## Bloque 1: Integridad de Base de Datos (Concurrencia)
- [ ] **Test (Rojo)**: Escribir un test en `tests/test_student.py` llamado `test_concurrency_attendance_race_condition` usando la base de datos de test real. El test debe simular múltiples peticiones a `/api/student/attend` usando `asyncio.gather` para lanzar `n` peticiones en paralelo (Cero Mocks). Validar que solo un status HTTP sea `200` y el resto `409` (o `422`), y validar que la base de datos devuelva exactamente `1` registro.
- [ ] **Code (Verde)**: Añadir `UniqueConstraint("sesion_id", "estudiante_id")` en el modelo `Asistencia` (`app/models/attendance.py`).
- [ ] **Code (Verde)**: Generar una nueva migración Alembic (`alembic revision --autogenerate -m "unique constraint asistencia"`) y aplicarla a la base de datos de test (`alembic upgrade head`).
- [ ] **Code (Verde)**: Modificar el handler `/api/student/attend` atrapando la `IntegrityError` de SQLAlchemy (`from sqlalchemy.exc import IntegrityError`) y devolver un `HTTPException` coherente sin crashear el sistema. Ejecutar Pytest y confirmar que el test pase.

## Bloque 2: Limitador de Intentos (Rate Limiting)
- [ ] **Test (Rojo)**: Escribir un test en `tests/test_student.py` llamado `test_rate_limiting_attend` atacando la base real con `TestClient` o `AsyncClient`. Ejecutar 6 peticiones for in-loop hacia `/api/student/attend`. Las primeras 5 deben recibir una respuesta de procesamiento (ej. 422 QR expirado o 200 OK) y la 6ta en adelante debe recibir un estricto `HTTP_429_TOO_MANY_REQUESTS`.
- [ ] **Code (Verde)**: Crear `app/services/ratelimiter.py` que provea la clase `RateLimiter` instanciada como una dependencia inyectable (`Depends(RateLimiter(calls=5, seconds=60))`).
- [ ] **Code (Verde)**: En `app/routers/student.py`, inyectar este RateLimiter dentro del endpoint `attend` referenciando el `estudiante_id`. Confirmar que el test pase.
