import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TelemetriaMapaComponent } from './telemetria-mapa.component';
import { GpsMapComponent } from './gps-map.component';
import { TemperaturaChartComponent } from './temperatura-chart.component';
import { SimuladorSensorComponent } from './simulador-sensor.component';
import { SessionService } from '../../core/session/session.service';

describe('Telemetria Components', () => {
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TelemetriaMapaComponent,
        GpsMapComponent,
        TemperaturaChartComponent,
        SimuladorSensorComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('GpsMapComponent', () => {
    it('muestra estado vacío sin lecturas', () => {
      const fixture = TestBed.createComponent(GpsMapComponent);
      fixture.componentInstance.lecturas = [];
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Todavía no hay lecturas');
    });

    it('permite alternar a la tabla de coordenadas', () => {
      const fixture = TestBed.createComponent(GpsMapComponent);
      fixture.componentInstance.lecturas = [
        { id: 1, despachoLogisticoId: 10, latitud: -34.6037, longitud: -58.3816, fechaHora: '2026-10-24T12:00:00', velocidad: 50 },
      ];
      fixture.detectChanges();

      fixture.componentInstance.toggleVista();
      expect(fixture.componentInstance.mostrarTabla).toBe(true);
    });
  });

  describe('TemperaturaChartComponent', () => {
    it('calcula excursiones térmicas correctamente', () => {
      const fixture = TestBed.createComponent(TemperaturaChartComponent);
      fixture.componentInstance.tempMin = 2;
      fixture.componentInstance.tempMax = 8;
      fixture.componentInstance.lecturas = [
        { id: 1, despachoLogisticoId: 10, sensorId: 'S-1', temperatura: 4, alertaExcursion: false, fechaHora: '2026-10-24T10:00:00' },
        { id: 2, despachoLogisticoId: 10, sensorId: 'S-1', temperatura: 9.5, alertaExcursion: true, fechaHora: '2026-10-24T11:00:00' },
      ];
      fixture.detectChanges();

      expect(fixture.componentInstance.totalExcursiones).toBe(1);
      expect(fixture.componentInstance.ultimaLectura?.temperatura).toBe(9.5);
    });
  });

  describe('SimuladorSensorComponent', () => {
    it('emite telemetría simultánea GPS y Temperatura', () => {
      const fixture = TestBed.createComponent(SimuladorSensorComponent);
      fixture.componentInstance.despachoId = 10;
      fixture.detectChanges();

      let emitido = false;
      fixture.componentInstance.lecturaEnviada.subscribe((res) => {
        emitido = true;
        expect(res.alertaExcursion).toBe(true);
      });

      fixture.componentInstance.form.patchValue({
        temperatura: 12.0,
      });

      fixture.componentInstance.enviarLecturas();

      const reqGps = httpMock.expectOne('/api/telemetrias-gps');
      expect(reqGps.request.method).toBe('POST');
      reqGps.flush({ id: 1, latitud: -34.6037, longitud: -58.3816 });

      const reqTemp = httpMock.expectOne('/api/telemetrias-temperatura');
      expect(reqTemp.request.method).toBe('POST');
      reqTemp.flush({ id: 2, sensorId: 'IOT-TERM-01', temperatura: 12.0, alertaExcursion: true });

      expect(emitido).toBe(true);
      expect(fixture.componentInstance.resultadoAlerta()).toBe(true);
    });
  });

  describe('TelemetriaMapaComponent', () => {
    it('ANMAT tiene acceso al simulador y LABORATORIO no', () => {
      sessionService.iniciarSesion(
        { id: 1, email: 'anmat@medichain.gob.ar', rol: 'ANMAT', activo: true },
        null,
      );

      const fixture = TestBed.createComponent(TelemetriaMapaComponent);
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/despachos-logisticos?estado=EN_TRANSITO');
      req.flush([]);

      expect(fixture.componentInstance.esAnmatOSuperadmin()).toBe(true);

      // Cambiar a LABORATORIO
      sessionService.iniciarSesion(
        { id: 2, email: 'lab@medichain.gob.ar', rol: 'LABORATORIO', activo: true },
        { id: 5, nombre: 'Lab', cuit: '30-11', tipo: 'LABORATORIO' },
      );
      expect(fixture.componentInstance.esAnmatOSuperadmin()).toBe(false);
    });
  });
});
