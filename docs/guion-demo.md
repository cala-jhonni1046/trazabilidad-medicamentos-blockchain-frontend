# Guion de la demostración (≈ 15 min)

Prerrequisitos: backend con perfil `demo` en `:8080`, frontend con `npm start` en `:4200`. Cada paso indica rol, usuario del seed y ruta. Después de cada paso, anotar en la columna "Observado" si funcionó (ver checklist de cierre al final).

## Recorrido principal

| # | Rol / usuario | Ruta | Acción | Resultado esperado |
|---|---|---|---|---|
| 1 | SUPERADMIN `superadmin@` | `/usuarios` | Crear un usuario nuevo | Aparece en la tabla; duplicado → mensaje 409 |
| 2 | SUPERADMIN | `/organizaciones` | Crear una organización por tipo (CUIT con o sin guiones) | Alta correcta; CUIT repetido → 409 |
| 3 | SUPERADMIN | `/inspectores`, `/inspectores/auditoria` | Ver inspectores y auditar por DNI | Métricas, suspender/habilitar, búsqueda por DNI |
| 4 | LABORATORIO `laboratorio@` | `/enlaces/solicitud` | Presentar licencia: distribuidor + farmacia por CUIT | Se crea el enlace en estado PENDIENTE y aparece en "Mis solicitudes" |
| 5 | ANMAT `inspector@` | `/enlaces/pendientes` | Aprobar (y otro: rechazar) | Aprobado → ACTIVO; rechazado → RECHAZADO; el contador del menú baja |
| 6 | ANMAT | `/enlaces` | Revisar "Licencias y CUITs" | Listado de solo lectura con filtros |
| 7 | LABORATORIO | `/medicamentos`, `/lotes/nuevo` | Crear lote con unidades | Lote y unidades con QR |
| 8 | LABORATORIO | `/despachos/nuevo` | Despachar el lote por el enlace activo | Despacho creado |
| 9 | DISTRIBUIDOR `distribuidor@` | `/distribucion`, `/distribucion/verificar` | Asumir custodia y verificar bultos | Evento de custodia con hash demostrativo |
| 10 | ANMAT / LABORATORIO | `/telemetria/mapa` | Simular lectura fuera de rango | Excursión visible |
| 11 | ANMAT | `/cuarentenas` | Abrir cuarentena y luego liberarla | Estado del lote cambia |
| 12 | FARMACIA `farmacia@` | `/recepcion` | Recibir el despacho | Recepción registrada |
| 13 | FARMACIA | `/dispensacion` | Dispensar una unidad (DNI y receta) | Unidad DISPENSADA |
| 14 | PACIENTE `paciente@` | `/portal` | Consultar el QR y reportar irregularidad | Estado de la unidad y reporte enviado |
| 15 | ANMAT | `/reportes` | Iniciar revisión y resolver el reporte | Reporte RESUELTO |
| 16 | ANMAT / SUPERADMIN | `/cadenas`, `/cadenas/lote` | Comprobar continuidad de la cadena | Resultado OK o ruptura en el evento N |

Las rutas de la tabla existen en `main` y las abrió un recorrido automatizado por los 6 roles (ver `docs/verificacion-f99.md`). Los textos y resultados exactos de los pasos 7 a 16 hay que confirmarlos a mano con el backend real.

## Casos de error para mostrar (cortos)

- Alta duplicada (usuario o CUIT): el 409 aparece bajo el botón, sin perder lo escrito.
- Aprobar dos veces el mismo enlace (abrir dos pestañas): el segundo muestra el 409 y refresca la bandeja.
- Inspector suspendido (suspenderlo en `/inspectores`, volver a entrar como ese usuario): los botones de resolver quedan bloqueados con el motivo.
- QR inexistente en `/portal`: mensaje claro, no pantalla en blanco.

## Mapa de pantallas por rol (según el menú lateral de `main`)

| Rol | Pantallas |
|---|---|
| SUPERADMIN | `/usuarios`, `/inspectores`, `/inspectores/auditoria`, `/organizaciones`, `/enlaces`, `/enlaces/nuevo`, `/medicamentos`, `/lotes`, `/unidades/auditoria`, `/unidades`, `/despachos`, `/telemetria/mapa`, `/reportes`, `/cadenas`, `/cadenas/lote` |
| ANMAT | `/enlaces/pendientes`, `/enlaces`, `/organizaciones`, `/medicamentos`, `/lotes`, `/unidades/auditoria`, `/unidades`, `/despachos`, `/telemetria/mapa`, `/cuarentenas`, `/reportes`, `/cadenas`, `/cadenas/lote` |
| LABORATORIO | `/enlaces/solicitud`, `/medicamentos`, `/lotes` (y `/lotes/nuevo`), `/laboratorio`, `/telemetria/mapa`, `/unidades`, `/despachos` (y `/despachos/nuevo`) |
| DISTRIBUIDOR | `/distribucion`, `/distribucion/verificar` (y `/distribucion/incidente`, solo por URL: no tiene ítem de menú) |
| FARMACIA | `/recepcion`, `/farmacia`, `/dispensacion` |
| PACIENTE | `/portal` (pública, sin menú) |

## Limitaciones a decir en voz alta

Sin autenticación real; blockchain demostrativa; cuarentena manual; el rechazo de enlace no guarda inspector ni fecha; datos ficticios.

## Checklist de cierre de F99

- [x] Build y tests pasan (ver `docs/verificacion-f99.md`).
- [x] Código legado eliminado (`pages/*`, `core/medicamentos-api.service.ts`, rutas `dashboard` y `trazabilidad`, `screens.integration.spec.ts`).
- [x] Uniones de tipos repetidas movidas a `shared/models/dominio.ts`.
- [ ] Recorrido manual de los 16 pasos con el backend real (perfil `demo`) y consola abierta; anotar por paso observado / no observado / falla.
- [ ] Revisión visual a 360, 768 y 1280 px.
- [ ] `npm run test:integracion` contra el backend con perfil demo.
- Las fallas que aparezcan en el recorrido se registran como fallas a reportar; no se parchean en F99.
