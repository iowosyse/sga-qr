# Design Document: Production Readiness (Background Tasks, Core Tests & Load Testing)

## 1. Cron Job de Limpieza (Background Task)
**Enfoque Elegido**: Utilizaremos `APScheduler` (Advanced Python Scheduler) integrado en el `lifespan` de la aplicación FastAPI.
**Justificación**: 
- `FastAPI.BackgroundTasks` es excelente para disparar acciones después de un request HTTP (ej. enviar un email tras un POST), pero no para calendarizar tareas periódicas globales e independientes de peticiones.
- `APScheduler` en su modo asíncrono (`AsyncIOScheduler`) se integra de forma limpia y transparente con el Loop de Eventos nativo de `uvicorn`.

**Arquitectura**:
- Se creará un módulo `app/tasks/cleanup.py`.
- Contendrá una función asíncrona `cleanup_stale_sessions` que:
  - Creará su propia sesión de base de datos (`AsyncSessionLocal()`).
  - Buscará instancias de `SesionActiva` donde `actualizado_en` (o timestamp de creación) > `3 horas`.
  - Hará un JOIN (o query posterior) para traer la `SesionClase`.
  - Pasará `SesionClase.activa = False`.
  - Eliminará el registro en `SesionActiva`.
  - Notificará el cierre vía `manager.broadcast_to_session` con un payload de expiración para que los clientes frontend desconecten el WebSocket ordenadamente.
- En `app/main.py`, dentro del bloque `lifespan`, se instanciará y arrancará el scheduler.

## 2. Unit Tests Estrictos (Matemáticas y Tiempo)
**Enfoque Elegido**: `pytest.mark.parametrize` y la librería estándar de Python `unittest.mock` (para time-freezing temporal en la prueba de expiración).
- **Haversine**: Generaremos pruebas matemáticas puras para la función `esta_en_rango` llamándola con coordenadas flotantes conocidas. Estas pruebas *no requieren* Base de Datos ni TestClient.
- **TOTP**: La ventana es de 30 segundos. Se probarán validaciones pasando un token generado y evaluándolo localmente contra `generar_token()` modificando artificialmente la estampa de tiempo evaluada en el test.

## 3. Pruebas de Estrés (Load Testing) con Locust
**Enfoque Elegido**: Script de Python aislado usando `locust`.
**Arquitectura**:
- Se creará un directorio `backend/load_tests/` con `locustfile.py`.
- El script simulará un usuario estudiante que:
  1. Adquiere un JWT fijo (sembrado para la prueba).
  2. Abre conexión a WebSocket (requiere una librería HTTP/WebSocket compatible con locust, como `websocket-client` junto a eventos personalizados de Locust, o simular la carga HTTP pura de `/api/student/attend`). Nos centraremos primariamente en el ataque al REST API `/api/student/attend` como cuello de botella para las transacciones ACID, y opcionalmente apertura de WebSockets si el soporte de eventos lo permite fácilmente.
- Se configurará para lanzar una oleada (`spawn_rate`) de 100 usuarios por segundo hasta llegar a 500.
