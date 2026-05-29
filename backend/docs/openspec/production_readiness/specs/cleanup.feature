Feature: Limpieza Automática de Sesiones

  Scenario: Sesión excedida es marcada como inactiva
    Given que existe una "SesionActiva" en la base de datos
    And el timestamp de creación o actualización de la sesión supera las 3 horas de antigüedad
    When el Cron Job de limpieza en segundo plano se ejecuta
    Then la "SesionActiva" debe ser eliminada de la base de datos
    And el registro de "SesionClase" correspondiente debe marcarse con `activa=False`
    And los clientes conectados vía WebSocket a esa sesión deben ser desconectados de forma segura con un código de cierre (ej. 1000)
    
  Scenario: Sesión reciente no es afectada
    Given que existe una "SesionActiva" con 2 horas de antigüedad
    When el Cron Job de limpieza en segundo plano se ejecuta
    Then la "SesionActiva" debe mantenerse en la base de datos intacta
