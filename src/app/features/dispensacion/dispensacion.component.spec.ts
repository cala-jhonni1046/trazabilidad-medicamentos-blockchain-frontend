import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../core/session/session.service';
import { DispensacionComponent } from './dispensacion.component';

describe('DispensacionComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<DispensacionComponent>;
  let comp: DispensacionComponent;

  beforeEach(async () => {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DispensacionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'farmacia@medichain.demo', rol: 'FARMACIA', activo: true },
      { id: 3, cuit: '30911111113', nombre: 'Farmacia Demo', tipo: 'FARMACIA' },
    );
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DispensacionComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  function buscar(estadoUnidad: string, estadoLote: string): void {
    comp.codigoQr = 'QR-1';
    comp.buscar();
    http.expectOne('/api/unidades-trazables/qr/QR-1').flush({ id: 1, codigoUnicoQR: 'QR-1', loteId: 7, estado: estadoUnidad });
    http.expectOne('/api/lotes/7').flush({ id: 7, codigoLote: 'LOTE-7', estado: estadoLote, medicamentoNombre: 'Ibuprofeno' });
  }

  it('una unidad DISPONIBLE de un lote RECIBIDO es elegible', () => {
    buscar('DISPONIBLE', 'RECIBIDO');
    expect(comp.elegible()).toBe(true);
  });

  it('una unidad de un lote EN_CUARENTENA no es elegible y el motivo es claro', () => {
    buscar('DISPONIBLE', 'EN_CUARENTENA');
    expect(comp.elegible()).toBe(false);
    expect(comp.motivoNoElegible()).toContain('cuarentena');
  });

  it('una unidad ya DISPENSADA no es elegible', () => {
    buscar('DISPENSADA', 'RECIBIDO');
    expect(comp.elegible()).toBe(false);
    expect(comp.motivoNoElegible()).toContain('disponible');
  });

  it('normaliza el DNI con puntos y lo borra del formulario después de enviar', () => {
    buscar('DISPONIBLE', 'RECIBIDO');
    comp.form.controls.dniPaciente.setValue('12.345.678');
    comp.dispensar();
    const req = http.expectOne('/api/dispensaciones');
    expect(req.request.body).toEqual({ unidadTrazableId: 1, farmaciaId: 3, dniPaciente: '12345678' });
    req.flush({
      id: 1,
      recetaNumero: null,
      unidadTrazableId: 1,
      codigoUnicoQR: 'QR-1',
      farmaciaId: 3,
      farmaciaNombre: 'Farmacia Demo',
      farmaciaCuit: '30911111113',
      fechaDispensacion: '2026-10-20T15:30:00',
      fechaCreacion: '2026-10-20T15:30:00',
      fechaActualizacion: '2026-10-20T15:30:00',
    });
    expect(comp.form.controls.dniPaciente.value).toBe('');
    expect(comp.confirmacion()?.id).toBe(1);
    // La respuesta tampoco trae el DNI en ningún campo mostrado.
    expect(JSON.stringify(comp.confirmacion())).not.toContain('12345678');
  });

  it('un 409 de unidad bloqueada se muestra y limpia igual el DNI', () => {
    buscar('DISPONIBLE', 'RECIBIDO');
    comp.form.controls.dniPaciente.setValue('87654321');
    comp.dispensar();
    http
      .expectOne('/api/dispensaciones')
      .flush(
        { status: 409, code: 'STATE_CONFLICT', message: 'La unidad no está disponible.' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(comp.errorEnvio()).toContain('no está disponible');
    expect(comp.form.controls.dniPaciente.value).toBe('');
  });
});
