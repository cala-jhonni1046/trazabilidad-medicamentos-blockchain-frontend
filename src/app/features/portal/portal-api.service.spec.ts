import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PortalApiService } from './portal-api.service';

describe('PortalApiService', () => {
  let api: PortalApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PortalApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta con GET /api/public/consulta-qr/{codigoQr}, codificando el código', () => {
    api.consultarQr('QR UNIT/001').subscribe();
    expect(http.expectOne('/api/public/consulta-qr/QR%20UNIT%2F001').request.method).toBe('GET');
  });

  it('crea el reporte con POST /api/reportes-ciudadanos', () => {
    api.crearReporte({ motivoReporte: 'Envase dañado', codigoUnicoQR: 'QR-1' }).subscribe();
    const req = http.expectOne('/api/reportes-ciudadanos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ motivoReporte: 'Envase dañado', codigoUnicoQR: 'QR-1' });
  });
});
