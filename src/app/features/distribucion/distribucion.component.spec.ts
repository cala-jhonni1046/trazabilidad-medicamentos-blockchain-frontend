import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DistribucionDashboardComponent } from './distribucion-dashboard.component';
import { VerificarBultoComponent } from './verificar-bulto.component';
import { IncidenteComponent } from './incidente.component';
import { SessionService } from '../../core/session/session.service';

describe('Distribucion Components', () => {
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DistribucionDashboardComponent,
        VerificarBultoComponent,
        IncidenteComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);

    sessionService.iniciarSesion(
      { id: 2, email: 'distro@medichain.gob.ar', rol: 'DISTRIBUIDOR', activo: true },
      { id: 15, nombre: 'Distribuidora Logística Central', cuit: '30-22222222-2', tipo: 'DISTRIBUIDOR' },
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('DistribucionDashboardComponent', () => {
    it('carga las cargas asignadas a la distribuidora de la sesión', () => {
      const fixture = TestBed.createComponent(DistribucionDashboardComponent);
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/despachos-logisticos?distribuidorId=15');
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 1, numeroRemito: 'R-01', distribuidorId: 15, loteId: 10, estado: 'PREPARADO' },
      ]);

      expect(fixture.componentInstance.cargas.length).toBe(1);
      expect(fixture.componentInstance.cargas[0].numeroRemito).toBe('R-01');
    });
  });

  describe('VerificarBultoComponent', () => {
    it('rechaza un QR que pertenece a otro lote y no registra evento', () => {
      const fixture = TestBed.createComponent(VerificarBultoComponent);
      fixture.detectChanges();

      const reqDesp = httpMock.expectOne('/api/despachos-logisticos?distribuidorId=15');
      reqDesp.flush([
        { id: 1, numeroRemito: 'R-01', distribuidorId: 15, loteId: 10, estado: 'PREPARADO', codigoLote: 'LOTE-10' },
      ]);

      fixture.componentInstance.form.patchValue({
        despachoId: 1,
        codigoQr: 'QR-OTRO-LOTE',
      });
      fixture.componentInstance.onDespachoChange(1);

      fixture.componentInstance.verificar();

      const reqQr = httpMock.expectOne('/api/unidades-trazables/qr/QR-OTRO-LOTE');
      reqQr.flush({
        id: 99,
        codigoQr: 'QR-OTRO-LOTE',
        loteId: 20, // Lote diferente a 10
        codigoLote: 'LOTE-20',
        estado: 'DISPONIBLE',
      });

      // No debe enviar evento a la api
      httpMock.expectNone('/api/despachos-logisticos/1/eventos');
      expect(fixture.componentInstance.resultado?.valido).toBe(false);
      expect(fixture.componentInstance.resultado?.motivo).toContain('Lote #20');
    });

    it('acepta un QR correcto y registra evento CUSTODIA_ASUMIDA', () => {
      const fixture = TestBed.createComponent(VerificarBultoComponent);
      fixture.detectChanges();

      const reqDesp = httpMock.expectOne('/api/despachos-logisticos?distribuidorId=15');
      reqDesp.flush([
        { id: 1, numeroRemito: 'R-01', distribuidorId: 15, loteId: 10, estado: 'PREPARADO', codigoLote: 'LOTE-10' },
      ]);

      fixture.componentInstance.form.patchValue({
        despachoId: 1,
        codigoQr: 'QR-VALIDO-LOTE10',
      });
      fixture.componentInstance.onDespachoChange(1);

      fixture.componentInstance.verificar();

      const reqQr = httpMock.expectOne('/api/unidades-trazables/qr/QR-VALIDO-LOTE10');
      reqQr.flush({
        id: 101,
        codigoQr: 'QR-VALIDO-LOTE10',
        loteId: 10,
        codigoLote: 'LOTE-10',
        estado: 'DISPONIBLE',
      });

      const reqEvt = httpMock.expectOne('/api/despachos-logisticos/1/eventos');
      expect(reqEvt.request.method).toBe('POST');
      expect(reqEvt.request.body.tipo).toBe('CUSTODIA_ASUMIDA');
      reqEvt.flush({ id: 50, tipo: 'CUSTODIA_ASUMIDA' });

      expect(fixture.componentInstance.resultado?.valido).toBe(true);
      expect(fixture.componentInstance.resultado?.eventoRegistrado).toBe(true);
    });
  });

  describe('IncidenteComponent', () => {
    it('renderiza la limitación informativa del backend', () => {
      const fixture = TestBed.createComponent(IncidenteComponent);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent;
      expect(text).toContain('Requisito 2.4');
      expect(text).toContain('INCIDENTE_EN_RUTA');
    });
  });
});
