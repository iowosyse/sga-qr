# Spec: Rate Limiting (Prevención de Fuerza Bruta)

## Feature: Limitador de Peticiones a Nivel de Usuario

**Como** Ingeniero de Seguridad
**Quiero** establecer un límite de peticiones (Rate Limit) al endpoint `/api/student/attend`
**Para** mitigar ataques de fuerza bruta que busquen adivinar tokens TOTP mediante fuerza computacional.

### Escenario 1: Tráfico Normal
**GIVEN** que el límite está configurado a 5 peticiones por minuto por usuario
**WHEN** un estudiante (con un JWT válido) envía 3 peticiones de asistencia en un minuto
**THEN** el sistema procesa todas las peticiones (ya sea para aceptarlas o rechazarlas si el TOTP es incorrecto)
**AND** las peticiones NO son bloqueadas devolviendo códigos HTTP normales (`200 OK` o `422 Unprocessable Entity`).

### Escenario 2 (Extremo): Ataque de Fuerza Bruta Localizado
**GIVEN** que el límite está configurado a 5 peticiones por minuto por usuario
**AND** un estudiante envía peticiones secuenciales intentando adivinar el TOTP actual (`000000`, `000001`, `000002`...)
**WHEN** el estudiante ejecuta la **6ta petición** y subsecuentes (ej. hasta 20 peticiones) en menos de 1 minuto
**THEN** el sistema intercepta las peticiones desde la 6ta en adelante antes de alcanzar la base de datos o lógica pesada
**AND** el sistema devuelve un código HTTP `429 Too Many Requests`
**AND** en los headers HTTP de la respuesta de error se incluye el tiempo de espera (ej. `Retry-After`).

### Escenario 3: Recuperación Post-Límite
**GIVEN** que el estudiante fue bloqueado por exceder el límite en el Escenario 2
**WHEN** el estudiante espera a que expire la ventana de 1 minuto y envía una nueva petición
**THEN** el sistema reinicia el contador de peticiones del usuario
**AND** la petición es procesada normalmente.
