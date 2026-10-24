import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LotesApiService } from './lotes-api.service';
import { LoteRequest } from './lotes.models';

describe('LotesApiService', () => {
  let api: LotesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LotesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con GET /api/lotes y admite filtro de laboratorioId', () => {
    api.listar().subscribe();
    expect(http.expectOne('/api/lotes').request.method).toBe('GET');

    api.listar(5).subscribe();
    expect(http.expectOne('/api/lotes?laboratorioId=5').request.method).toBe('GET');
  });

  it('obtiene por ID con GET /api/lotes/{id}', () => {
    api.obtenerPorId(12).subscribe();
    expect(http.expectOne('/api/lotes/12').request.method).toBe('GET');
  });

  it('crea con POST /api/lotes', () => {
    const body: LoteRequest = {
      codigoLote: 'LOT-99',
      medicamentoId: 1,
      laboratorioId: 2,
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T10:00:00',
    };
    api.crear(body).subscribe();
    const req = http.expectOne('/api/lotes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('elimina con DELETE /api/lotes/{id}', () => {
    api.eliminar(8).subscribe();
    expect(http.expectOne('/api/lotes/8').request.method).toBe('DELETE');
  });

  it('obtiene unidades por lote con GET /api/unidades-trazables?loteId=', () => {
    api.obtenerUnidadesPorLote(8).subscribe();
    expect(http.expectOne('/api/unidades-trazables?loteId=8').request.method).toBe('GET');
  });

  it('generarUnidades usa POST /api/lotes/{id}/unidades cuando está disponible', () => {
    api.generarUnidades(8, 20).subscribe((res) => {
      expect(res.fallbackUsado).toBe(false);
      expect(res.unidades.length).toBe(1);
    });

    const req = http.expectOne('/api/lotes/8/unidades');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cantidad: 20 });
    req.flush([{ id: 1, codigoQr: 'QR-1', loteId: 8, estado: 'DISPONIBLE' }]);
  });

  it('generarUnidades activa fallback secuencial si el endpoint nuevo responde 404', () => {
    api.generarUnidades(8, 2).subscribe((res) => {
      expect(res.fallbackUsado).toBe(true);
      expect(res.unidades.length).toBe(2);
    });

    const reqPrincipal = http.expectOne('/api/lotes/8/unidades');
    reqPrincipal.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    const reqSeq1 = http.expectOne('/api/unidades-trazables');
    expect(reqSeq1.request.method).toBe('POST');
    reqSeq1.flush({ id: 101, codigoQr: 'QR-101', loteId: 8, estado: 'DISPONIBLE' });

    const reqSeq2 = http.expectOne('/api/unidades-trazables');
    expect(reqSeq2.request.method).toBe('POST');
    reqSeq2.flush({ id: 102, codigoQr: 'QR-102', loteId: 8, estado: 'DISPONIBLE' });
  });
});
