# Proposal: Integridad de Datos y Seguridad en Endpoints Críticos (Asistencia)

## Contexto y Riesgos Actuales

El sistema SGA-QR depende de un endpoint altamente crítico (`/api/student/attend`) para que los alumnos registren su asistencia mediante códigos QR rotativos (TOTP). Actualmente, este endpoint presenta dos vulnerabilidades mayores:

1. **Race Conditions (Condiciones de Carrera)**:
   El flujo de validación sigue el patrón *Time of Check to Time of Use (TOCTOU)*. El sistema primero consulta si existe una asistencia para el alumno en la sesión (`SELECT ...`) y, de no ser así, la inserta (`INSERT ...`). Si el mismo alumno envía la petición dos veces exactamente al mismo tiempo (ej. por latencia de red, clic doble, o manipulación deliberada), ambos hilos podrían superar la validación antes de que se registre el primer `INSERT`, creando **registros de asistencia duplicados** en la base de datos.
   *Riesgo*: Corrupción de datos, estadísticas erróneas e inconsistencias en la capa analítica.

2. **Ausencia de Rate Limiting (Ataques de Fuerza Bruta)**:
   Dado que los tokens TOTP son numéricos y tienen una ventana de validez corta (15s), un actor malicioso podría automatizar miles de peticiones HTTP POST por segundo probando múltiples combinaciones (`000000` a `999999`) con el objetivo de adivinar el token activo de una sesión y registrar asistencias falsas (o provocar denegación de servicio por agotamiento de CPU verificando hashes/tokens).
   *Riesgo*: Falsificación de registros de asistencia y potencial Denegación de Servicio (DoS).

## Solución Propuesta

- **Mitigación de Concurrencia**: Delegar la integridad a la base de datos mediante la creación de un `UniqueConstraint` en SQLAlchemy para la dupla `(sesion_id, estudiante_id)` en la tabla `asistencias`. Además de manejar el error `IntegrityError` en la capa de la API devolviendo un `HTTP_409_CONFLICT`.
- **Mitigación de Rate Limiting**: Implementar un middleware o dependencia de **Rate Limiting** usando la librería estándar del ecosistema FastAPI (`slowapi` sobre memoria o, como alternativa nativa, un control basado en memoria/diccionarios con limpieza automática o en DB) restringiendo el endpoint de asistencia a un máximo de **5 peticiones por minuto por estudiante (o IP)**.
