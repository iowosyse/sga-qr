-- =============================================================================
-- SGA-QR · Sistema de Gestión de Asistencia Escolar con Validación QR
-- Instituto Tecnológico de Morelia (ITM) — TecNM
-- =============================================================================
-- Ejecutar con:
--   psql -U sga -d sgaqr -f schema.sql
-- O dentro del contenedor Docker:
--   docker exec -i sga-qr-postgres psql -U sga -d sgaqr < backend/app/migrations/schema.sql
-- =============================================================================

BEGIN;

-- Limpiar tablas en orden inverso de dependencias (idempotente)
DROP TABLE IF EXISTS justificantes      CASCADE;
DROP TABLE IF EXISTS asistencias        CASCADE;
DROP TABLE IF EXISTS sesiones_activas   CASCADE;
DROP TABLE IF EXISTS sesiones_clase     CASCADE;
DROP TABLE IF EXISTS inscripciones      CASCADE;
DROP TABLE IF EXISTS horarios           CASCADE;
DROP TABLE IF EXISTS aulas              CASCADE;
DROP TABLE IF EXISTS grupos             CASCADE;
DROP TABLE IF EXISTS materias           CASCADE;
DROP TABLE IF EXISTS intentos_login     CASCADE;
DROP TABLE IF EXISTS usuarios           CASCADE;

-- =============================================================================
-- TABLAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- usuarios
-- Base única para docentes, estudiantes y administradores.
-- El campo `rol` discrimina el tipo; sin herencia de tabla para simplificar
-- las consultas y el ORM.
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id               SERIAL PRIMARY KEY,
    no_control       VARCHAR(8)   UNIQUE NOT NULL,
    nombre_completo  VARCHAR(100) NOT NULL,
    email            VARCHAR(100) UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    rol              VARCHAR(20)  NOT NULL
                         CHECK (rol IN ('admin', 'docente', 'estudiante')),
    activo           BOOLEAN      NOT NULL DEFAULT true,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  usuarios            IS 'Usuarios del sistema: administradores, docentes y estudiantes';
COMMENT ON COLUMN usuarios.no_control IS 'Número de control institucional (8 dígitos)';
COMMENT ON COLUMN usuarios.rol        IS 'admin | docente | estudiante';

-- -----------------------------------------------------------------------------
-- materias
-- Catálogo de materias del plan de estudios.
-- -----------------------------------------------------------------------------
CREATE TABLE materias (
    id       SERIAL PRIMARY KEY,
    nombre   VARCHAR(100) NOT NULL,
    clave    VARCHAR(20)  UNIQUE NOT NULL,
    semestre INT,
    carrera  VARCHAR(100)
);

COMMENT ON TABLE materias IS 'Catálogo de materias por carrera y semestre';

-- -----------------------------------------------------------------------------
-- aulas
-- Catálogo de aulas físicas.
-- NO se almacenan coordenadas GPS aquí; el geofence se define dinámicamente
-- a partir de la ubicación del docente al iniciar la sesión de clase
-- (campo lat_centro/lng_centro en sesiones_activas).
-- -----------------------------------------------------------------------------
CREATE TABLE aulas (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(20) NOT NULL,
    edificio  VARCHAR(50),
    capacidad INT
);

COMMENT ON TABLE aulas IS 'Aulas físicas — sin coordenadas fijas (el geofence lo define el docente al iniciar)';

-- -----------------------------------------------------------------------------
-- grupos
-- Grupo-clase: instancia de una materia impartida por un docente en un ciclo.
-- -----------------------------------------------------------------------------
CREATE TABLE grupos (
    id            SERIAL PRIMARY KEY,
    materia_id    INT         REFERENCES materias(id) ON DELETE RESTRICT,
    docente_id    INT         REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre        VARCHAR(10) NOT NULL,
    capacidad     INT         NOT NULL DEFAULT 30,
    semestre      INT,
    ciclo_escolar VARCHAR(10)
);

COMMENT ON TABLE grupos IS 'Grupo-clase: materia + docente + ciclo escolar';

-- -----------------------------------------------------------------------------
-- horarios
-- Cuándo y dónde se imparte cada grupo.
-- Un grupo puede tener múltiples horarios (lun, mié, vie).
-- -----------------------------------------------------------------------------
CREATE TABLE horarios (
    id          SERIAL PRIMARY KEY,
    grupo_id    INT         REFERENCES grupos(id) ON DELETE CASCADE,
    aula_id     INT         REFERENCES aulas(id)  ON DELETE RESTRICT,
    dia_semana  VARCHAR(10) NOT NULL
                    CHECK (dia_semana IN ('lunes','martes','miercoles',
                                         'jueves','viernes')),
    hora_inicio TIME        NOT NULL,
    hora_fin    TIME        NOT NULL,
    CONSTRAINT chk_horario_horas CHECK (hora_fin > hora_inicio)
);

COMMENT ON TABLE horarios IS 'Horario semanal de cada grupo-clase';

-- -----------------------------------------------------------------------------
-- inscripciones
-- Relación muchos-a-muchos entre estudiantes y grupos.
-- -----------------------------------------------------------------------------
CREATE TABLE inscripciones (
    id                SERIAL  PRIMARY KEY,
    estudiante_id     INT     REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id          INT     REFERENCES grupos(id)   ON DELETE CASCADE,
    fecha_inscripcion DATE    NOT NULL DEFAULT CURRENT_DATE,
    activo            BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (estudiante_id, grupo_id)
);

COMMENT ON TABLE inscripciones IS 'Estudiantes inscritos en cada grupo';

-- -----------------------------------------------------------------------------
-- sesiones_clase
-- Cada vez que un docente activa el pase de lista para un horario concreto.
-- Una sesión puede iniciar y cerrarse (activa → false) el mismo día.
-- -----------------------------------------------------------------------------
CREATE TABLE sesiones_clase (
    id          SERIAL  PRIMARY KEY,
    horario_id  INT     REFERENCES horarios(id) ON DELETE RESTRICT,
    docente_id  INT     REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha       DATE    NOT NULL DEFAULT CURRENT_DATE,
    inicio_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    fin_at      TIMESTAMP,
    activa      BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT chk_sesion_fin CHECK (fin_at IS NULL OR fin_at > inicio_at)
);

COMMENT ON TABLE sesiones_clase IS 'Instancias de pase de lista iniciadas por el docente';

-- -----------------------------------------------------------------------------
-- sesiones_activas
-- Almacena el TOTP secret y las coordenadas del docente mientras la sesión
-- está abierta. Al cerrar la sesión estos datos se eliminan (o se ponen a NULL)
-- para no conservar ubicaciones históricas (LFPDPPP).
-- La columna lat_centro/lng_centro define el centro del geofence para esa
-- sesión; NO se persisten como histórico.
-- -----------------------------------------------------------------------------
CREATE TABLE sesiones_activas (
    id           SERIAL PRIMARY KEY,
    sesion_id    INT           REFERENCES sesiones_clase(id) ON DELETE CASCADE,
    totp_secret  VARCHAR(32)   NOT NULL,
    lat_centro   DECIMAL(10,8),           -- Nullable: se borra al cerrar
    lng_centro   DECIMAL(11,8),           -- Nullable: se borra al cerrar
    radio_metros INT           NOT NULL DEFAULT 50,
    creado_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (sesion_id)
);

COMMENT ON TABLE  sesiones_activas              IS 'Estado efímero de la sesión activa: secret TOTP + geofence del docente';
COMMENT ON COLUMN sesiones_activas.lat_centro   IS 'Latitud del docente al iniciar — se pone NULL al cerrar la sesión (no es historial)';
COMMENT ON COLUMN sesiones_activas.lng_centro   IS 'Longitud del docente al iniciar — se pone NULL al cerrar la sesión (no es historial)';

-- -----------------------------------------------------------------------------
-- asistencias
-- Registro final de presencia/ausencia por sesión.
-- ⚠️ NO contiene columnas lat/lng — las coordenadas del estudiante se validan
-- en memoria en services/geofencing.py y se descartan sin persistirse (LFPDPPP).
-- -----------------------------------------------------------------------------
CREATE TABLE asistencias (
    id            SERIAL PRIMARY KEY,
    sesion_id     INT          REFERENCES sesiones_clase(id) ON DELETE RESTRICT,
    estudiante_id INT          REFERENCES usuarios(id)       ON DELETE RESTRICT,
    timestamp     TIMESTAMP    NOT NULL DEFAULT NOW(),
    metodo        VARCHAR(10)  NOT NULL DEFAULT 'qr'
                      CHECK (metodo IN ('qr', 'manual')),
    estado        VARCHAR(15)  NOT NULL DEFAULT 'presente'
                      CHECK (estado IN ('presente', 'ausente', 'justificado')),
    UNIQUE (sesion_id, estudiante_id)
    -- Sin columnas lat/lng: coordenadas del estudiante NUNCA se almacenan
);

COMMENT ON TABLE asistencias IS 'Registro de asistencia — sin coordenadas GPS del estudiante (LFPDPPP)';

-- -----------------------------------------------------------------------------
-- justificantes
-- Documentos subidos para justificar una ausencia.
-- -----------------------------------------------------------------------------
CREATE TABLE justificantes (
    id            SERIAL PRIMARY KEY,
    asistencia_id INT          REFERENCES asistencias(id) ON DELETE CASCADE,
    archivo_path  VARCHAR(255),
    estado        VARCHAR(15)  NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    revisor_id    INT          REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE justificantes IS 'Documentos justificantes de ausencias, revisados por el docente';

-- -----------------------------------------------------------------------------
-- intentos_login
-- Bitácora de intentos de autenticación para el bloqueo por fuerza bruta
-- (máximo 5 intentos fallidos — sin almacenar contraseñas ni hashes).
-- -----------------------------------------------------------------------------
CREATE TABLE intentos_login (
    id          SERIAL PRIMARY KEY,
    no_control  VARCHAR(8)  NOT NULL,
    ip          VARCHAR(45),             -- IPv4 o IPv6
    intento_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    exitoso     BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE intentos_login IS 'Bitácora de intentos de login para bloqueo por fuerza bruta';

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Búsquedas frecuentes en horarios por grupo
CREATE INDEX idx_horarios_grupo         ON horarios(grupo_id);

-- Consultas del historial de un estudiante
CREATE INDEX idx_inscripciones_estudiante ON inscripciones(estudiante_id);
CREATE INDEX idx_inscripciones_grupo      ON inscripciones(grupo_id);

-- Consultas de asistencia dentro de una sesión y por estudiante
CREATE INDEX idx_asistencias_sesion     ON asistencias(sesion_id);
CREATE INDEX idx_asistencias_estudiante ON asistencias(estudiante_id);

-- Dashboard del docente: sus sesiones
CREATE INDEX idx_sesiones_docente       ON sesiones_clase(docente_id);
CREATE INDEX idx_sesiones_fecha         ON sesiones_clase(fecha);

-- Detección de ataques de fuerza bruta: últimos N intentos de un no_control
CREATE INDEX idx_intentos_login         ON intentos_login(no_control, intento_at DESC);

-- =============================================================================
-- DATOS SEED
-- Contraseña de todos los usuarios: "password123"
-- Hash bcrypt (cost=12) generado con passlib en Python:
--   from passlib.hash import bcrypt
--   bcrypt.using(rounds=12).hash('password123')
-- =============================================================================

-- Hash único para "password123" (bcrypt cost 12)
-- Se usa el mismo hash para todos los usuarios de prueba —
-- en producción cada usuario tendrá su propio salt.
DO $$
DECLARE
    pwd_hash CONSTANT TEXT := '$2b$12$bB2G81BBIN9bmE8oPPJpOuTKRicdu4H5Aerut34wJ0VMeXje/lIsq';
BEGIN

-- ── Usuarios ──────────────────────────────────────────────────────────────────
INSERT INTO usuarios (no_control, nombre_completo, email, password_hash, rol) VALUES
    ('10000000', 'Administrador ITM',
     'admin@itmorelia.edu.mx',                     pwd_hash, 'admin'),
    ('20000001', 'MATI. Fernando Villaseñor Béjar',
     'f.villasenor@itmorelia.edu.mx',              pwd_hash, 'docente'),
    ('23121001', 'Ana Sofía Ramírez Torres',
     'ana.ramirez.23121001@itmorelia.edu.mx',      pwd_hash, 'estudiante'),
    ('23121002', 'Carlos Eduardo Mendoza Ríos',
     'carlos.mendoza.23121002@itmorelia.edu.mx',   pwd_hash, 'estudiante'),
    ('23121003', 'Lucía Fernanda García López',
     'lucia.garcia.23121003@itmorelia.edu.mx',     pwd_hash, 'estudiante'),
    ('23121004', 'Diego Alejandro Pérez Cruz',
     'diego.perez.23121004@itmorelia.edu.mx',      pwd_hash, 'estudiante'),
    ('23121005', 'Valeria Guadalupe Hernández Soto',
     'valeria.hernandez.23121005@itmorelia.edu.mx',pwd_hash, 'estudiante');

-- ── Materias ─────────────────────────────────────────────────────────────────
INSERT INTO materias (nombre, clave, semestre, carrera) VALUES
    ('Ingeniería de Software',               'ISC-801', 8,
     'Ingeniería en Sistemas Computacionales'),
    ('Fundamentos de Ingeniería de Software','ISC-401', 4,
     'Ingeniería en Sistemas Computacionales'),
    ('Taller de Investigación',              'ISC-901', 9,
     'Ingeniería en Sistemas Computacionales');

-- ── Aula ─────────────────────────────────────────────────────────────────────
-- Sin coordenadas — el geofence lo define el docente al iniciar la sesión.
INSERT INTO aulas (nombre, edificio, capacidad) VALUES
    ('B-204', 'B', 40);

-- ── Grupos ───────────────────────────────────────────────────────────────────
-- materia_id y docente_id se resuelven con subconsultas para evitar asumir IDs.
INSERT INTO grupos (materia_id, docente_id, nombre, capacidad, semestre, ciclo_escolar) VALUES
    ((SELECT id FROM materias WHERE clave = 'ISC-801'),
     (SELECT id FROM usuarios  WHERE no_control = '20000001'),
     '8A', 30, 8, '2025-2'),
    ((SELECT id FROM materias WHERE clave = 'ISC-401'),
     (SELECT id FROM usuarios  WHERE no_control = '20000001'),
     '7C', 35, 7, '2025-2'),
    ((SELECT id FROM materias WHERE clave = 'ISC-901'),
     (SELECT id FROM usuarios  WHERE no_control = '20000001'),
     '9A', 25, 9, '2025-2');

-- ── Horarios ─────────────────────────────────────────────────────────────────
-- Ingeniería de Software / 8A — lun, mié, vie 08:00-09:00
INSERT INTO horarios (grupo_id, aula_id, dia_semana, hora_inicio, hora_fin)
SELECT g.id, a.id, d.dia, '08:00', '09:00'
FROM   grupos  g
JOIN   materias m ON m.id = g.materia_id AND m.clave = 'ISC-801'
CROSS  JOIN aulas a
CROSS  JOIN (VALUES ('lunes'), ('miercoles'), ('viernes')) AS d(dia)
WHERE  g.nombre = '8A' AND a.nombre = 'B-204';

-- Fundamentos de IS / 7C — lun a vie 17:00-18:00
INSERT INTO horarios (grupo_id, aula_id, dia_semana, hora_inicio, hora_fin)
SELECT g.id, a.id, d.dia, '17:00', '18:00'
FROM   grupos  g
JOIN   materias m ON m.id = g.materia_id AND m.clave = 'ISC-401'
CROSS  JOIN aulas a
CROSS  JOIN (VALUES ('lunes'), ('martes'), ('miercoles'), ('jueves'), ('viernes')) AS d(dia)
WHERE  g.nombre = '7C' AND a.nombre = 'B-204';

-- Taller de Investigación / 9A — mar, jue 16:00-17:00
INSERT INTO horarios (grupo_id, aula_id, dia_semana, hora_inicio, hora_fin)
SELECT g.id, a.id, d.dia, '16:00', '17:00'
FROM   grupos  g
JOIN   materias m ON m.id = g.materia_id AND m.clave = 'ISC-901'
CROSS  JOIN aulas a
CROSS  JOIN (VALUES ('martes'), ('jueves')) AS d(dia)
WHERE  g.nombre = '9A' AND a.nombre = 'B-204';

-- ── Inscripciones ────────────────────────────────────────────────────────────
-- Los 5 estudiantes se inscriben en Ingeniería de Software / 8A
INSERT INTO inscripciones (estudiante_id, grupo_id)
SELECT u.id, g.id
FROM   usuarios  u
JOIN   grupos    g ON g.nombre = '8A'
JOIN   materias  m ON m.id = g.materia_id AND m.clave = 'ISC-801'
WHERE  u.rol = 'estudiante'
ORDER  BY u.no_control;

END $$;

COMMIT;

-- =============================================================================
-- Verificación rápida (descomenta para revisar el seed):
-- =============================================================================
-- SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;
-- SELECT m.clave, g.nombre AS grupo, COUNT(i.id) AS inscritos
--   FROM grupos g JOIN materias m ON m.id = g.materia_id
--   LEFT JOIN inscripciones i ON i.grupo_id = g.id
--   GROUP BY m.clave, g.nombre ORDER BY m.clave;
-- SELECT m.clave, g.nombre, h.dia_semana, h.hora_inicio, h.hora_fin
--   FROM horarios h JOIN grupos g ON g.id = h.grupo_id
--   JOIN materias m ON m.id = g.materia_id
--   ORDER BY m.clave, h.hora_inicio, h.dia_semana;
