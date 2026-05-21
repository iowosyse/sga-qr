# SGA-QR
### Sistema de Gestión de Asistencia Escolar con Validación QR
**Instituto Tecnológico de Morelia**

---

## ¿Qué es SGA-QR?

SGA-QR es una aplicación web que reemplaza el pase de lista manual en el aula. El docente genera un código QR desde su dispositivo y los estudiantes lo escanean con su celular para registrar su asistencia. El sistema verifica automáticamente que el estudiante esté físicamente dentro del aula antes de registrarlo.

---

## ¿Qué necesitas?

- Un navegador web moderno (Chrome, Safari, Firefox)
- Conexión a internet
- Cámara y GPS en tu celular (solo estudiantes)

---

## Cómo usar la aplicación

### Si eres Docente

#### 1. Iniciar el pase de lista

1. Abre la aplicación en tu **celular**
2. Inicia sesión con tu número de control y contraseña
3. En el Dashboard verás tus clases del día
4. Toca **"Iniciar pase de lista"** en la clase correspondiente
5. Permite el acceso a tu ubicación cuando el navegador lo solicite
6. El pase de lista quedará activo

#### 2. Proyectar el código QR

1. Abre la aplicación en la **laptop** conectada al proyector
2. Inicia sesión con las mismas credenciales
3. Verás el botón **"Ver pase de lista activo"** en verde
4. Tócalo — aparecerá el código QR en pantalla grande
5. El código se renueva automáticamente cada 15 segundos
6. En el panel derecho verás en tiempo real quién va registrando asistencia

#### 3. Cerrar el pase de lista

1. Toca el botón **"Cerrar clase"**
2. Confirma la acción en el cuadro de diálogo
3. El QR se invalida y el acta queda guardada

#### 4. Corrección manual

Si un estudiante tuvo un problema técnico, puedes corregir su asistencia:
1. En la lista de estudiantes, toca el ícono de edición junto a su nombre
2. Selecciona el nuevo estado: Presente, Ausente o Justificado
3. El cambio queda registrado con tu nombre como responsable

---

### Si eres Estudiante

#### 1. Registrar tu asistencia

1. Abre la aplicación en tu celular
2. Inicia sesión con tu número de control y contraseña
3. Toca **"Toca para escanear"**
4. Permite el acceso a la cámara
5. Apunta la cámara al código QR que proyecta el docente
6. El sistema detecta el código automáticamente
7. Permite el acceso a tu ubicación cuando se solicite
8. Toca **"Confirmar asistencia"**
9. Verás la pantalla de confirmación con los detalles de tu registro

#### 2. Consultar tu historial

Desde el menú principal puedes ver tu historial de asistencias con fechas, materias y estados.

---

## Mensajes de error comunes

| Mensaje | Qué significa | Qué hacer |
|---------|---------------|-----------|
| "Código QR inválido o expirado" | El QR ya caducó (se renueva cada 15s) | Espera al siguiente código y vuelve a escanear |
| "Tu asistencia ya fue registrada" | Ya registraste asistencia en esta clase | No necesitas hacer nada más |
| "No estás inscrito en esta clase" | No apareces en la lista del grupo | Contacta al docente |
| "Estás fuera del rango del aula" | Tu ubicación está a más de 25m del aula | Asegúrate de estar dentro del salón |
| "Credenciales incorrectas" | No. de control o contraseña incorrectos | Verifica tus datos e intenta de nuevo |
| "Cuenta bloqueada temporalmente" | Demasiados intentos fallidos | Espera 15 minutos e intenta de nuevo |

---

## Preguntas frecuentes

**¿Se guarda mi ubicación?**  
No. Tu ubicación se usa únicamente en el momento del registro para verificar que estás en el aula. No se almacena ni se comparte. Cumplimos con la LFPDPPP.

**¿Qué pasa si no tengo señal GPS?**  
El sistema no podrá verificar tu ubicación y no registrará tu asistencia. Avisa al docente para que haga una corrección manual.

**¿Qué pasa si el QR no se lee bien?**  
Asegúrate de tener buena iluminación y mantén el celular estable. Si el problema persiste, avisa al docente.

**¿Puedo registrar mi asistencia desde casa?**  
No. El sistema verifica que estés físicamente cerca del aula donde el docente inició el pase de lista.

**¿Qué hago si tuve un problema técnico?**  
Informa al docente inmediatamente. Puede corregir tu asistencia manualmente desde su panel.

---

## Contacto y soporte

Para reportar problemas técnicos, contacta al equipo de desarrollo a través del repositorio del proyecto.