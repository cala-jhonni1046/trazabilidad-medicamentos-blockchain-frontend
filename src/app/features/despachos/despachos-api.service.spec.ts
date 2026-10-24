import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DespachosApiService } from './despachos-api.service';
import { DespachoLogisticoRequest } from './despachos.models';

describe('DespachosApiService', () => {
  let service: DespachosApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DespachosApiService],
    });
    service = TestBed.inject(DespachosApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar despachos con filtros', () => {
    service.getDespachos({ estado: 'EN_TRANSITO', loteId: 5 }).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].id).toBe(1);
    });

    const req = httpMock.expectOne('/api/despachos-logisticos?loteId=5&estado=EN_TRANSITO');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, numeroRemito: 'R-123', estado: 'EN_TRANSITO' }]);
  });

  it('debe crear un despacho logístico', () => {
    const request: DespachoLogisticoRequest = {
      loteId: 1,
      enlaceCuitId: 2,
      distribuidorId: 3,
      numeroRemito: 'REM-001',
    };

    service.crearDespacho(request).subscribe((res) => {
      expect(res.id).toBe(10);
      expect(res.estado).toBe('PREPARADO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 10, ...request, estado: 'PREPARADO' });
  });

  it('debe iniciar un despacho', () => {
    service.iniciarDespacho(10, { observaciones: 'Salida autorizada' }).subscribe((res) => {
      expect(res.estado).toBe('EN_TRANSITO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos/10/iniciar');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 10, estado: 'EN_TRANSITO' });
  });

  it('debe cancelar un despacho', () => {
    service.cancelarDespacho(10, { observaciones: 'Vehículo averiado' }).subscribe((res) => {
      expect(res.estado).toBe('CANCELADO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos/10/cancelar');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 10, estado: 'CANCELADO' });
  });

  it('debe obtener eventos de custodia', () => {
    service.getEventos(10).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].tipo).toBe('LOTE_DESPACHADO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos/10/eventos');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, tipo: 'LOTE_DESPACHADO', fechaHoraEvento: '2026-10-24T12:00:00' }]);
  });
});
