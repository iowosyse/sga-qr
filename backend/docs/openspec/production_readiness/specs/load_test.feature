Feature: Load Testing y Pruebas de Estrés

  Scenario: Sistema bajo estrés masivo de asistencias (Thundering Herd)
    Given el servidor operando en un ambiente de simulación de producción
    And 1 sesión activa esperando a los estudiantes
    When Locust simula 500 estudiantes concurrentes
    And cada estudiante se conecta al WebSocket en menos de 5 segundos
    And cada estudiante envía una petición POST a `/api/student/attend` simultáneamente
    Then el servidor debe mantener una latencia P95 inferior a 500ms
    And la base de datos no debe colapsar (0 errores de conexión o Deadlocks)
    And el Rate Limiter debe actuar para bloquear intentos excesivos
    And el WebSocket del Docente debe recibir los eventos `attendance` para los registros válidos de forma asíncrona sin bloquearse
