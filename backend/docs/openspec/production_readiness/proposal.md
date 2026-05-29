# Proposal: Production Readiness (SGA QR)

## Contexto y Problema
El sistema actual ha consolidado sus características principales (manejo de concurrencia, rate limiting y reconexión de WebSockets). Sin embargo, de cara a un despliegue en producción existen riesgos de estabilidad a largo plazo:

1. **Sesiones Fantasma (Fugas de Estado)**: Si un docente inicia una sesión pero sufre un cierre abrupto de navegador o pierde conectividad sin emitir la señal de "cerrar sesión", el registro en `SesionActiva` permanecerá de manera indefinida, acumulando basura en la DB y manteniendo JWTs activos.
2. **Validaciones Core Críticas**: La lógica matemática de Geofencing (Haversine) y la validación temporal de códigos TOTP operan en escenarios dinámicos. Su funcionamiento ante límites estrictos (borde de la geocerca y umbrales de expiración en milisegundos) no está rigurosamente documentado mediante tests, lo que supone un riesgo de "falsos negativos" para los estudiantes.
3. **Escalabilidad y Cuellos de Botella**: WebSockets introduce persistencia por conexión. Es imperativo asegurar que los Workers (Uvicorn) y la Base de Datos puedan manejar un pico de peticiones (cientos de estudiantes escaneando el código y conectados en un marco temporal muy reducido) sin colapsar, ni disparar pánicos de conexión de DB.

## Solución Propuesta
Abordaremos las brechas mediante 3 pilares:

1. **Cron Jobs Nativos (Limpieza)**: Implementar una tarea asíncrona de fondo en el `lifespan` de FastAPI o usando `APScheduler` para escobar la DB y finalizar sesiones que excedan un límite razonable (ej. > 3 horas).
2. **TDD Core Tests**: Blindar la lógica matemática del sistema con pruebas unitarias parametrizadas (Pytest Parametrize) para validar la fórmula de Haversine bajo los márgenes teóricos y la expiración estricta de TOTPs.
3. **Load Testing (Locust)**: Desarrollar escenarios distribuidos mediante `Locust` para estresar el Handshake de WebSocket, el Request de Asistencia y las validaciones del Rate Limiting concurrentemente.

## Impacto
- **Seguridad y Rendimiento:** La DB se auto-mantiene limpia.
- **Confiabilidad:** Cero "falsos negativos" debido a asincronías matemáticas o de red.
- **Garantía QA:** Certificación empírica de escalabilidad.
