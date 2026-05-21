# SGA-QR — Manual Técnico para Desarrolladores

> Sistema de Gestión de Asistencia Escolar con Validación QR  
> Instituto Tecnológico de Morelia · Ingeniería en Sistemas Computacionales  
> Materia: Ingeniería de Software · Semestre Enero-Junio 2026

---

## Equipo de Desarrollo

| No. Control | Nombre | Rol Scrum |
|-------------|--------|-----------|
| 23560475 | Joseph Daniel Rodríguez Flores | Scrum Master |
| 23121067 | Cándido Ortega Martínez | PO / Developer |
| 23121046 | Alejandro Montejano Díaz | Arquitecto / Developer |
| 23121128 | Luis Arturo Román Sánchez | QA / Developer |
| 23121099 | Jafet Santoyo Benites | Full-Stack Developer |

**Profesor:** MATI. Fernando Villaseñor Béjar

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Componentes UI | shadcn/ui + Tabler Icons |
| Estado global | Zustand |
| HTTP Client | Axios |
| Backend | Python 3.12 + FastAPI |
| ORM | SQLAlchemy 2.0 async |
| Base de datos | PostgreSQL 16 (Neon.tech) |
| Autenticación | JWT (python-jose) + bcrypt (passlib) |
| QR / TOTP | pyotp + qrcode |
| Geofencing | Fórmula de Haversine (implementación propia) |
| Tiempo real | WebSockets (FastAPI nativo) |
| Zona horaria | pytz — America/Mexico_City |

### ❌ Prohibido

- PHP en cualquier forma (Laravel, Symfony, etc.)
- JavaScript en el backend (Node.js, Express, etc.)
- Almacenar coordenadas GPS del estudiante en BD

---

## Estructura del Proyecto

```
sga-qr/
├── CLAUDE.md                  # Contexto para Claude Code
├── .gitattributes             # Normalización CRLF/LF
├── .gitignore
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── teacher/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ActiveSession.tsx
│   │   │   │   ├── Students.tsx
│   │   │   │   ├── Schedule.tsx
│   │   │   │   └── Reports.tsx
│   │   │   └── student/
│   │   │       ├── Scanner.tsx
│   │   │       ├── GPSValidation.tsx
│   │   │       ├── Success.tsx
│   │   │       └── History.tsx
│   │   ├── store/
│   │   │   └── authStore.ts   # Zustand — auth state
│   │   ├── lib/
│   │   │   ├── api.ts         # Axios client + interceptors
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   └── types/
│   ├── .env.local             # Variables de entorno (no en Git)
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                   # Python + FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py          # pydantic-settings
│   │   ├── database.py        # AsyncEngine + SessionLocal
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── teacher.py
│   │   │   ├── student.py
│   │   │   └── websocket.py
│   │   ├── services/
│   │   │   ├── auth.py        # JWT + bcrypt
│   │   │   ├── totp.py        # Generación/validación QR
│   │   │   ├── geofencing.py  # Haversine
│   │   │   └── realtime.py    # WebSocket manager
│   │   └── migrations/
│   │       └── schema.sql     # Schema completo + seed
│   ├── .env                   # Variables de entorno (no en Git)
│   └── requirements.txt
├── mock/                      # Código exportado de Figma (local, no en Git)
└── wireframes/                # Wireframes HTML de referencia (local, no en Git)
```

---

## Configuración del Entorno

### Requisitos Previos

- Node.js 18+
- Python 3.12+
- Cuenta en [Neon.tech](https://neon.tech) (base de datos)
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sga-qr.git
cd sga-qr
```

### 2. Configurar el Frontend

```bash
cd frontend
npm install
```

Crear `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001
VITE_DEBUG_ALL_CLASSES=true
```

> `VITE_DEBUG_ALL_CLASSES=true` muestra todas las clases sin filtrar por día — útil para desarrollo.

### 3. Configurar el Backend

```bash
cd backend
pip install -r requirements.txt --break-system-packages
```

Crear `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://usuario:password@host/neondb?sslmode=require
SECRET_KEY=tu_secret_key_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TOTP_INTERVAL=15
GEOFENCE_RADIUS_METROS=25
CORS_ORIGINS=["*"]
```

> Para generar un `SECRET_KEY` seguro:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 4. Base de Datos (Neon.tech)

La BD ya está creada en Neon. Si necesitas recrearla desde cero, ejecuta `backend/app/migrations/schema.sql` en el SQL Editor de Neon.

**Credenciales de prueba (seed):**

| Rol | No. Control | Contraseña |
|-----|-------------|------------|
| Docente | `20000001` | `password123` |
| Estudiante | `23121001` | `password123` |
| Estudiante | `23121002` | `password123` |
| Estudiante | `23121003` | `password123` |
| Estudiante | `23121004` | `password123` |
| Estudiante | `23121005` | `password123` |

---

## Levantar el Proyecto

### Frontend

```bash
cd frontend
npm run dev -- --host
```

Disponible en: `http://localhost:5173`  
Con `--host` también en: `http://TU_IP_LOCAL:5173`

### Backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Disponible en: `http://localhost:8001`  
Swagger UI: `http://localhost:8001/docs`  
Health check: `http://localhost:8001/health`

---

## Pruebas en Red Local (Laptop + Celular)

Para probar con un celular en la misma red WiFi:

1. Obtén tu IP local:
   ```powershell
   ipconfig
   # Busca "Dirección IPv4" — algo como 192.168.1.X
   ```

2. Abre el puerto en el firewall de Windows:
   ```powershell
   netsh advfirewall firewall add rule name="FastAPI 8001" dir=in action=allow protocol=TCP localport=8001
   ```

3. En el celular abre: `http://192.168.1.X:5173`

> **Importante:** Safari en iPhone bloquea la cámara en HTTP. Para usar la cámara en iPhone necesitas HTTPS. Usa [ngrok](https://ngrok.com) para crear un túnel HTTPS al frontend:
> ```bash
> ngrok http 5173
> ```
> Actualiza `VITE_API_URL` en `.env.local` con tu IP local si el backend no pasa por ngrok.

---

## Arquitectura y Flujo Principal

### Flujo de Pase de Lista

```
1. Docente (celular) → Login → Dashboard → "Iniciar pase de lista"
   → Solicita GPS → POST /api/teacher/session/start {horario_id, lat, lng}
   → lat/lng del docente se guardan en sesiones_activas como centro del geofence

2. Docente (laptop) → Login → Dashboard → "Ver pase de lista activo"
   → GET /api/teacher/session/{id}/qr → Muestra QR en pantalla grande
   → QR se renueva cada 15 segundos (TOTP)

3. Estudiante (celular) → Login → Scanner → Escanea QR
   → GPS solicita ubicación → POST /api/student/attend {token_qr, lat, lng}
   → Backend valida: token vigente + inscripción + no duplicado + geofencing
   → Si pasa: INSERT asistencias (SIN lat/lng del estudiante)
   → WebSocket notifica al docente en tiempo real

4. Docente (laptop) → Ve en tiempo real el estudiante como "Presente"
```

### Geofencing

- El centro del geofence es la **ubicación del docente** al iniciar la sesión
- Radio por defecto: **25 metros**
- Las coordenadas del docente se almacenan en `sesiones_activas.lat_centro` y `lng_centro`
- Al cerrar la sesión, esas columnas se ponen a `NULL`
- Las coordenadas del **estudiante** se usan solo para validación y **nunca se almacenan**
- Cumplimiento: LFPDPPP

### Tokens QR (TOTP)

- Librería: `pyotp` con intervalo de 15 segundos
- Se genera un `secret` aleatorio al iniciar cada sesión
- El token se valida con ventana de 1 intervalo (tolerancia de ±15s)
- El secret se invalida al cerrar la sesión

---

## API — Referencia Rápida

### Auth
```
POST /api/auth/login
  Body: {no_control, password}
  Response: {access_token, token_type, rol, nombre}
  Error 423: cuenta bloqueada (≥5 intentos fallidos en 15 min)
```

### Docente (requiere JWT rol=docente)
```
GET  /api/teacher/classes/today?all=true
GET  /api/teacher/session/{id}/qr
GET  /api/teacher/session/{id}/stats
POST /api/teacher/session/start
  Body: {horario_id, lat, lng}
POST /api/teacher/session/{id}/close
PATCH /api/teacher/attendance/{id}
  Body: {estado}
```

### Estudiante (requiere JWT rol=estudiante)
```
POST /api/student/attend
  Body: {token_qr, lat, lng}
  Validaciones en orden:
    1. Token QR válido (pyotp)
    2. Sesión activa
    3. Estudiante inscrito en el grupo
    4. Sin registro previo en esta sesión
    5. Dentro del radio del docente (Haversine)
```

### WebSocket
```
WS /ws/session/{session_id}?token={jwt}
  Evento recibido: {type, estudiante_id, no_control, nombre, timestamp, estado}
```

---

## Base de Datos — Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Docentes, estudiantes y admin |
| `materias` | Catálogo de materias |
| `grupos` | Grupos por materia y docente |
| `aulas` | Aulas por edificio (K, F, I, AG) |
| `horarios` | Horarios por grupo, aula y día |
| `inscripciones` | Relación estudiante-grupo |
| `sesiones_clase` | Pase de lista del día |
| `sesiones_activas` | Token TOTP + coordenadas del docente (temporales) |
| `asistencias` | Registros de asistencia (SIN lat/lng) |
| `intentos_login` | Control de intentos fallidos |

### Aulas Disponibles

| Edificio | Aulas |
|----------|-------|
| K | K1–K9 |
| F | F1–F6 |
| I | LRD, LTW, LIS |
| AG | LC1, LC2, LC3 |

### Materias del Docente Seed

| Materia | Grupo | Aula | Horario |
|---------|-------|------|---------|
| Ingeniería de Software | 8A | LIS | Lun/Mié/Vie 08:00-09:00 |
| Fundamentos de IS | 7C | K5 | Lun-Vie 17:00-18:00 |
| Taller de Investigación | 9A | F3 | Mar/Jue 16:00-17:00 |
| Testing y Desarrollo | TEST | LIS | 24/7 (para pruebas) |

---

## Consideraciones de Seguridad

- Contraseñas hasheadas con **bcrypt** (factor 12)
- JWT expira en **30 minutos**
- Bloqueo de cuenta tras **5 intentos fallidos** en 15 minutos
- Coordenadas del estudiante **nunca persisten** en BD
- Coordenadas del docente se eliminan al cerrar la sesión
- HTTPS obligatorio en producción
- CORS configurado como `*` en desarrollo — restringir en producción

---

## Variables de Entorno — Referencia Completa

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `http://localhost:8001` |
| `VITE_WS_URL` | URL WebSocket del backend | `ws://localhost:8001` |
| `VITE_DEBUG_ALL_CLASSES` | Muestra todas las clases sin filtrar por día | `true` |

### Backend (`backend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de Neon | — |
| `SECRET_KEY` | Clave para firmar JWT | — |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token | `30` |
| `TOTP_INTERVAL` | Segundos de vida del QR | `15` |
| `GEOFENCE_RADIUS_METROS` | Radio del geofence | `25` |

---

## Problemas Conocidos y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| Cámara no funciona en iPhone | Safari requiere HTTPS | Usar ngrok para el frontend |
| GPS impreciso en laptop | Las laptops no tienen GPS hardware | El docente debe iniciar el pase de lista desde su celular |
| Puerto ocupado al levantar uvicorn | Proceso anterior no terminó | `netstat -ano \| findstr :8001` → `taskkill /PID X /F` |
| CORS bloqueado | Backend no acepta el origen | Verificar `CORS_ORIGINS` en `.env` |
| Clases no aparecen hoy | Zona horaria UTC vs México | El backend usa `pytz America/Mexico_City` |

---

## Ramas de Git

| Rama | Descripción |
|------|-------------|
| `main` | Rama principal — código estable |
| `feature/frontend` | Desarrollo del frontend |

---

## Próximos Pasos (Sprint 3)

- [ ] Flujo de justificantes digitales (CU-10, CU-11)
- [ ] Reportes exportables en CSV/PDF
- [ ] Detección automática de alumnos en riesgo
- [ ] Administración de usuarios y catálogos
- [ ] Despliegue en producción con HTTPS real
- [ ] Inicio de pase de lista desde celular del docente con QR de activación para la laptop