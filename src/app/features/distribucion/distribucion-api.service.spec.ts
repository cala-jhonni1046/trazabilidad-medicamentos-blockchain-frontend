import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DistribucionApiService } from './distribucion-api.service';

describe('DistribucionApiService', () => {
  let service: DistribucionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DistribucionApiService],
    });
    service = TestBed.inject(DistribucionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar despachos asignados al distribuidor', () => {
    service.getDespachosDistribuidor(15).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].distribuidorId).toBe(15);
    });

    const req = httpMock.expectOne('/api/despachos-logisticos?distribuidorId=15');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, numeroRemito: 'R-01', distribuidorId: 15, estado: 'PREPARADO' }]);
  });

  it('debe iniciar un despacho', () => {
    service.iniciarDespacho(1, { observaciones: 'Asumiendo custodia' }).subscribe((res) => {
      expect(res.estado).toBe('EN_TRANSITO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos/1/iniciar');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, estado: 'EN_TRANSITO' });
  });

  it('debe consultar unidad trazable por QR', () => {
    service.consultarUnidadPorQr('QR-12345').subscribe((res) => {
      expect(res.id).toBe(10);
      expect(res.estado).toBe('DISPONIBLE');
    });

    const req = httpMock.expectOne('/api/unidades-trazables/qr/QR-12345');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 10, codigoQr: 'QR-12345', loteId: 1, estado: 'DISPONIBLE' });
  });

  it('debe registrar evento de custodia', () => {
    service
      .registrarEvento(1, {
        tipo: 'CUSTODIA_ASUMIDA',
        fechaHoraEvento: '2026-10-24T12:00:00',
        organizacionActorId: 15,
        descripcion: 'Bulto verificado en depósito',
      })
      .subscribe((res) => {
        expect(res.tipo).toBe('CUSTODIA_ASUMIDA');
      });

    const req = httpMock.expectOne('/api/despachos-logisticos/1/eventos');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 50, tipo: 'CUSTODIA_ASUMIDA' });
  });
});
