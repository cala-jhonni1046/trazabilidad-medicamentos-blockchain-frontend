import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnlacesApiService } from './enlaces-api.service';

describe('EnlacesApiService', () => {
  let api: EnlacesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(EnlacesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('resuelve la organización con GET /api/organizaciones/cuit/{cuit}', () => {
    api.buscarOrganizacionPorCuit('30-11111111-1').subscribe();
    expect(http.expectOne('/api/organizaciones/cuit/30-11111111-1').request.method).toBe('GET');
  });

  it('crea con POST /api/enlaces-cuit', () => {
    api.crear({ laboratorioId: 1, distribuidorId: 2, farmaciaId: 3 }).subscribe();
    const req = http.expectOne('/api/enlaces-cuit');
    expect(req.request.method).toBe('POST');
    expect(Object.keys(req.request.body as object).sort()).toEqual([
      'distribuidorId',
      'farmaciaId',
      'laboratorioId',
    ]);
  });

  it('lista con los filtros opcionales estado y laboratorioId', () => {
    api.listar({ laboratorioId: 7, estado: 'PENDIENTE' }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/enlaces-cuit');
    expect(req.request.params.get('laboratorioId')).toBe('7');
    expect(req.request.params.get('estado')).toBe('PENDIENTE');
    api.listar().subscribe();
    expect(http.expectOne((r) => r.url === '/api/enlaces-cuit').request.params.keys().length).toBe(0);
  });

  it('aprueba y rechaza con POST a /aprobar y /rechazar', () => {
    api.aprobar(5, { inspectorId: 9, numeroDisposicionANMAT: 'D-1' }).subscribe();
    const a = http.expectOne('/api/enlaces-cuit/5/aprobar');
    expect(a.request.method).toBe('POST');
    expect(a.request.body).toEqual({ inspectorId: 9, numeroDisposicionANMAT: 'D-1' });
    api.rechazar(5, { inspectorId: 9 }).subscribe();
    expect(http.expectOne('/api/enlaces-cuit/5/rechazar').request.method).toBe('POST');
  });
});
