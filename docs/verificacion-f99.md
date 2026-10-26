# Verificación de cierre (F99)

Base: `main` con los PRs de F1, F2, F3 y F4 integrados (último merge: PR #14).

## Cambios del hito

- Eliminados `src/app/pages/{dashboard,lotes,trazabilidad}`, `src/app/core/medicamentos-api.service.ts` y `src/app/screens.integration.spec.ts`. Ninguna feature los importaba (solo los mencionaban comentarios, que se corrigieron).
- Quitadas de `app.routes.ts` las rutas legadas `dashboard` y `trazabilidad`; `lotes` queda solo como feature.
- La prueba de `mensajeApi` se conservó en `core/http/api-error.spec.ts`.
- Nuevo `shared/models/dominio.ts` con `TipoOrganizacion`, `EstadoEnlace`, `EstadoConformidad` y `EstadoUnidad`; las features lo reexportan. Los DTO (`EnlaceDto`, `DespachoDto`, `EventoCustodiaDto`, `UnidadTrazableLite`, `LoteLite`) se dejan en cada feature a propósito: son proyecciones distintas del mismo contrato.

## Resultados

| Comprobación | Resultado |
|---|---|
| `npm run build` | Correcta. Dos advertencias previas de Dev3: `leaflet.css` supera el presupuesto en 2,5 kB y `leaflet` no es ESM |
| `npm test -- --watch=false` | 201 pruebas correctas en 45 archivos (antes 207: se quitaron 8 de pantallas legadas y se agregaron 2) |
| Recorrido en navegador (API simulada, sin backend) | Los 6 roles ingresan; abren todas las rutas de su menú (15 SUPERADMIN, 13 ANMAT, 7 LABORATORIO, 2 DISTRIBUIDOR, 3 FARMACIA, portal para PACIENTE) sin errores de consola ni de página y ninguna en blanco |

## No verificado

- Recorrido funcional completo con el backend real y el seed (pasos 1 a 16 del guion).
- Responsive a 360 y 768 px, y accesibilidad más allá de lo básico.
- `npm run test:integracion` contra el backend.
- Comportamiento del mapa (Leaflet) con tiles reales: en el sandbox no hay acceso a Internet.

## Observaciones a reportar (no se parchearon)

- `/distribucion/incidente` existe pero no tiene ítem de menú para DISTRIBUIDOR.
- Las advertencias de Leaflet (presupuesto de CSS y módulo no ESM).
