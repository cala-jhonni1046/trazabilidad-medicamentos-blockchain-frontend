import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TelemetriaApiService } from './telemetria-api.service';
import { TelemetriaGPSRequest, TelemetriaTemperaturaRequest } from './telemetria.models';

describe('TelemetriaApiService', () => {
  let service: TelemetriaApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TelemetriaApiService],
    });
    service = TestBed.inject(TelemetriaApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe obtener despachos EN_TRANSITO', () => {
    service.getDespachosEnTransito().subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].estado).toBe('EN_TRANSITO');
    });

    const req = httpMock.expectOne('/api/despachos-logisticos?estado=EN_TRANSITO');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, numeroRemito: 'REM-1', estado: 'EN_TRANSITO' }]);
  });

  it('debe obtener lecturas GPS de un despacho', () => {
    service.getLecturasGps(1).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].latitud).toBe(-34.6037);
    });

    const req = httpMock.expectOne('/api/telemetrias-gps?despachoLogisticoId=1');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, despachoLogisticoId: 1, latitud: -34.6037, longitud: -58.3816, fechaHora: '2026-10-24T12:00:00' }]);
  });

  it('debe registrar lectura GPS', () => {
    const request: TelemetriaGPSRequest = {
      despachoLogisticoId: 1,
      latitud: -34.6037,
      longitud: -58.3816,
      fechaHora: '2026-10-24T12:00:00',
    };

    service.registrarGps(request).subscribe((res) => {
      expect(res.id).toBe(100);
    });

    const req = httpMock.expectOne('/api/telemetrias-gps');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 100, ...request });
  });

  it('debe obtener y registrar lecturas de temperatura', () => {
    const reqTemp: TelemetriaTemperaturaRequest = {
      despachoLogisticoId: 1,
      sensorId: 'TEMP-01',
      temperatura: 4.5,
      fechaHora: '2026-10-24T12:00:00',
    };

    service.registrarTemperatura(reqTemp).subscribe((res) => {
      expect(res.alertaExcursion).toBe(false);
    });

    const req = httpMock.expectOne('/api/telemetrias-temperatura');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 200, ...reqTemp, alertaExcursion: false });
  });
});
