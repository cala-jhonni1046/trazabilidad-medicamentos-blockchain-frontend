import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CuarentenasDashboardComponent } from './cuarentenas-dashboard.component';
import { AbrirCuarentenaDialogComponent } from './abrir-cuarentena-dialog.component';
import { ResolverCuarentenaDialogComponent } from './resolver-cuarentena-dialog.component';
import { SessionService } from '../../core/session/session.service';

describe('Cuarentenas Components', () => {
  let httpMock: HttpTestingController;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CuarentenasDashboardComponent,
        AbrirCuarentenaDialogComponent,
        ResolverCuarentenaDialogComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('CuarentenasDashboardComponent', () => {
    it('carga métricas, combina telemetría y muestra lotes', () => {
      sessionService.iniciarSesion(
        { id: 1, email: 'inspector@anmat.gob.ar', rol: 'ANMAT', activo: true },
        null,
        { id: 10, usuarioId: 1, nombreCompleto: 'Dr. Rossi', estado: 'HABILITADO' },
      );

      const fixture = TestBed.createComponent(CuarentenasDashboardComponent);
      fixture.detectChanges();

      httpMock.expectOne('/api/lotes').flush([
        { id: 1, codigoLote: 'L-01', medicamentoNombre: 'Amoxicilina', laboratorioId: 5, laboratorioNombre: 'Lab A', estado: 'CREADO' },
      ]);
      httpMock.expectOne('/api/cuarentenas').flush([
        { id: 100, codigoCuarentena: 'CUA-1', estado: 'ABIERTA', loteId: 1, fechaInicio: '2026-10-24T10:00:00', motivo: 'Riesgo' },
      ]);
      httpMock.expectOne('/api/despachos-logisticos').flush([]);
      httpMock.expectOne('/api/telemetrias-temperatura').flush([]);
      httpMock.expectOne('/api/enlaces-cuit?estado=ACTIVO').flush([{ id: 1, laboratorioId: 5, estado: 'ACTIVO' }]);
      httpMock.expectOne('/api/reportes-ciudadanos?estado=PENDIENTE').flush([{ id: 1 }]);

      expect(fixture.componentInstance.lotesEnCuarentenaCount()).toBe(1);
      expect(fixture.componentInstance.cadenasActivasCount()).toBe(1);
      expect(fixture.componentInstance.reportesPendientesCount()).toBe(1);
      expect(fixture.componentInstance.lotesConTelemetria().length).toBe(1);
      expect(fixture.componentInstance.lotesConTelemetria()[0].estado).toBe('EN_CUARENTENA');
      expect(fixture.componentInstance.puedeOperar()).toBe(true);
    });

    it('un inspector suspendido no puede operar resoluciones', () => {
      sessionService.iniciarSesion(
        { id: 2, email: 'suspendido@anmat.gob.ar', rol: 'ANMAT', activo: true },
        null,
        { id: 20, usuarioId: 2, nombreCompleto: 'Dr. Gómez', estado: 'SUSPENDIDO' },
      );

      const fixture = TestBed.createComponent(CuarentenasDashboardComponent);
      fixture.detectChanges();

      httpMock.expectOne('/api/lotes').flush([]);
      httpMock.expectOne('/api/cuarentenas').flush([]);
      httpMock.expectOne('/api/despachos-logisticos').flush([]);
      httpMock.expectOne('/api/telemetrias-temperatura').flush([]);
      httpMock.expectOne('/api/enlaces-cuit?estado=ACTIVO').flush([]);
      httpMock.expectOne('/api/reportes-ciudadanos?estado=PENDIENTE').flush([]);

      expect(fixture.componentInstance.puedeOperar()).toBe(false);
    });
  });

  describe('AbrirCuarentenaDialogComponent', () => {
    it('genera código CUA y valida motivo requerido', () => {
      const dialogRefSpy = { close: vi.fn() };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, AbrirCuarentenaDialogComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              loteId: 1,
              codigoLote: 'L-01',
              medicamentoNombre: 'Paracetamol',
              alertaExcursion: true,
            },
          },
        ],
      });

      const fixture = TestBed.createComponent(AbrirCuarentenaDialogComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.get('codigoCuarentena')?.value).toMatch(/^CUA-\d{8}-\d{3}$/);
      expect(fixture.componentInstance.form.get('motivo')?.value).toContain('excursión térmica');

      fixture.componentInstance.confirmar();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ResolverCuarentenaDialogComponent', () => {
    it('valida resolución final obligatoria', () => {
      const dialogRefSpy = { close: vi.fn() };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NoopAnimationsModule, ResolverCuarentenaDialogComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: dialogRefSpy },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              cuarentenaId: 5,
              codigoCuarentena: 'CUA-100',
              accion: 'LIBERAR',
            },
          },
        ],
      });

      const fixture = TestBed.createComponent(ResolverCuarentenaDialogComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.form.invalid).toBe(true);

      fixture.componentInstance.form.patchValue({
        resolucionFinal: 'Análisis microbiológico apto para consumo',
      });
      expect(fixture.componentInstance.form.valid).toBe(true);

      fixture.componentInstance.confirmar();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'LIBERADA',
          resolucionFinal: 'Análisis microbiológico apto para consumo',
        }),
      );
    });
  });
});
