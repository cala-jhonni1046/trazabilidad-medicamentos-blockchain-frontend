import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RecepcionComponent } from './recepcion.component';
import { SessionService } from '../../core/session/session.service';

describe('RecepcionComponent', () => {
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RecepcionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);

    sessionService.iniciarSesion(
      { id: 3, email: 'farmacia@medichain.gob.ar', rol: 'FARMACIA', activo: true },
      { id: 30, nombre: 'Farmacia San Cayetano', cuit: '30-33333333-3', tipo: 'FARMACIA' },
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista despachos en tránsito dirigidos a la farmacia y permite recepción CONFORME con frío intacto', () => {
    const fixture = TestBed.createComponent(RecepcionComponent);
    fixture.detectChanges();

    // 1. Carga inicial
    const reqDesp = httpMock.expectOne('/api/despachos-logisticos?farmaciaDestinoId=30&estado=EN_TRANSITO');
    reqDesp.flush([
      { id: 10, numeroRemito: 'R-100', loteId: 5, codigoLote: 'L-05', farmaciaDestinoId: 30, estado: 'EN_TRANSITO' },
    ]);

    const reqHist = httpMock.expectOne('/api/recepciones-farmacia?farmaciaId=30');
    reqHist.flush([]);

    // 2. Carga ficha del primer despacho seleccionado
    const reqEvts = httpMock.expectOne('/api/despachos-logisticos/10/eventos');
    reqEvts.flush([]);

    const reqTemps = httpMock.expectOne('/api/telemetrias-temperatura?despachoLogisticoId=10');
    reqTemps.flush([
      { id: 1, temperatura: 4.5, alertaExcursion: false, fechaHora: '2026-10-24T12:00:00' },
    ]);

    expect(fixture.componentInstance.despachos.length).toBe(1);
    expect(fixture.componentInstance.huboExcursionTermica).toBe(false);
    expect(fixture.componentInstance.puedeMarcarConforme).toBe(true);

    // Completar comprobante y enviar
    fixture.componentInstance.form.patchValue({
      numeroComprobante: 'COMP-001',
      estadoConformidad: 'CONFORME',
      cadenaFrioIntacta: true,
    });

    fixture.componentInstance.guardarRecepcion();

    const reqPost = httpMock.expectOne('/api/recepciones-farmacia');
    expect(reqPost.request.method).toBe('POST');
    expect(reqPost.request.body.estadoConformidad).toBe('CONFORME');
    expect(reqPost.request.body.cadenaFrioIntacta).toBe(true);
    reqPost.flush({
      id: 1,
      numeroComprobante: 'COMP-001',
      estadoConformidad: 'CONFORME',
      cadenaFrioIntacta: true,
    });

    // Se recargan los datos tras guardar
    httpMock.expectOne('/api/despachos-logisticos?farmaciaDestinoId=30&estado=EN_TRANSITO').flush([]);
    httpMock.expectOne('/api/recepciones-farmacia?farmaciaId=30').flush([]);
  });

  it('con excursión de temperatura bloquea CONFORME y preselecciona frío no intacto', () => {
    const fixture = TestBed.createComponent(RecepcionComponent);
    fixture.detectChanges();

    httpMock
      .expectOne('/api/despachos-logisticos?farmaciaDestinoId=30&estado=EN_TRANSITO')
      .flush([
        { id: 20, numeroRemito: 'R-200', loteId: 8, codigoLote: 'L-08', farmaciaDestinoId: 30, estado: 'EN_TRANSITO' },
      ]);
    httpMock.expectOne('/api/recepciones-farmacia?farmaciaId=30').flush([]);

    httpMock.expectOne('/api/despachos-logisticos/20/eventos').flush([]);
    httpMock.expectOne('/api/telemetrias-temperatura?despachoLogisticoId=20').flush([
      { id: 1, temperatura: 15.0, alertaExcursion: true, fechaHora: '2026-10-24T12:00:00' },
    ]);

    expect(fixture.componentInstance.huboExcursionTermica).toBe(true);
    expect(fixture.componentInstance.puedeMarcarConforme).toBe(false);
    expect(fixture.componentInstance.form.get('cadenaFrioIntacta')?.value).toBe(false);
    expect(fixture.componentInstance.form.get('estadoConformidad')?.value).toBe('OBSERVADA');
  });
});
