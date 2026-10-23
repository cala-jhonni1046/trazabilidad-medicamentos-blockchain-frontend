# MediChain — frontend académico

Interfaz Angular para consultar datos del backend de trazabilidad de medicamentos. La rama `release/profesor` contiene tres pantallas: panel general, lotes y trazabilidad. Utilizan los endpoints documentados en el OpenAPI del backend; la interfaz no simula una testnet, autenticación ni telemetría en tiempo real.

## Ejecutar localmente

Requiere Node.js y npm compatibles con Angular 22, y el backend Spring Boot escuchando en `http://localhost:8080`.

```bash
npm install
npm start
```

Abrir `http://localhost:4200`. El proxy de desarrollo en `proxy.conf.json` envía `/api` a `http://localhost:8080`. Para otro puerto de backend, ajustar ese archivo. En producción, el servidor que aloje el frontend debe enviar `/api` al backend; el proxy de Angular solo se aplica durante `npm start`.

## Pantallas y contrato

- Dashboard: `GET /api/lotes`, `/api/despachos-logisticos`, `/api/telemetrias-temperatura` y `/api/cuarentenas?estado=ABIERTA`. Calcula los contadores con las respuestas y muestra las últimas lecturas registradas.
- Lotes: lista con `GET /api/lotes`; formulario de alta individual con `POST /api/lotes`. Las opciones se obtienen de `/api/medicamentos` y `/api/organizaciones` filtrando laboratorios. El backend asigna `CREADO` al lote.
- Trazabilidad: despachos de un lote con `GET /api/despachos-logisticos?loteId=...`, eventos con `GET /api/despachos-logisticos/{id}/eventos` y consulta pública con `GET /api/public/consulta-qr/{codigoQr}`.

Los errores H0 se muestran en pantalla. El backend actual no autentica usuarios; no ingresar datos personales reales. Los hashes de custodia son demostrativos y no prueban autenticidad ni una blockchain distribuida.

## Verificar las pantallas

```bash
npm test -- --watch=false
npm run build
```

Con frontend y backend iniciados, ejecutar en otra terminal:

```bash
npm run test:integracion
```

La integración usa `http://localhost:4200/api` y comprueba las respuestas reales a través del proxy, incluido crear y eliminar su propio lote de prueba. Necesita un medicamento y un laboratorio previamente registrados. Para otro puerto del frontend:

```bash
API_BASE_URL=http://127.0.0.1:4300/api npm run test:integracion
```

Los resultados y el alcance están en [docs/compatibilidad-backend.md](docs/compatibilidad-backend.md).
