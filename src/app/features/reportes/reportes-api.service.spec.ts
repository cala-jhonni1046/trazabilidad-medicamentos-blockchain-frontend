import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReportesApiService } from './reportes-api.service';

describe('ReportesApiService', () => {
  let api: ReportesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ReportesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con los filtros opcionales estado e inspectorId', () => {
    api.listar({ estado: 'PENDIENTE', inspectorId: 2 }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/reportes-ciudadanos');
    expect(req.request.params.get('estado')).toBe('PENDIENTE');
    expect(req.request.params.get('inspectorId')).toBe('2');
  });

  it('lista sin filtros no envía parámetros', () => {
    api.listar().subscribe();
    expect(http.expectOne((r) => r.url === '/api/reportes-ciudadanos').request.params.keys().length).toBe(0);
  });

  it('inicia revisión con POST (no PUT)', () => {
    api.iniciarRevision(5, { inspectorAsignadoId: 2 }).subscribe();
    const req = http.expectOne('/api/reportes-ciudadanos/5/iniciar-revision');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ inspectorAsignadoId: 2 });
  });

  it('resuelve con POST (no PUT)', () => {
    api.resolver(5, {}).subscribe();
    const req = http.expectOne('/api/reportes-ciudadanos/5/resolver');
    expect(req.request.method).toBe('POST');
  });

  it('obtiene la unidad por ID y por QR', () => {
    api.obtenerUnidadPorId(1).subscribe();
    expect(http.expectOne('/api/unidades-trazables/1').request.method).toBe('GET');
    api.obtenerUnidadPorQr('QR-1').subscribe();
    expect(http.expectOne('/api/unidades-trazables/qr/QR-1').request.method).toBe('GET');
  });
});
