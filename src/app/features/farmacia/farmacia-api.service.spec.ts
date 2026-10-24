import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FarmaciaApiService } from './farmacia-api.service';

describe('FarmaciaApiService', () => {
  let api: FarmaciaApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(FarmaciaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('construye el inventario agrupando por despacho y por lote (sin repetir llamadas)', () => {
    api.inventario(3).subscribe((items) => {
      expect(items.map((i) => i.codigoQr)).toEqual(['QR-A', 'QR-B']);
      expect(items[0].codigoLote).toBe('LOTE-1');
      expect(items[0].medicamentoNombre).toBe('Amoxicilina');
    });

    const reqRecepciones = http.expectOne((r) => r.url === '/api/recepciones-farmacia');
    expect(reqRecepciones.request.params.get('farmaciaId')).toBe('3');
    reqRecepciones.flush([
      { id: 1, farmaciaId: 3, despachoLogisticoId: 10, estadoConformidad: 'CONFORME' },
      { id: 2, farmaciaId: 3, despachoLogisticoId: 10, estadoConformidad: 'CONFORME' }, // mismo despacho: no debe repetir la consulta
      { id: 3, farmaciaId: 3, despachoLogisticoId: 11, estadoConformidad: 'RECHAZADA' }, // rechazada: se ignora
    ]);

    // Solo un despacho único a consultar (10), nunca el 11 (rechazado)
    http.expectOne('/api/despachos-logisticos/10').flush({ id: 10, loteId: 1, estado: 'RECIBIDO' });

    http.expectOne('/api/lotes/1').flush({ id: 1, codigoLote: 'LOTE-1', estado: 'RECIBIDO', medicamentoNombre: 'Amoxicilina' });
    http
      .expectOne((r) => r.url === '/api/unidades-trazables' && r.params.get('loteId') === '1')
      .flush([
        { id: 1, codigoUnicoQR: 'QR-A', loteId: 1, estado: 'DISPONIBLE' },
        { id: 2, codigoUnicoQR: 'QR-B', loteId: 1, estado: 'DISPENSADA' },
      ]);
  });

  it('sin recepciones devuelve inventario vacío sin más llamadas', () => {
    api.inventario(3).subscribe((items) => expect(items).toEqual([]));
    http.expectOne((r) => r.url === '/api/recepciones-farmacia').flush([]);
  });
});
