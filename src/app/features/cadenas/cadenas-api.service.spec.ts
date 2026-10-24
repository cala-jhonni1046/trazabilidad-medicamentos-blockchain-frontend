import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CadenasApiService } from './cadenas-api.service';

describe('CadenasApiService', () => {
  let api: CadenasApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(CadenasApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista enlaces con estado=ACTIVO', () => {
    api.listarEnlacesActivos().subscribe();
    const req = http.expectOne((r) => r.url === '/api/enlaces-cuit');
    expect(req.request.params.get('estado')).toBe('ACTIVO');
  });

  it('busca un lote por código recorriendo el listado completo (sin endpoint propio)', () => {
    api.obtenerLotePorCodigo('LOTE-2').subscribe((l) => expect(l?.id).toBe(2));
    http.expectOne('/api/lotes').flush([
      { id: 1, codigoLote: 'LOTE-1', estado: 'CREADO', laboratorioId: 1 },
      { id: 2, codigoLote: 'LOTE-2', estado: 'RECIBIDO', laboratorioId: 1 },
    ]);
  });

  it('un código inexistente resuelve a null, no a un error', () => {
    api.obtenerLotePorCodigo('NO-EXISTE').subscribe((l) => expect(l).toBeNull());
    http.expectOne('/api/lotes').flush([{ id: 1, codigoLote: 'LOTE-1', estado: 'CREADO', laboratorioId: 1 }]);
  });

  it('normaliza una respuesta vacía (204/sin cuerpo) de registros-blockchain a []', () => {
    api.listarRegistros().subscribe((registros) => expect(registros).toEqual([]));
    http.expectOne('/api/registros-blockchain').flush(null as unknown as []);
  });

  it('crea un registro demostrativo con POST /api/registros-blockchain', () => {
    api.crearRegistro({ transactionHash: 'hash-1', confirmado: false }).subscribe();
    const req = http.expectOne('/api/registros-blockchain');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ transactionHash: 'hash-1', confirmado: false });
  });
});
