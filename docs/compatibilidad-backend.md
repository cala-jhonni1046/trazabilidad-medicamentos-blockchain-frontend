# Correspondencia de pantallas con el backend

Revisión de `release/profesor` contra el OpenAPI 3.1 entregado por el profesor (21 de octubre de 2026). El frontend tiene tres pantallas.

| Pantalla | Contrato utilizado | Ajuste aplicado |
|---|---|---|
| Dashboard | `GET /api/lotes`, `/api/despachos-logisticos`, `/api/telemetrias-temperatura`, `/api/cuarentenas?estado=ABIERTA` | Contadores y últimas lecturas calculados con datos reales. Se quitaron cifras fijas, nodo testnet y supuesta cuarentena automática. |
| Lotes | `GET/POST /api/lotes`, `GET /api/medicamentos`, `GET /api/organizaciones` | Listado según `LoteResponseDTO` y alta individual según `LoteRequestDTO`. Medicamento y laboratorio se eligen por ID existente; el estado inicial lo asigna el backend. |
| Trazabilidad | `GET /api/despachos-logisticos?loteId=...`, `GET /api/despachos-logisticos/{id}/eventos`, `GET /api/public/consulta-qr/{codigoQr}` | Selección de lote, hitos de custodia registrados y consulta QR con su respuesta pública. Los hashes se identifican como demostrativos. No se presentan pasos ficticios de ANMAT ni smart contracts. |

El layout ya no atribuye un rol autenticado al visitante. El frontend muestra errores H0 cuando el backend los devuelve y avisa si el servicio no está disponible. El endpoint interno de eventos puede contener textos libres; esta interfaz no muestra esos textos ni datos del actor porque no existe autenticación.

El backend incluye otros módulos (enlaces, recepciones, dispensaciones, usuarios, inspectores y reportes) que esta rama del frontend todavía no tenía como pantallas. No se anuncian en la navegación ni se simula que estén implementados en la interfaz.

## Cierre y verificación del 22 de octubre de 2026

Se completaron los flujos de las tres pantallas existentes en `release/profesor`:

- Panel: una consulta fallida no oculta los demás contadores. Una métrica no disponible se muestra con `—`, en lugar de presentarla como cero; permite reintentar.
- Lotes: las selecciones vacías son inválidas, se valida el rango térmico y se bloquean envíos repetidos. Después del alta se reinicia el formulario y se recarga el listado. Los errores conservan los datos ingresados. Los límites térmicos parciales se muestran sin ocultarlos.
- Trazabilidad: carga y reintento del selector, selección persistida en la URL, cancelación de consultas anteriores al cambiar de lote y actualización de custodia. Los errores se distinguen de una lista vacía. El QR presenta también principio activo, cadena de frío, fabricación y cuarentena cuando esos campos están disponibles.
- Las respuestas asíncronas notifican el cambio de vista y las suscripciones se liberan al salir. Se ajustó el salto de línea de hashes en pantallas estrechas y las fechas utilizan formato regional argentino.

Resultados:

| Comprobación | Resultado |
|---|---|
| `npm run build` | Correcta |
| `npm test -- --watch=false` | 9 pruebas correctas en 2 archivos |
| `API_BASE_URL=http://127.0.0.1:4300/api npm run test:integracion` | 14 comprobaciones correctas contra Spring Boot, pasando por el proxy Angular |
| Navegador real | Panel y menú lateral; validación y alta de lote; listado actualizado; enlace a custodia; eventos; QR válido e inexistente |
| Limpieza | Eliminados exclusivamente los dos lotes creados por las pruebas; verificada su ausencia con HTTP 404 |

La prueba de integración crea temporalmente un lote con prefijo `UI-E2E-`, verifica duplicados y rangos inválidos y elimina su propio registro en `finally`. Necesita al menos un medicamento y un laboratorio existentes. Consulta un QR válido si hay unidades trazables disponibles. La prueba manual del navegador utilizó un segundo lote identificable, también eliminado al finalizar. No se modificó código del backend ni registros preexistentes.

El alcance sigue siendo panel, consulta/alta de lotes y trazabilidad/QR. Editar o eliminar lotes desde la interfaz y gestionar despachos, recepciones u otros módulos requiere pantallas o acciones adicionales.
