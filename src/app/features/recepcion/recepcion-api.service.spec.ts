import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecepcionApiService } from './recepcion-api.service';
import { RecepcionFarmaciaRequest } from './recepcion.models';

describe('RecepcionApiService', () => {
  let service: RecepcionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RecepcionApiService],
    });
    service = TestBed.inject(RecepcionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe listar despachos EN_TRANSITO para la farmacia', () => {
    service.getDespachosEnTransito(30).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].farmaciaDestinoId).toBe(30);
    });

    const req = httpMock.expectOne(
      '/api/despachos-logisticos?farmaciaDestinoId=30&estado=EN_TRANSITO',
    );
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, numeroRemito: 'R-01', farmaciaDestinoId: 30, estado: 'EN_TRANSITO' },
    ]);
  });

  it('debe registrar la recepcion de la farmacia', () => {
    const request: RecepcionFarmaciaRequest = {
      numeroComprobante: 'COMP-2026-001',
      farmaciaId: 30,
      despachoLogisticoId: 1,
      estadoConformidad: 'CONFORME',
      cadenaFrioIntacta: true,
      farmaceuticoResponsable: 'Farm. Gómez',
    };

    service.crearRecepcion(request).subscribe((res) => {
      expect(res.id).toBe(10);
      expect(res.estadoConformidad).toBe('CONFORME');
    });

    const req = httpMock.expectOne('/api/recepciones-farmacia');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 10, ...request });
  });

  it('debe listar historial de recepciones de la farmacia', () => {
    service.getRecepciones(30).subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/recepciones-farmacia?farmaciaId=30');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 10, numeroComprobante: 'COMP-001', farmaciaId: 30 }]);
  });
});
