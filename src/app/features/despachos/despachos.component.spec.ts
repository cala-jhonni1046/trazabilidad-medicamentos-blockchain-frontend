import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DespachoNuevoComponent } from './despacho-nuevo.component';
import { DespachosListComponent } from './despachos-list.component';
import { DespachoDetalleComponent } from './despacho-detalle.component';
import { SessionService } from '../../core/session/session.service';

describe('Despachos Components', () => {
  let httpMock: HttpTestingController;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DespachoNuevoComponent,
        DespachosListComponent,
        DespachoDetalleComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);

    sessionService.iniciarSesion(
      { id: 1, email: 'lab@medichain.gob.ar', rol: 'LABORATORIO', activo: true },
      { id: 10, nombre: 'Laboratorio Alfa', cuit: '30-11111111-1', tipo: 'LABORATORIO' },
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('DespachoNuevoComponent', () => {
    it('carga lotes y enlaces activos del laboratorio y precarga temperatura al seleccionar lote', () => {
      const fixture = TestBed.createComponent(DespachoNuevoComponent);
      fixture.detectChanges();

      const reqLotes = httpMock.expectOne('/api/lotes');
      reqLotes.flush([
        { id: 1, codigoLote: 'L-01', laboratorioId: 10, tempMin: 2, tempMax: 8, medicamentoNombre: 'Ibuprofeno' },
      ]);

      const reqEnlaces = httpMock.expectOne('/api/enlaces-cuit?estado=ACTIVO');
      reqEnlaces.flush([
        {
          id: 5,
          laboratorioId: 10,
          distribuidorId: 20,
          distribuidorNombre: 'Distro S.A.',
          farmaciaId: 30,
          farmaciaNombre: 'Farmacia Sol',
          estado: 'ACTIVO',
        },
      ]);

      expect(fixture.componentInstance.lotes.length).toBe(1);
      expect(fixture.componentInstance.enlaces.length).toBe(1);

      fixture.componentInstance.onLoteChange(1);
      expect(fixture.componentInstance.form.get('temperaturaMinimaPermitida')?.value).toBe(2);
      expect(fixture.componentInstance.form.get('temperaturaMaximaPermitida')?.value).toBe(8);
    });

    it('requiere remito y no envía formulario inválido', () => {
      const fixture = TestBed.createComponent(DespachoNuevoComponent);
      fixture.detectChanges();

      httpMock.expectOne('/api/lotes').flush([]);
      httpMock.expectOne('/api/enlaces-cuit?estado=ACTIVO').flush([]);

      fixture.componentInstance.guardar();
      expect(fixture.componentInstance.form.invalid).toBe(true);
      httpMock.expectNone('/api/despachos-logisticos');
    });
  });

  describe('DespachosListComponent', () => {
    it('lista los despachos y filtra por estado', () => {
      const fixture = TestBed.createComponent(DespachosListComponent);
      fixture.detectChanges();

      const req = httpMock.expectOne('/api/despachos-logisticos');
      req.flush([
        { id: 1, numeroRemito: 'R-001', estado: 'PREPARADO', laboratorioId: 10 },
        { id: 2, numeroRemito: 'R-002', estado: 'EN_TRANSITO', laboratorioId: 10 },
      ]);

      expect(fixture.componentInstance.despachos.length).toBe(2);
      expect(fixture.componentInstance.despachosFiltrados.length).toBe(2);

      fixture.componentInstance.filtroEstado = 'PREPARADO';
      expect(fixture.componentInstance.despachosFiltrados.length).toBe(1);
      expect(fixture.componentInstance.despachosFiltrados[0].numeroRemito).toBe('R-001');
    });
  });

  describe('DespachoDetalleComponent', () => {
    it('carga el detalle y muestra la línea de tiempo de eventos de custodia', () => {
      const fixture = TestBed.createComponent(DespachoDetalleComponent);
      fixture.detectChanges();

      httpMock.expectOne('/api/despachos-logisticos/1').flush({
        id: 1,
        numeroRemito: 'R-001',
        estado: 'PREPARADO',
        laboratorioId: 10,
        loteId: 1,
      });

      httpMock.expectOne('/api/despachos-logisticos/1/eventos').flush([
        {
          id: 1,
          tipo: 'LOTE_DESPACHADO',
          fechaHoraEvento: '2026-10-24T10:00:00',
          hashAnterior: 'GENESIS-00',
          hashEvento: 'HASH-111',
          descripcion: 'Nota interna confidencial',
        },
      ]);

      expect(fixture.componentInstance.despacho?.numeroRemito).toBe('R-001');
      expect(fixture.componentInstance.eventos.length).toBe(1);
      expect(fixture.componentInstance.puedeVerTextosInternos).toBe(true);
    });
  });
});
