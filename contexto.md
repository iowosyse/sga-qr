# Reporte de Sprints — SGA-QR
**Proyecto:** Sistema de Gestión de Asistencia Escolar con Validación QR  
**Instituto Tecnológico de Morelia · Ingeniería en Sistemas Computacionales**  
**Equipo:** J. Rodríguez · C. Ortega · A. Montejano · L. Román · J. Santoyo  
**Profesor:** MATI. Fernando Villaseñor Béjar

---

# Reporte Sprint 1
**Período:** 23 de Abril – 8 de Mayo 2026  
**Scrum Master:** Joseph Daniel Rodríguez Flores

---

## Objetivo del Sprint

El objetivo planeado originalmente era establecer la infraestructura del servidor, la base de datos PostgreSQL y un flujo de autenticación con JWT. En la práctica, el sprint se reorientó hacia el diseño y la implementación completa del frontend con datos simulados, dejando el backend para el Sprint 2.

**Objetivo real ejecutado:** Definir el stack tecnológico definitivo, configurar el repositorio, producir el design system a partir del mockup de Figma e implementar todas las vistas del frontend con datos mock, dejando el sistema listo visualmente para la integración con el backend.

---

## Decisión Crítica: Cambio de Stack

El documento de arquitectura especificaba Laravel (PHP) como backend. Esta decisión fue revertida antes de comenzar el desarrollo por mala comunicación interna en el equipo — se había puesto lo primero que hubo sin consenso real.

**Stack definitivo aprobado:**

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Python 3.12 + FastAPI |
| Base de datos | PostgreSQL 16 (Neon.tech) |

**Reglas permanentes:**
- PHP en cualquier forma → prohibido
- JavaScript en el backend (Node.js, etc.) → prohibido
- Coordenadas GPS del estudiante almacenadas en BD → prohibido (LFPDPPP)

---

## Resumen de Tareas

| ID | Tarea | Estado | Notas |
|----|-------|--------|-------|
| ST-01 | Infraestructura PostgreSQL + servidor Ubuntu | ⏭ Pendiente | Movido a Sprint 2. No se tocó el backend en este sprint |
| HU-01 | Login con No. de Control y JWT | 🎨 UI Lista | Pantalla implementada con mock, sin auth real |
| HU-02 | Generación de QR TOTP cada 15s | 🎨 UI Lista | QR visual con `qrcode.react`, sin TOTP real |
| ST-02 | Capa HTTPS / certificados TLS | ⏭ Pendiente | Movido a Sprint 2 |
| HU-03 | Geofencing — validar alumno a <50m | 🎨 UI Lista | Flujo GPS simulado, sin Haversine real |
| CU-18 | Cerrar sesión de clase | 🎨 UI Lista | Botón con dialog, sin sesión real |
| FS-01 | Repositorio, CLAUDE.md, .gitattributes | ✅ Listo | Base del proyecto configurada desde el día 1 |
| FS-02 | Design system desde mockup de Figma | ✅ Listo | `tailwind.config.ts` con tokens exactos de Figma |
| FS-03 | 9 componentes reutilizables | ✅ Listo | NavRail, QRDisplay, CountdownBar, Scanner, etc. |
| FS-04 | 5 vistas del docente | ✅ Listo | Dashboard, ActiveSession, Students, Schedule, Reports |
| FS-05 | 4 vistas del estudiante | ✅ Listo | Scanner, GPSValidation, Success, History |
| FS-06 | Router con rutas protegidas por rol | ✅ Listo | React Router v7 con guard por rol en localStorage |

---

## Proceso de Diseño

El sprint incluyó un proceso de diseño completo antes de escribir código:

1. **Wireframes interactivos en HTML** — generados con CSS variables del design system. Dos variantes: vista docente (desktop) y flujo del estudiante (mobile-first). Incluyen animaciones de countdown, scanline y live badge como referencia de comportamiento.

2. **Mockup en Figma** — alta fidelidad con componentes shadcn/ui. Exportado como código TSX con tokens exactos de color, tipografía, espaciado y radios.

3. **CLAUDE.md** — archivo de contexto para Claude Code con stack, reglas de negocio, arquitectura, referencia a los wireframes y al mockup, y restricciones de seguridad. Vive en la raíz del repositorio y es leído automáticamente por Claude Code al iniciar una sesión.

---

## Errores Encontrados y Resoluciones

**Error: Dependencias incorrectas en `package.json`**
- `pyotp@^2.9.2` incluida — es una librería de Python, no existe en npm.
- `qrcode.react@1.0.1` — no soporta React 18. Actualizada a `3.1.0`.
- `zustand@5.3.0` — versión inexistente. Corregida a `4.5.2`.
- `motion@^12.23.24` — nombre incorrecto del paquete. Corregido a `framer-motion`.
- Causa general: las dependencias fueron generadas sin verificar su existencia en el registro de npm.
- Solución: corrección manual de `package.json` y reinstalación.

**Error: Tailwind v4 con sintaxis de v3**
- El archivo `index.css` usaba `@tailwind base`, `@tailwind components`, `@tailwind utilities` — directivas de Tailwind v3 que no existen en v4.
- También usaba tokens custom como `border-border` y `bg-background` que no estaban definidos en ningún config.
- Solución: reemplazar por `@import "tailwindcss"` y reescribir los estilos base en CSS plano sin depender de tokens indefinidos.

**Error: `baseUrl` removido en TypeScript 5.x**
- `tsconfig.json` incluía `"baseUrl": "."` que fue eliminado en TS 5 y causaba error de compilación.
- Solución: reemplazar por `"paths": { "@/*": ["./src/*"] }`.

**Error: TypeScript no reconocía imports de `.css`**
- `main.tsx` importaba `./index.css` y TypeScript marcaba error porque no tenía declaraciones de tipo para archivos CSS.
- Solución: crear `frontend/src/vite-env.d.ts` con `/// <reference types="vite/client" />`. Este archivo le dice a TypeScript que Vite maneja los assets.

**Error: Warnings de CRLF en Windows**
- Git en Windows convierte saltos de línea LF→CRLF al hacer checkout, generando warnings en cada `git add`.
- Solución: crear `.gitattributes` en la raíz con `* text=auto eol=lf` para normalizar todos los archivos del repo a LF independientemente del sistema operativo.

**Error: `CLAUDE.md` y `mock/` en `.gitignore`**
- Al inicializar el proyecto, Claude Code incluyó `CLAUDE.md` y `mock/` en el `.gitignore` por error.
- Detectado durante la revisión pre-commit.
- Solución: eliminar las entradas del `.gitignore` y agregar ambos archivos al commit manualmente.

**Error: `package-lock.json` en la raíz del repo**
- Se generó un `package-lock.json` en la carpeta raíz en lugar de en `frontend/` porque se corrió `npm install` desde el directorio equivocado.
- Solución: eliminar el archivo de la raíz. El correcto vive en `frontend/` y está en `.gitignore`.

**Error: Días de semana desfasados en el calendario**
- El componente `AttendanceCalendar` usaba `getDay()` de JavaScript, que retorna `0` para domingo. Como el calendario empezaba en lunes, el offset del primer día del mes quedaba desfasado y los fines de semana aparecían en columnas incorrectas.
- Solución: calcular el offset ajustando para que la semana empiece en lunes: `(getDay() + 6) % 7`.

**Error: Botón "Iniciar pase de lista" invisible contra el fondo**
- El botón heredaba estilos de un token de Tailwind que no estaba resolviendo correctamente, resultando en texto y fondo del mismo color.
- Solución: estilos explícitos con valores hex directos — fondo `#2C2C2A`, texto blanco, hover con opacidad 90%.

---

## Estado al Cierre del Sprint

- Repositorio inicializado en GitHub en rama `main`
- Frontend corre con `npm run dev` sin errores ni warnings en Windows
- Design system configurado en `tailwind.config.ts` con tokens exactos del mockup de Figma
- Todas las vistas simulan el flujo completo pero sin llamadas reales al backend
- `CLAUDE.md` documenta el stack, las reglas y la arquitectura para sesiones futuras de Claude Code
- **0 Story Points de backend completados** — todo el trabajo planificado de infraestructura se mueve al Sprint 2

---

---

# Reporte Sprint 2
**Período:** 9 – 21 de Mayo 2026  
**Scrum Master:** Joseph Daniel Rodríguez Flores

---

## Objetivo del Sprint

Implementar el backend completo con FastAPI y PostgreSQL, integrarlo con el frontend para lograr funcionalidad real end-to-end: autenticación institucional, generación de QR con TOTP, validación de geofencing y monitor de asistencia en tiempo real vía WebSocket.

---

## Resumen de Tareas

| ID | Tarea | Estado | Notas |
|----|-------|--------|-------|
| BE-01 | Backend FastAPI — estructura, config, modelos SQLAlchemy | ✅ Listo | Conectado a Neon.tech con SSL requerido por asyncpg |
| BE-02 | Auth JWT + bcrypt + bloqueo de intentos fallidos | ✅ Listo | Bloqueo tras 5 intentos en 15 min usando tabla `intentos_login` |
| BE-03 | TOTP 15s — generación y validación de QR | ✅ Listo | pyotp con ventana de ±1 intervalo para tolerancia de red |
| BE-04 | Geofencing Haversine — centro = ubicación del docente | ✅ Listo | Radio 25m. Coords del alumno nunca persisten en BD |
| BE-05 | WebSocket — monitor en tiempo real | ✅ Listo | WebSocketManager con broadcast por session_id |
| FE-01 | Scanner con cámara real | ✅ Listo | Reescrito 3 veces hasta llegar a getUserMedia + BarcodeDetector/jsQR |
| FE-02 | GPS real en validación de asistencia | ✅ Listo | Solo se solicita al tocar el botón, no al montar el componente |
| FE-03 | Integración completa frontend-backend | ✅ Listo | Axios interceptors, proxy en vite.config.ts, .env.local |
| FE-04 | Flujo docente desde celular para GPS preciso | ✅ Listo | sesion_activa_id en dashboard, botón verde en laptop |

---

## Decisiones Técnicas Tomadas

### 1. Docente inicia el pase de lista desde su celular
**Contexto:** Las laptops no tienen GPS hardware preciso. El error de geolocalización puede ser de 50–200m, mayor que el radio de 25m del geofence, lo que rechazaría alumnos que sí están en el aula.

**Decisión:** El docente inicia el pase de lista desde su celular (que sí tiene GPS preciso). La laptop solo proyecta el QR mediante el botón "Ver pase de lista activo" que aparece cuando ya existe una sesión activa.

**Flujo resultante:**
1. Celular del docente → login → iniciar pase de lista → GPS obtenido
2. Laptop del docente → login → ver pase activo → proyectar QR al salón
3. Celular del estudiante → login → escanear QR → GPS → confirmar

**Nota:** Si el docente cuenta con adaptador HDMI, puede iniciar y proyectar desde la laptop directamente — el flujo original queda intacto.

### 2. Geofencing basado en coordenadas del docente (no del aula)
**Contexto:** El diseño original usaba coordenadas fijas del aula almacenadas en la tabla `aulas`. Esto requería calibrar cada aula manualmente y no funcionaba si el docente daba clase en un aula diferente a la programada.

**Decisión:** Al iniciar la sesión, se guardan las coordenadas del docente en `sesiones_activas.lat_centro` y `lng_centro` como centro del geofence. Al cerrar la sesión, esas columnas se ponen a `NULL`.

**Implicación legal (LFPDPPP):** Las coordenadas del docente se almacenan temporalmente con propósito explícito (referencia del geofence) y se eliminan al cerrar la sesión. Las coordenadas del alumno nunca se persisten.

### 3. Zona horaria América/Mexico_City con pytz
**Contexto:** El servidor guarda timestamps en UTC. México está en UTC-6, lo que causaba que las sesiones creadas después de las 6 PM quedaran registradas con fecha del día siguiente, impidiendo que aparecieran en el dashboard.

**Decisión:** Se integró pytz con `America/Mexico_City` en todos los puntos donde se genera o compara una fecha: creación de sesión, búsqueda de clases del día, y validación de sesiones activas.

---

## Errores Encontrados y Resoluciones

### BE — Backend

**Error: `pyotp` en package.json del frontend**
- Causa: incluida una librería de Python en las dependencias de npm.
- Solución: eliminada manualmente del `package.json`. `pyotp` solo se usa en el backend.

**Error: `CheckViolationError` en `chk_sesion_fin` al cerrar sesiones**
- Causa: El constraint verificaba que `fin_at > inicio_at`, pero por la diferencia de zona horaria UTC vs México, `fin_at` resultaba anterior a `inicio_at`.
- Solución: eliminar el constraint con `ALTER TABLE sesiones_clase DROP CONSTRAINT chk_sesion_fin` y corregir el backend para usar `datetime.utcnow()` de forma consistente.

**Error: Sesiones duplicadas activas para el mismo horario**
- Causa: El endpoint `POST /session/start` no validaba si ya existía una sesión activa para ese horario ese día.
- Solución: validación previa — si ya existe sesión activa para `horario_id + fecha`, retorna HTTP 400 con mensaje claro.

**Error: Horarios duplicados en BD**
- Causa: múltiples ejecuciones del script de seed durante pruebas.
- Solución: `DELETE FROM horarios WHERE id NOT IN (SELECT MIN(id) FROM horarios GROUP BY grupo_id, dia_semana, hora_inicio, hora_fin)`.
- Pendiente: agregar constraint `UNIQUE(grupo_id, dia_semana, hora_inicio)`.

**Error: `sesion_activa_id` siempre `null` en `/classes/today`**
- Causa: la query buscaba sesiones por `fecha = hoy`, pero `hoy` se calculaba en UTC mientras las sesiones se habían creado con fecha local de México.
- Solución: unificar el cálculo de fecha con pytz en creación y búsqueda.

### FE — Frontend

**Error: Cámara no visible en Scanner (imagen "doble")**
- Causa: React StrictMode monta los componentes dos veces en desarrollo, creando dos instancias de `html5-qrcode` simultáneas compitiendo por el mismo `<video>`.
- Solución: reescritura con `getUserMedia` nativo y `useRef` para controlar la instancia.

**Error: `@zxing/browser` — "play() interrupted by new load request"**
- Causa: `@zxing/browser` crea su propio `<video>` internamente y colisionaba con el stream asignado desde el código.
- Diagnóstico: `Get-ChildItem -Recurse frontend\src\ | Select-String "zxing"` confirmó imports activos aunque se había intentado eliminar la librería.
- Solución: desinstalación completa de `@zxing/browser` y `@zxing/library`, reescritura con `getUserMedia` + `BarcodeDetector` + `jsQR` como fallback.

**Error: Cámara bloqueada en iPhone — Safari requiere HTTPS**
- Causa: `getUserMedia` solo funciona en contextos seguros. El frontend corría en HTTP por IP local.
- Solución: ngrok para túnel HTTPS al frontend (`ngrok http 5173`). El backend sigue por IP local.

**Error: CORS bloqueado desde IP de red**
- Causa: el backend solo permitía `localhost:5173`.
- Solución: `allow_origins=["*"]` con `allow_credentials=False` en FastAPI.

**Error: Clases duplicadas en Dashboard**
- Causa: React StrictMode ejecuta `useEffect` dos veces. Ambas llamadas disparaban `fetchClasses()` antes de completarse la primera.
- Solución: eliminar `<React.StrictMode>` en `main.tsx` durante desarrollo + `useRef(false)` como guard.

**Error: `allowedHosts` de Vite bloqueaba dominio de ngrok**
- Causa: Vite 6 cambió la sintaxis. El string `'all'` ya no es válido.
- Solución: `allowedHosts: true` (booleano) en `vite.config.ts`.

---

## Configuración para Pruebas en Red Local

```bash
# Terminal 1 — backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Terminal 2 — frontend
cd frontend
npm run dev -- --host

# Terminal 3 — túnel HTTPS para cámara en iPhone
ngrok http 5173
```

**`frontend/.env.local`:**
```env
VITE_API_URL=http://192.168.X.X:8001
VITE_WS_URL=ws://192.168.X.X:8001
VITE_DEBUG_ALL_CLASSES=true
```

**Credenciales de prueba:**

| Rol | No. Control | Contraseña |
|-----|-------------|------------|
| Docente | `20000001` | `password123` |
| Estudiante | `23121001` | `password123` |

La materia **Testing y Desarrollo (grupo TEST)** está disponible 24/7 con todos los estudiantes inscritos — úsala para pruebas en cualquier horario.

---

## Estado de la BD al Cierre del Sprint

- Neon.tech — proyecto `sga-qr`
- Constraint `chk_sesion_fin` eliminado
- Horarios duplicados limpiados
- Clase TEST activa todos los días incluyendo fines de semana
- 5 estudiantes inscritos en IS/8A y en TEST

---

## Pendientes Detectados para Sprint 3

- Agregar `UNIQUE(grupo_id, dia_semana, hora_inicio)` en tabla `horarios`
- Flujo de justificantes digitales (CU-10, CU-11)
- Reportes exportables en CSV y PDF
- Detección automática de alumnos en riesgo (<80% asistencia)
- Administración de usuarios y catálogos (CU-14, CU-15)
- Despliegue en producción con HTTPS real (Let's Encrypt + Nginx)
- Evaluar QR de activación para que la laptop adopte una sesión creada desde el celular sin segundo login