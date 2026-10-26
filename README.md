# MediChain — frontend académico

Interfaz Angular 22 de un MVP demostrativo de trazabilidad de medicamentos con cadena de frío. Consume el backend Spring Boot (`/api`) y organiza las pantallas por rol: SUPERADMIN, ANMAT, LABORATORIO, DISTRIBUIDOR, FARMACIA y PACIENTE.

> Proyecto académico. No hay autenticación real, la "blockchain" es demostrativa (hashes encadenados en base de datos) y la cuarentena se abre y se libera manualmente. No cargar datos personales reales.

## Ejecutar localmente

Requiere Node.js compatible con Angular 22 y el backend en `http://localhost:8080` **con el perfil `demo`** (carga los usuarios y datos de ejemplo):

```bash
# backend
./mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"

# frontend
npm install
npm start
```

Abrir `http://localhost:4200`. El proxy de `proxy.conf.json` envía `/api` al backend; solo aplica con `npm start`.

## Cómo se ingresa (sesión simulada)

No hay contraseñas: en `/login` se elige un usuario del backend (y, si corresponde, su organización). Los usuarios del seed son:

| Usuario | Rol |
|---|---|
| `superadmin@medichain.demo` | SUPERADMIN |
| `inspector@medichain.demo` | ANMAT (inspector habilitado) |
| `laboratorio@medichain.demo` | LABORATORIO |
| `distribuidor@medichain.demo` | DISTRIBUIDOR |
| `farmacia@medichain.demo` | FARMACIA |
| `paciente@medichain.demo` | PACIENTE |

Un usuario ANMAT solo puede aprobar/rechazar enlaces si tiene un perfil de inspector **habilitado**. La sesión vive en `sessionStorage`.

## Estructura

Cada feature vive en `src/app/features/<feature>/` con sus rutas (`*.routes.ts`, carga diferida y `roleGuard`) y su ítem de menú (`*.menu.ts`), que se registra en `core/navigation/menu.registry.ts`. Lo compartido está en `src/app/shared` (componentes, pipe `fechaAr`, utilidades de CUIT) y `src/app/core` (sesión, HTTP, navegación). Convenciones: [docs/convenciones-frontend.md](docs/convenciones-frontend.md).

## Guion de la demostración y mapa de pantallas

Ver [docs/guion-demo.md](docs/guion-demo.md): recorrido paso a paso por rol con los usuarios del seed, mapa de pantallas por rol y limitaciones conocidas.

## Verificación

```bash
npm run build
npm test -- --watch=false
npm run test:integracion   # opcional, con frontend y backend (perfil demo) iniciados
```

Estado de compatibilidad con el contrato: [docs/compatibilidad-backend.md](docs/compatibilidad-backend.md).

## Limitaciones conocidas

- Sin autenticación ni autorización real: el rol lo determina el usuario elegido en el login.
- Blockchain demostrativa: los hashes de custodia no prueban autenticidad ni una red distribuida.
- La cuarentena es manual (ANMAT la abre y la libera); una excursión de temperatura no la dispara sola.
- El rechazo de un enlace no registra inspector ni fecha (el contrato actual no lo guarda).
- La relación Usuario ↔ Organización se elige en el login; el backend no la persiste.
- El simulador de telemetría genera lecturas de prueba, no datos de sensores reales.
