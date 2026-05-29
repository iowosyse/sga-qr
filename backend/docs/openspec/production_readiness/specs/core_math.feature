Feature: Matemáticas Core y Temporizadores (Haversine & TOTP)

  Scenario Outline: Geofencing con fórmula de Haversine bajo casos límite
    Given que el centro del Aula está en las coordenadas <lat_doc>, <lng_doc>
    And el radio permitido de la geocerca es de 50 metros
    When un estudiante intenta marcar asistencia desde las coordenadas <lat_est>, <lng_est> equivalentes a una distancia de <distancia> metros
    Then el sistema debe calcular la distancia con un margen de error menor a 1 metro
    And la validación debe resultar en <resultado>

    Examples:
      | lat_doc | lng_doc | lat_est | lng_est | distancia | resultado |
      | 20.0000 | -103.00 | 20.0000 | -103.00 | 0.0m      | Permitido |
      | 20.0000 | -103.00 | 20.0004 | -103.00 | 44.5m     | Permitido |
      | 20.0000 | -103.00 | 20.0005 | -103.00 | 55.6m     | Denegado  |

  Scenario: Expiración estricta de TOTP
    Given un token TOTP válido generado en el tiempo T
    When el estudiante envía el token en el tiempo T + 29 segundos
    Then el token debe ser validado como CORRECTO
    When el estudiante envía el token en el tiempo T + 31 segundos
    Then el token debe ser validado como INVÁLIDO
