import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CuarentenasApiService } from './cuarentenas-api.service';
import { CuarentenaRequest, CuarentenaResolucionRequest } from './cuarentenas.models';

describe('CuarentenasApiService', () => {
  let service: CuarentenasApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CuarentenasApiService],
    });
    service = TestBed.inject(CuarentenasApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar cuarentenas abiertas', () => {
    service.getCuarentenas({ estado: 'ABIERTA' }).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].codigoCuarentena).toBe('CUA-001');
    });

    const req = httpMock.expectOne('/api/cuarentenas?estado=ABIERTA');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, codigoCuarentena: 'CUA-001', estado: 'ABIERTA', loteId: 10 }]);
  });

  it('debe abrir una cuarentena', () => {
    const request: CuarentenaRequest = {
      codigoCuarentena: 'CUA-20261024-001',
      loteId: 10,
      motivo: 'Excursión de temperatura confirmada',
      inspectorResponsableId: 2,
    };

    service.abrirCuarentena(request).subscribe((res) => {
      expect(res.id).toBe(5);
      expect(res.estado).toBe('ABIERTA');
    });

    const req = httpMock.expectOne('/api/cuarentenas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 5, ...request, estado: 'ABIERTA' });
  });

  it('debe liberar una cuarentena', () => {
    const resolucion: CuarentenaResolucionRequest = {
      estado: 'LIBERADA',
      resolucionFinal: 'Análisis microbiológico conforme',
      inspectorResponsableId: 2,
    };

    service.liberarCuarentena(5, resolucion).subscribe((res) => {
      expect(res.estado).toBe('LIBERADA');
    });

    const req = httpMock.expectOne('/api/cuarentenas/5/liberar');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 5, estado: 'LIBERADA' });
  });

  it('debe mantener una cuarentena', () => {
    const resolucion: CuarentenaResolucionRequest = {
      estado: 'MANTENIDA',
      resolucionFinal: 'Riesgo biológico confirmado, lote inutilizado',
      inspectorResponsableId: 2,
    };

    service.mantenerCuarentena(5, resolucion).subscribe((res) => {
      expect(res.estado).toBe('MANTENIDA');
    });

    const req = httpMock.expectOne('/api/cuarentenas/5/mantener');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 5, estado: 'MANTENIDA' });
  });
});
