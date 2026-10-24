import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DispensacionApiService } from './dispensacion-api.service';

describe('DispensacionApiService', () => {
  let api: DispensacionApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(DispensacionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca la unidad por GET /api/unidades-trazables/qr/{codigoQr}', () => {
    api.buscarUnidadPorQr('QR-1').subscribe();
    expect(http.expectOne('/api/unidades-trazables/qr/QR-1').request.method).toBe('GET');
  });

  it('crea la dispensación con POST /api/dispensaciones', () => {
    api.crear({ unidadTrazableId: 1, farmaciaId: 3, dniPaciente: '12345678' }).subscribe();
    const req = http.expectOne('/api/dispensaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ unidadTrazableId: 1, farmaciaId: 3, dniPaciente: '12345678' });
  });
});
