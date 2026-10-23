import assert from 'node:assert/strict';

// Requiere frontend y backend iniciados. Solo elimina lotes creados por esta ejecución.
const base = (process.env.API_BASE_URL || 'http://localhost:4200/api').replace(/\/$/, '');
const creados = new Set();
let comprobaciones = 0;

async function consultar(ruta, opciones = {}) {
  const response = await fetch(`${base}${ruta}`, {
    ...opciones,
    signal: AbortSignal.timeout(15000),
  });
  const texto = await response.text();
  const body = texto ? JSON.parse(texto) : null;
  // Registrar también un alta inesperada para poder limpiarla si una aserción falla.
  if (opciones.method === 'POST' && ruta === '/lotes' && response.ok && body?.id)
    creados.add(body.id);
  return { status: response.status, body };
}

function comprobar(condicion, descripcion) {
  assert.ok(condicion, descripcion);
  comprobaciones++;
  console.log(`OK: ${descripcion}`);
}

const alta = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

try {
  const rutas = [
    '/lotes',
    '/medicamentos',
    '/organizaciones',
    '/despachos-logisticos',
    '/telemetrias-temperatura',
    '/cuarentenas?estado=ABIERTA',
  ];
  const respuestas = await Promise.all(rutas.map((ruta) => consultar(ruta)));
  respuestas.forEach((res, i) =>
    comprobar(res.status === 200 && Array.isArray(res.body), `Lectura ${rutas[i]}`),
  );
  const medicamentos = respuestas[1].body;
  const laboratorio = respuestas[2].body.find((org) => org.tipo === 'LABORATORIO');
  assert.ok(
    medicamentos.length && laboratorio,
    'Se necesita un medicamento y un laboratorio existentes para probar el formulario.',
  );

  const request = {
    codigoLote: `UI-E2E-${Date.now()}`,
    medicamentoId: medicamentos[0].id,
    laboratorioId: laboratorio.id,
    tempMin: 2,
    tempMax: 8,
    fechaHoraFabricacion: '2026-10-22T10:30:00',
  };
  const nuevo = await consultar('/lotes', alta(request));
  comprobar(
    nuevo.status === 201 && Number.isSafeInteger(nuevo.body?.id) && nuevo.body.estado === 'CREADO',
    'Alta real de lote en estado CREADO',
  );
  comprobar(
    nuevo.body.codigoLote === request.codigoLote &&
      nuevo.body.tempMin === 2 &&
      nuevo.body.tempMax === 8,
    'Respuesta del alta compatible con la pantalla',
  );

  const duplicado = await consultar('/lotes', alta(request));
  comprobar(
    duplicado.status === 409 && typeof duplicado.body?.message === 'string',
    'Código duplicado devuelve error H0 y HTTP 409',
  );
  const invalido = await consultar(
    '/lotes',
    alta({ ...request, codigoLote: `${request.codigoLote}-INVALIDO`, tempMin: 9, tempMax: 2 }),
  );
  comprobar(
    invalido.status === 400 && typeof invalido.body?.message === 'string',
    'Rango invertido devuelve HTTP 400',
  );

  const despachos = await consultar(`/despachos-logisticos?loteId=${nuevo.body.id}`);
  comprobar(
    despachos.status === 200 && despachos.body.length === 0,
    'Lote nuevo sin despachos: estado vacío de custodia',
  );
  if (respuestas[3].body.length) {
    const eventos = await consultar(`/despachos-logisticos/${respuestas[3].body[0].id}/eventos`);
    comprobar(
      eventos.status === 200 &&
        eventos.body.every(
          (e) => typeof e.tipo === 'string' && typeof e.fechaHoraEvento === 'string',
        ),
      'Eventos compatibles con la línea de custodia',
    );
  }

  const unidades = await consultar('/unidades-trazables');
  assert.equal(unidades.status, 200);
  if (unidades.body.length) {
    const qr = await consultar(
      `/public/consulta-qr/${encodeURIComponent(unidades.body[0].codigoQr)}`,
    );
    comprobar(
      qr.status === 200 &&
        Array.isArray(qr.body.historialCustodia) &&
        Array.isArray(qr.body.advertencias),
      'Consulta QR real compatible con la pantalla',
    );
  } else {
    console.log('SIN DATOS: no hay una unidad trazable para probar un QR válido.');
  }
  const inexistente = await consultar(`/public/consulta-qr/${request.codigoLote}-INEXISTENTE`);
  comprobar(
    inexistente.status === 404 && typeof inexistente.body?.message === 'string',
    'QR inexistente devuelve HTTP 404 y mensaje H0',
  );
} finally {
  for (const id of creados) {
    const eliminado = await consultar(`/lotes/${id}`, { method: 'DELETE' });
    assert.equal(eliminado.status, 204, `No se pudo limpiar el lote de prueba con ID ${id}`);
    const ausente = await consultar(`/lotes/${id}`);
    assert.equal(ausente.status, 404, `El lote de prueba con ID ${id} sigue disponible`);
    console.log(`Lote de prueba ${id} eliminado y ausencia verificada.`);
  }
}
console.log(`${comprobaciones} comprobaciones de integración correctas.`);
