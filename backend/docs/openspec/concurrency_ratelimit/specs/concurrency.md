# Spec: Prevención de Race Conditions (Concurrencia) en Asistencia

## Feature: Integridad de base de datos para Asistencias únicas

**Como** Arquitecto de Base de Datos
**Quiero** delegar el control de unicidad a la capa de almacenamiento (PostgreSQL)
**Para** evitar registros duplicados frente a peticiones simultáneas del mismo usuario a la misma sesión.

### Escenario 1: Inserción Normal (Sin colisión)
**GIVEN** una sesión de clase activa con ID `10`
**AND** un estudiante con ID `500` que aún NO tiene registrada su asistencia en la sesión `10`
**WHEN** el estudiante envía una petición válida a `/api/student/attend`
**THEN** el sistema registra la asistencia devolviendo `200 OK`
**AND** se refleja exactamente 1 registro en la tabla `asistencias` para la dupla `(10, 500)`.

### Escenario 2: Intento secuencial de duplicado
**GIVEN** que el estudiante `500` ya tiene una asistencia en la sesión `10`
**WHEN** el estudiante envía una segunda petición válida a `/api/student/attend`
**THEN** la validación TOCTOU normal a nivel de la API detecta la asistencia previa
**AND** el sistema devuelve un `422 Unprocessable Entity` ("Tu asistencia ya fue registrada")
**AND** la base de datos mantiene exactamente 1 registro.

### Escenario 3 (Extremo): Colisión Concurrente de Peticiones (Race Condition)
**GIVEN** una sesión de clase activa con ID `10`
**AND** un estudiante con ID `500` que aún NO tiene asistencia
**WHEN** el sistema recibe 50 peticiones concurrentes idénticas del estudiante `500` para la sesión `10` en un intervalo < 1 milisegundo (usando `asyncio.gather`)
**THEN** exactamente 1 transacción de base de datos logra el `INSERT` satisfactorio devolviendo `200 OK`
**AND** las otras 49 peticiones fallan a nivel de base de datos por violación del `UniqueConstraint` (`IntegrityError`) y el API captura la excepción devolviendo `409 Conflict` (o `422 Unprocessable Entity`)
**AND** se asegura absolutamente que en PostgreSQL existe exactamente 1 solo registro para la dupla `(10, 500)`.
