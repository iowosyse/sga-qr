# CLAUDE.md — SGA-QR
# Sistema de Gestión de Asistencia Escolar con Validación QR
# Instituto Tecnológico de Morelia (ITM)

---

## REGLAS ABSOLUTAS — LEE ESTO PRIMERO

### ❌ PROHIBIDO SIN EXCEPCIÓN
- **PHP** en cualquier forma, versión o framework (Laravel, Symfony, WordPress, etc.)
- **JavaScript** en el backend. Node.js, Express, NestJS, Bun, Deno — todos prohibidos
- Almacenar coordenadas GPS en la base de datos de forma permanente (LFPDPPP)
- Texto plano para contraseñas en cualquier capa del sistema
- HTTP sin TLS en producción

### ✅ STACK OFICIAL Y APROBADO

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript (TSX) + Vite + Tailwind CSS + shadcn/ui |
| Backend | Python 3.12+ + FastAPI |
| ORM | SQLAlchemy 2.0 async + Alembic (migraciones) |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (`python-jose`) + bcrypt (`passlib`) |
| QR / TOTP | `pyotp` + `qrcode` |
| Tiempo real | WebSockets (FastAPI nativo) |
| Geofencing | Fórmula de Haversine implementada en backend (Python) |
| Testing BE | pytest + httpx |
| Testing FE | Vitest + Testing Library |

---

## Referencia Visual — Mockup de Figma (fuente de verdad)

La carpeta `mock/` contiene el **código fuente React TSX exportado directamente desde Figma**. Es la fuente de verdad visual del proyecto. Los wireframes HTML son solo referencia conceptual; el mockup de Figma es lo que el frontend debe replicar.

```
mock/
└── ...   # componentes TSX exportados desde Figma — leer antes de crear cualquier pantalla
```

### Reglas de uso del mockup

1. **Leer primero, escribir después.** Antes de crear cualquier componente o página, leer el archivo correspondiente en `mock/` para extraer: colores exactos, tipografía, espaciados, estructura de layout y nombres de elementos.

2. **El código de `mock/` es referencia, no producción.** El código exportado por Figma puede tener estilos inline, valores hardcoded o estructura no óptima. No copiar y pegar directamente — traducirlo a componentes React limpios con clases Tailwind, respetando los valores visuales exactos.

3. **Extraer tokens antes de escribir componentes.** Al leer un archivo de `mock/`, identificar:
   - Colores en hex → mapear a `tailwind.config.ts` como tokens custom
   - Fuentes y tamaños → configurar en Tailwind typography scale
   - Espaciados recurrentes → usar la escala de espaciado de Tailwind más cercana
   - Bordes y radios → configurar en `borderRadius` de Tailwind

4. **Los wireframes HTML en `wireframes/` documentan comportamiento dinámico** (animaciones de countdown, scanline, live dot) que Figma no exporta. Usar ambas fuentes de forma complementaria:
   - `mock/` → valores visuales estáticos exactos (colores, layout, tipografía)
   - `wireframes/` → comportamiento animado e interacciones

### Jerarquía de fuentes visuales

```
mock/          ← 🥇 colores, layout, tipografía, espaciado exacto
wireframes/    ← 🥈 animaciones, interacciones, flujo de pantallas
CLAUDE.md      ← 🥉 lógica de negocio, restricciones, arquitectura
```

---

## Descripción del Proyecto

SGA-QR es una PWA (Progressive Web App) institucional que reemplaza el pase de lista manual en el ITM. 

**Flujo principal:**
1. El docente inicia una sesión de clase → el sistema genera un código QR temporal (TOTP, válido 15 segundos)
2. El QR se proyecta en el cañón del aula
3. El estudiante escanea el QR con su dispositivo (BYOD)
4. El backend valida: token vigente + coordenadas del alumno dentro de 50 m del aula
5. La asistencia queda registrada; el docente ve el panel en tiempo real vía WebSocket

---

## Arquitectura

```
sga-qr/
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── NavRail.tsx
│   │   │   ├── QRDisplay.tsx
│   │   │   ├── CountdownBar.tsx
│   │   │   ├── LiveBadge.tsx
│   │   │   ├── StudentRow.tsx
│   │   │   ├── AttendanceCalendar.tsx
│   │   │   └── ScannerFrame.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── teacher/
│   │   │   │   ├── Dashboard.tsx      # Calendario de asistencia
│   │   │   │   └── ActiveSession.tsx  # QR + monitor en tiempo real
│   │   │   └── student/
│   │   │       ├── Scanner.tsx        # Escáner QR
│   │   │       ├── GPSValidation.tsx  # Validación de ubicación
│   │   │       ├── Success.tsx        # Confirmación
│   │   │       └── History.tsx        # Historial del alumno
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useGeolocation.ts
│   │   │   └── useAuth.ts
│   │   ├── lib/
│   │   │   ├── api.ts             # Cliente HTTP (fetch/axios hacia FastAPI)
│   │   │   └── utils.ts
│   │   ├── store/                 # Zustand o Context
│   │   └── types/                 # Tipos TypeScript compartidos
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                   # Python + FastAPI
│   ├── app/
│   │   ├── main.py            # Entry point FastAPI
│   │   ├── config.py          # Settings (pydantic-settings)
│   │   ├── database.py        # AsyncEngine + SessionLocal
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── user.py        # Usuario, Docente, Estudiante, Admin
│   │   │   ├── academic.py    # Materia, Grupo, Aula, Horario
│   │   │   ├── session.py     # SesionClase, SesionActiva (tokens TOTP)
│   │   │   └── attendance.py  # Asistencia, Justificante
│   │   ├── schemas/           # Pydantic schemas (request/response)
│   │   ├── routers/
│   │   │   ├── auth.py        # POST /login, POST /refresh
│   │   │   ├── teacher.py     # Rutas del docente
│   │   │   ├── student.py     # Rutas del estudiante
│   │   │   ├── admin.py       # Rutas del administrador
│   │   │   ├── attendance.py  # POST /attend, WebSocket /ws/session/{id}
│   │   │   └── reports.py     # Reportes y estadísticas
│   │   ├── services/
│   │   │   ├── totp.py        # Generación/validación de tokens QR (pyotp)
│   │   │   ├── geofencing.py  # Haversine — NUNCA persiste coordenadas
│   │   │   ├── auth.py        # JWT encode/decode, bcrypt
│   │   │   └── realtime.py    # WebSocket manager
│   │   └── migrations/        # Alembic
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── docker-compose.yml         # PostgreSQL + backend + frontend (dev)
└── CLAUDE.md                  # Este archivo
```

---

## Modelos de Base de Datos

### Entidades principales

```python
# Usuario base (herencia para Docente / Estudiante / Admin)
Usuario: id, no_control, nombre, email, password_hash, rol, activo

# Catálogo académico
Materia:  id, nombre, clave, semestre
Grupo:    id, materia_id, docente_id, capacidad, semestre
Aula:     id, nombre, edificio, lat_aula, lng_aula, radio_m (default 50)
Horario:  id, grupo_id, aula_id, dia_semana, hora_inicio, hora_fin

# Sesión de clase (cuando el docente activa el pase de lista)
SesionClase:  id, horario_id, docente_id, fecha, inicio_at, fin_at, activa
SesionActiva: id, sesion_id, totp_secret, creado_at  # TTL manejado en memoria/Redis

# Asistencia — SIN coordenadas persistidas
Asistencia: id, sesion_id, estudiante_id, timestamp, metodo (qr|manual), estado (presente|ausente|justificado)
# ⚠️ NO hay columna lat/lng aquí — las coordenadas se validan en memoria y se descartan

# Justificantes
Justificante: id, asistencia_id, archivo_path, estado (pendiente|aprobado|rechazado), revisor_id
```

---

## Endpoints API — Referencia Rápida

```
Auth
  POST   /api/auth/login          → {access_token, refresh_token, rol}
  POST   /api/auth/refresh

Docente
  GET    /api/teacher/classes      → Lista de clases del día
  POST   /api/teacher/session/start    → Inicia sesión de clase, genera secret TOTP
  GET    /api/teacher/session/{id}/qr  → Devuelve QR actual (imagen o string)
  POST   /api/teacher/session/{id}/close
  PATCH  /api/teacher/attendance/{id}  → Corrección manual
  GET    /api/teacher/calendar/{month} → Porcentaje de asistencia por día

Estudiante
  POST   /api/student/attend       → {token_qr, lat, lng} → registra asistencia
                                     ⚠️ lat/lng se usan SOLO para validación, no se almacenan
  GET    /api/student/history      → Historial del estudiante autenticado

WebSocket
  WS     /ws/session/{session_id}  → Stream de actualizaciones en tiempo real (docente)

Admin
  GET/POST/PATCH  /api/admin/users
  GET/POST/PATCH  /api/admin/groups
  GET/POST/PATCH  /api/admin/classrooms
  GET             /api/admin/reports/{type}
  GET             /api/admin/risk-alerts    → Alumnos con asistencia < umbral
```

---

## Lógica de Negocio Crítica

### 1. Generación de QR (TOTP de 15 segundos)
```python
# services/totp.py
import pyotp, time

def generar_secret() -> str:
    return pyotp.random_base32()

def generar_token(secret: str) -> str:
    totp = pyotp.TOTP(secret, interval=15)
    return totp.now()

def validar_token(secret: str, token: str) -> bool:
    totp = pyotp.TOTP(secret, interval=15)
    return totp.verify(token, valid_window=1)  # tolera 1 intervalo
```

### 2. Validación de Geofencing (Haversine)
```python
# services/geofencing.py
import math

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Retorna distancia en metros entre dos coordenadas."""
    R = 6_371_000  # radio de la Tierra en metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def esta_en_rango(lat_alumno: float, lng_alumno: float,
                  lat_aula: float, lng_aula: float,
                  radio_m: float = 50.0) -> bool:
    """Las coordenadas del alumno NUNCA se persisten — solo se evalúan aquí."""
    return haversine(lat_alumno, lng_alumno, lat_aula, lng_aula) <= radio_m
```

### 3. Endpoint de registro de asistencia
```python
# El flujo completo en un solo endpoint:
# 1. Validar JWT del estudiante
# 2. Validar que el token QR esté vigente (pyotp)
# 3. Validar que la sesión de clase esté activa
# 4. Validar que no haya registro duplicado (mismo estudiante, misma sesión)
# 5. Validar geofencing — las coordenadas NO se guardan
# 6. Insertar fila en Asistencia (sin lat/lng)
# 7. Emitir evento por WebSocket al docente
```

---

## Guía Visual del Frontend

### Diseño System
```
Colores:
  --color-primary:    #2C2C2A   (carbón oscuro)
  --color-bg-app:     #F5F4EF   (beige muy suave)
  --color-bg-surface: #FFFFFF
  --color-bg-subtle:  #EEEDE8
  --color-success:    #2E7D32
  --color-error:      #C62828
  --color-warning:    #E65100
  --color-text-1:     #1A1A18
  --color-text-2:     #5A5A56
  --color-text-3:     #9A9A94

Tipografía: Inter (Google Fonts) o DM Sans
  --font-sans: 'Inter', system-ui, sans-serif

Radios:
  --radius-sm:  4px
  --radius-md:  8px
  --radius-lg:  12px
  --radius-xl:  20px

Sombras: mínimas
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08)
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10)
```

### Componentes prioritarios para Sprint 1

1. **NavRail** — sidebar de 56px con iconos Tabler + tooltips en hover
2. **QRDisplay** — QR grande (160px+) + CountdownBar animada de 15s
3. **LiveBadge** — badge verde con punto pulsante "En vivo"
4. **StudentRow** — fila con no. control, nombre, StatusDot, botón editar
5. **AttendanceCalendar** — grid mensual con PercentCircle por día
6. **ScannerFrame** — área de cámara oscura con marco animado
7. **GPSWidget** — mini mapa esquemático con anillos concéntricos

### Reglas de responsive
- El layout del docente es **desktop-first** (mínimo 1024px)
- La vista del estudiante es **mobile-first** (360–430px)
- El QR debe ser legible a 3–4 metros de distancia (tamaño mínimo 200×200px en proyector)
- Toque mínimo en móvil: 44×44px (WCAG 2.1)
- Contraste mínimo: AA (relación 4.5:1 para texto normal)

---

## Comandos de Desarrollo

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head             # Aplicar migraciones
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev                      # Vite dev server en :5173

# Docker (PostgreSQL en dev)
docker compose up -d postgres

# Tests
cd backend && pytest
cd frontend && npm run test
```

---

## Variables de Entorno (.env)

```env
# Backend
DATABASE_URL=postgresql+asyncpg://sga:sga@localhost:5432/sgaqr
SECRET_KEY=CAMBIAR_EN_PRODUCCION_clave_super_secreta_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
TOTP_INTERVAL=15
GEOFENCE_RADIUS_METERS=50
CORS_ORIGINS=http://localhost:5173

# Frontend (Vite)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## Módulos del Sistema (Casos de Uso)

| ID | Nombre | Actor | Prioridad Sprint 1 |
|----|--------|-------|-------------------|
| CU-01 | Iniciar sesión institucional | Todos | ✅ Sprint 1 |
| CU-02 | Iniciar sesión de clase | Docente | ✅ Sprint 1 |
| CU-03 | Generar QR dinámico | Docente | ✅ Sprint 1 |
| CU-04 | Escanear QR y registrar asistencia | Estudiante | ✅ Sprint 1 |
| CU-05 | Validar ubicación geográfica | Sistema | ✅ Sprint 1 |
| CU-06 | Bloquear dispositivos duplicados | Sistema | ✅ Sprint 1 |
| CU-07 | Monitorear asistencia en tiempo real | Docente | ✅ Sprint 1 |
| CU-08 | Corregir asistencia manualmente | Docente | ✅ Sprint 1 |
| CU-09 | Consultar historial de asistencias | Todos | Sprint 2 |
| CU-10 | Subir justificante digital | Estudiante | Sprint 2 |
| CU-11 | Aprobar/rechazar justificante | Docente | Sprint 2 |
| CU-12 | Generar reportes de asistencia | Admin/Docente | Sprint 2 |
| CU-13 | Detectar alumnos en riesgo | Admin/Docente | Sprint 2 |
| CU-14 | Cargar datos académicos | Admin | Sprint 2 |
| CU-15 | Administrar usuarios y catálogos | Admin | Sprint 2 |
| CU-17 | Gestionar incidencias técnicas | Soporte | Sprint 3 |
| CU-18 | Cerrar sesión de clase | Docente | ✅ Sprint 1 |

---

## Restricciones de Seguridad

1. **HTTPS obligatorio en producción** — Certbot + Let's Encrypt + Nginx reverse proxy
2. **Bloqueo tras 5 intentos fallidos** de login (implementar con Redis o tabla DB)
3. **Contraseñas**: bcrypt con factor de trabajo ≥ 12
4. **JWT**: access token 30 min, refresh token 7 días, firmados con HS256
5. **Coordenadas GPS**: procesadas en memoria en `services/geofencing.py`, **nunca** insertadas en ninguna tabla de la BD
6. **CORS**: restringido a los orígenes configurados en `.env`
7. **Rate limiting**: máximo 10 req/min en `/api/auth/login`

---

## Contexto Institucional

- **Institución**: Instituto Tecnológico de Morelia (ITM) — TecNM
- **Materia**: Ingeniería de Software — semestre actual
- **Equipo**: 5 desarrolladores
- **Profesor**: Fernando Villaseñor Béjar
- **Capacidad estándar de aula**: 30–40 alumnos
- **Estrategia de dispositivos**: BYOD (Bring Your Own Device) — alumnos usan sus propios smartphones
- **Ley aplicable**: LFPDPPP (Ley Federal de Protección de Datos Personales en Posesión de los Particulares)
- **Requerimiento de rendimiento**: ciclo Escaneo–Validación–Registro ≤ 2 segundos

---

## Notas para Claude Code

- Cuando generes componentes de React, usar **TypeScript estricto** (`strict: true` en tsconfig)
- Usar **Tailwind utility classes** directamente; no crear CSS custom salvo para animaciones especiales
- Los componentes de shadcn/ui se instalan con `npx shadcn-ui@latest add [componente]`
- El icono set es **Tabler Icons** (`@tabler/icons-react`)
- Para el escáner QR del estudiante, usar la librería **`html5-qrcode`** o **`@zxing/browser`**
- Para generar el QR en el frontend (desde el secret que devuelve el backend), usar **`qrcode.react`**
- Los WebSockets del docente se conectan a `/ws/session/{session_id}` con el JWT en query param
- El backend FastAPI corre en puerto **8000**, el frontend Vite en **5173**
- En desarrollo, configurar proxy en `vite.config.ts` para evitar CORS: `/api` → `http://localhost:8000`