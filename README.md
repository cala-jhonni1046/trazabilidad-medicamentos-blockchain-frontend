# MediChain — frontend

Interfaz Angular 22 de MediChain, la plataforma de trazabilidad de medicamentos con cadena de frío para laboratorios, distribuidores y farmacias, bajo la supervisión de ANMAT. Consume el backend Spring Boot (`/api`) y organiza las pantallas por rol: SUPERADMIN, ANMAT, LABORATORIO, DISTRIBUIDOR, FARMACIA y PACIENTE.

El ingreso es con correo y contraseña (JWT). Cada empresa ve solo los datos de su organización; el detalle de permisos está en la documentación del backend (`docs/seguridad.md`).

## Ejecutar localmente

Requiere Node.js compatible con Angular 22 y el backend en `http://localhost:8080`. Para probar con datos de ejemplo, iniciar el backend con el perfil `demo` (ver el README del backend: necesita `JWT_SECRET` y la conexión a MySQL):

```bash
# backend
./mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"

# frontend
npm install
npm start
```

Abrir `http://localhost:4200`. El proxy de `proxy.conf.json` envía `/api` al backend; solo aplica con `npm start`. En un despliegue, el servidor web debe reenviar `/api` al backend.

## Ingreso

En `/login` se ingresa con correo y contraseña. La organización de cada usuario la define el backend; no se elige al ingresar. El token se guarda en `sessionStorage` (clave `medichain_session`), dura 60 minutos y, al vencer, la app vuelve al login con un aviso.

Usuarios del perfil `demo` (contraseña `Demo1234!`, datos ficticios):

| Usuario | Rol |
|---|---|
| `superadmin@medichain.demo` | SUPERADMIN |
| `inspector@medichain.demo` | ANMAT (inspector habilitado) |
| `laboratorio@medichain.demo`, `laboratorio2@medichain.demo` | LABORATORIO |
| `distribuidor@medichain.demo` | DISTRIBUIDOR |
| `farmacia@medichain.demo`, `farmacia2@medichain.demo` | FARMACIA |
| `paciente@medichain.demo` | PACIENTE (solo portal público) |

Un usuario ANMAT solo puede aprobar o rechazar enlaces si tiene un perfil de inspector **habilitado**. Las altas y el reinicio de contraseñas los hace SUPERADMIN desde la pantalla de Usuarios.

## Estructura

Cada feature vive en `src/app/features/<feature>/` con sus rutas (`*.routes.ts`, carga diferida y `roleGuard`) y su ítem de menú (`*.menu.ts`), que se registra en `core/navigation/menu.registry.ts`. Lo compartido está en `src/app/shared` (componentes, pipe `fechaAr`, utilidades de CUIT) y `src/app/core` (sesión, interceptor HTTP, navegación). Convenciones: [docs/convenciones-frontend.md](docs/convenciones-frontend.md).

## Verificación

```bash
npm run build
npm test -- --watch=false
```

Estado de compatibilidad con el contrato: [docs/compatibilidad-backend.md](docs/compatibilidad-backend.md).

## Limitaciones conocidas

- Los hashes de la cadena de custodia se guardan en el sistema y todavía no están anclados a una red blockchain externa.
- La cuarentena es manual (ANMAT la abre y la libera); una excursión de temperatura no la dispara sola.
- No hay renovación de token ni recuperación de contraseña por correo.
- El simulador de telemetría (ANMAT y SUPERADMIN) genera lecturas de prueba, no datos de sensores reales.
