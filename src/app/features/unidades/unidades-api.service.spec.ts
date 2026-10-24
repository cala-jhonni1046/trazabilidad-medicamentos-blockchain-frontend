import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UnidadesApiService } from './unidades-api.service';
import { UnidadTrazableDto } from './unidades.models';

describe('UnidadesApiService', () => {
  let api: UnidadesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UnidadesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene unidad por código QR', () => {
    api.obtenerPorQr('QR-XYZ-123').subscribe();
    expect(http.expectOne('/api/unidades-trazables/qr/QR-XYZ-123').request.method).toBe('GET');
  });

  it('lista unidades con filtros opcionales de loteId y estado', () => {
    api.listar(4, 'DISPONIBLE').subscribe();
    expect(
      http.expectOne('/api/unidades-trazables?loteId=4&estado=DISPONIBLE').request.method,
    ).toBe('GET');
  });

  it('tolera 404 en dispensación devolviendo null', () => {
    api.obtenerDispensacion(99).subscribe((res) => {
      expect(res).toBeNull();
    });
    const req = http.expectOne('/api/dispensaciones/unidad/99');
    req.flush({ message: 'No dispensada' }, { status: 404, statusText: 'Not Found' });
  });

  it('construye el historial completo uniendo lote, despacho, cuarentenas y eventos', () => {
    const mockUnidad: UnidadTrazableDto = {
      id: 10,
      codigoQr: 'QR-TEST-10',
      loteId: 2,
      estado: 'DISPONIBLE',
    };

    api.construirHistorial('QR-TEST-10').subscribe((res) => {
      expect(res.unidad.codigoQr).toBe('QR-TEST-10');
      expect(res.pasos.length).toBeGreaterThanOrEqual(2);
      expect(res.pasos.some((p) => p.tipo === 'FABRICACION')).toBe(true);
      expect(res.pasos.some((p) => p.tipo === 'CUARENTENA')).toBe(true);
    });

    // 1. Obtener unidad
    const reqQr = http.expectOne('/api/unidades-trazables/qr/QR-TEST-10');
    reqQr.flush(mockUnidad);

    // 2. Consultas dependientes en paralelo
    const reqLote = http.expectOne('/api/lotes/2');
    reqLote.flush({
      id: 2,
      codigoLote: 'LOT-B2',
      medicamentoNombre: 'Ibuprofeno',
      laboratorioNombre: 'Lab Alfa',
      fechaHoraFabricacion: '2026-10-20T10:00:00',
      estado: 'CREADO',
    });

    const reqCuarentenas = http.expectOne('/api/cuarentenas?loteId=2');
    reqCuarentenas.flush([
      { id: 1, loteId: 2, estado: 'ABIERTA', fechaInicio: '2026-10-22T08:00:00', motivo: 'Alerta térmica' },
    ]);

    const reqDespachos = http.expectOne('/api/despachos-logisticos?loteId=2');
    reqDespachos.flush([]);

    const reqDispensacion = http.expectOne('/api/dispensaciones/unidad/10');
    reqDispensacion.flush(null, { status: 404, statusText: 'Not Found' });
  });
});
