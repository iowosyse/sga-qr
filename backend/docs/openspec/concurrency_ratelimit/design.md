# Design: Manejo de Concurrencia y Rate Limiting

## 1. Concurrencia: UniqueConstraint vs DB-Locking

### Estrategias Evaluadas
- **Application Level Locking (Mutex/Semáforos)**: Descartado por no escalar en entornos multi-worker o balanceo de carga sin depender de infraestructuras externas como Redis (del cual actualmente carecemos).
- **Row-Level Locking en PostgreSQL (`SELECT ... FOR UPDATE`)**: Requiere bloquear la fila de `SesionClase` o `Usuario` mientras se evalúa el TOCTOU. Puede escalar y garantiza serialización, pero genera esperas y bloqueos de transacción costosos.
- **Data-Level Integrity (`UniqueConstraint`)**: La base de datos aplica una restricción estricta (`UNIQUE INDEX`) para `sesion_id` y `estudiante_id` en la tabla `asistencias`. Al realizar peticiones concurrentes, el primer hilo realiza el `INSERT` correctamente; los demás fallan instantáneamente arrojando una `IntegrityError` nativa, sin bloqueos costosos (optimistic locking implícito).

### Decisión Técnica: Data-Level Integrity
Utilizaremos `UniqueConstraint("sesion_id", "estudiante_id", name="uq_asistencia_sesion_estudiante")` en el modelo `Asistencia` de SQLAlchemy (archivo `models/attendance.py`).
1. Se generará una migración Alembic para aplicar este índice único en producción de forma atómica.
2. En el router de estudiantes (`student.py`), envolveremos el flujo de inserción en un bloque `try ... except IntegrityError`.
3. Al atrapar el `IntegrityError`, retornaremos un error HTTP controlado (`409 Conflict` o `422 Unprocessable Entity`), previniendo caídas no controladas (`500 Server Error`).

## 2. Rate Limiting: Dependencia en Memoria (Dict/Token Bucket)

### Estrategias Evaluadas
- **SlowAPI (basado en Limits)**: Estándar de facto en FastAPI. Requiere instalar librerías de terceros y agregar un decorador y handler de excepciones. Permite control a nivel IP.
- **Dependencia de FastAPI custom (Memoria)**: Usar un Diccionario en memoria que contabilice timestamps de intentos (`List[float]`) por ID de usuario. Es liviano, no requiere dependencias externas y usa un token bucket o window sliding de forma muy simple.
- **Database Tracking**: Crear una tabla `IntentosAsistencia`. Altamente persistente pero introduce gran sobrecarga en E/S de base de datos para cada simple llamada.

### Decisión Técnica: Dependencia Customizada en Memoria (FastAPI Dependency)
Crearemos un Rate Limiter como una *Dependencia* de FastAPI (ej. `RateLimiter(calls=5, period=60)`).
1. Esta dependencia interceptará la inyección del usuario autenticado y extraerá su `estudiante_id` de forma nativa.
2. Almacenará en un diccionario en memoria (ej. `dict[int, List[float]]`) un historial de los timestamps de las peticiones para la ventana de `60` segundos.
3. El deslizamiento de ventana purgará las marcas de tiempo antiguas. Si la longitud de la lista de un estudiante excede `5`, lanzará directamente un `HTTPException(429, headers={"Retry-After": "..."})`.
4. Esta solución está contenida puramente en Python/FastAPI, no añade dependencias en disco, es extremadamente veloz para el throughput exigido y sirve de mecanismo defensivo de Capa 7 sin añadir infraestructura adicional.
