# Convenciones del frontend (MediChain)

Documento de referencia para las 4 issues del frontend (F1 a F4). Describe lo que implementa el Hito F00; si algo cambia en el código, se actualiza acá.

## Estructura

```
src/app/
  core/
    http/api-error.ts          mensajeApi() y extraerFieldErrors() (formato de error H0)
    navigation/menu.registry.ts  registro de menús (suma los arrays de cada feature)
    navigation/role-home.ts      ROLE_HOME: pantalla de inicio de cada rol
    session/session.service.ts   sesión simulada (signals)
    session/auth.guards.ts       authGuard y roleGuard(roles)
    medicamentos-api.service.ts  servicio LEGADO: no se amplía
  features/<feature>/
    <feature>.routes.ts          export const X_ROUTES: Routes
    <feature>.menu.ts            export const X_MENU: MenuItem[]
    (componentes y servicios propios de la feature)
  shared/                        componentes, pipes y utilidades comunes
  layout/                        layout con menú lateral por rol
  pages/                         pantallas legadas (dashboard, lotes, trazabilidad)
```

Cada dev trabaja solo dentro de las carpetas `features/` de sus hitos. `app.routes.ts` declara una ruta lazy por feature y no se vuelve a tocar; tampoco `core/` ni `shared/` salvo que el hito lo indique.

## Cómo agregar una pantalla

1. Crear el componente standalone dentro de `features/<feature>/`.
2. Registrar la ruta en `<feature>.routes.ts`, protegida con `roleGuard`:
   ```ts
   export const ORGANIZACIONES_ROUTES: Routes = [
     {
       path: '',
       canActivate: [roleGuard(['SUPERADMIN', 'ANMAT'])],
       loadComponent: () => import('./organizaciones.component').then((m) => m.OrganizacionesComponent),
     },
   ];
   ```
3. Agregar la entrada de menú en `<feature>.menu.ts`:
   ```ts
   export const ORGANIZACIONES_MENU: MenuItem[] = [
     { path: '/organizaciones', title: 'Organizaciones', icon: 'business', roles: ['SUPERADMIN', 'ANMAT'] },
   ];
   ```
4. El layout lee `MENU_REGISTRY` y filtra por el rol de la sesión: no hay que tocar el layout.

Las rutas de cada feature son las del contrato de rutas del issue (cada ruta tiene un único dueño). Rutas públicas: `/login` y `/portal`.

## Sesión simulada

El backend no tiene autenticación. El ingreso es una **selección de usuario** del seed, no un login con credenciales.

- `SessionService` guarda `{ usuario, organizacion?, inspector? }` en signals y en `sessionStorage` (dentro de try/catch; si falla, sigue en memoria).
- LABORATORIO, DISTRIBUIDOR y FARMACIA eligen además una organización del tipo que les corresponde. El backend no vincula usuarios con organizaciones.
- ANMAT resuelve su perfil de inspector con `GET /api/inspectores/usuario/{id}`. Si el inspector está SUSPENDIDO, `session.puedeResolver()` es `false` y las acciones de resolución quedan deshabilitadas (solo lectura).
- Se leen con `session.usuario()`, `session.rol()`, `session.organizacion()` y `session.inspector()`.
- Todas las pantallas muestran el aviso de demostración académica. No se usan datos personales reales.

## Inicio por rol (ROLE_HOME)

| Rol | Inicio |
|---|---|
| SUPERADMIN | `/inspectores` |
| ANMAT | `/cuarentenas` |
| LABORATORIO | `/laboratorio` |
| DISTRIBUIDOR | `/distribucion` |
| FARMACIA | `/farmacia` |
| PACIENTE | `/portal` |

Mientras una pantalla no exista, la ruta muestra el componente `Placeholder` ("Pantalla en construcción"), con opción de volver al inicio o cerrar sesión.

## Llamadas a la API y errores

- Rutas relativas `/api/...`: el proxy de desarrollo (`proxy.conf.json`) las reenvía a `http://localhost:8080`; no se necesita CORS.
- Un servicio propio por feature, con tipos TypeScript que reflejen los DTO del OpenAPI. No se amplía `core/medicamentos-api.service.ts`.
- Se consumen solo endpoints existentes. Si falta algo, se reporta como limitación; no se simula.
- Los errores usan el formato H0 (`timestamp`, `status`, `code`, `message`, `path`, `fieldErrors`). Se muestran con `mensajeApi(error)`; para marcar campos de un formulario, `extraerFieldErrors(error)`. `status 0` significa backend caído.
- Toda pantalla tiene estado de carga, vacío y error con reintento. Los botones se deshabilitan durante los envíos y las acciones destructivas piden confirmación.

## Componentes compartidos (`shared/`)

`StatusBadge` (estado a color), `PageHeader`, `EmptyState`, `ErrorAlert` (con reintento), `ConfirmDialog`, `LoadingOverlay`, `Placeholder`, pipe `fechaAr` (es-AR) y utilidades de CUIT (`normalizarCuit` y validador).

## UI

Angular Material, responsive desde 360 px, accesible (labels y aria), fechas es-AR. Sin `console.log` ni `any`; sin dependencias nuevas salvo indicación del hito.

## Ramas y entrega

| Issue | Dev | Rama |
|---|---|---|
| F1 | Dev1 | `feature/f1-identidad-habilitaciones` |
| F2 | Dev2 | `feature/f2-produccion-lotes-unidades` |
| F3 | Dev3 | `feature/f3-logistica-iot-recepcion` |
| F4 | Dev4 | `feature/f4-ciudadania-dispensacion-inmutabilidad` |

El Hito F00 (base) entra primero a `main` con un PR corto. Después, un PR por hito.

## Reporte final de cada hito

(a) archivos nuevos y modificados con el motivo; (b) rutas y endpoints realmente usados; (c) reglas implementadas; (d) comandos ejecutados y su resultado exacto; (e) qué no se pudo verificar (navegador, backend en vivo); (f) dudas o decisiones pendientes; (g) confirmación de que no se ejecutaron comandos git.

## Comandos

```
npm start                      # ng serve con proxy a localhost:8080
npm run build
npm test -- --watch=false
```

El backend se levanta con el perfil `demo` para cargar el seed: `./mvnw spring-boot:run "-Dspring-boot.run.profiles=demo"`.
