import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RolUsuario, SessionService } from '../../core/session/session.service';
import { ReportesBandejaComponent } from './reportes-bandeja.component';
import { ReporteCiudadanoDto } from './reportes.models';

const PENDIENTE: ReporteCiudadanoDto = {
  id: 1,
  motivoReporte: 'Envase roto <script>alert(1)</script>',
  fechaHoraReporte: '2026-10-20T20:00:00',
  estado: 'PENDIENTE',
  unidadTrazableId: null,
  codigoUnicoQR: 'QR-1',
  inspectorAsignadoId: null,
  inspectorNombre: null,
  fechaCreacion: '2026-10-20T20:00:00',
  fechaActualizacion: '2026-10-20T20:00:00',
};

describe('ReportesBandejaComponent', () => {
  let http: HttpTestingController;

  async function montar(
    rol: RolUsuario,
    inspectorEstado: 'HABILITADO' | 'SUSPENDIDO' = 'HABILITADO',
  ): Promise<{ fixture: ComponentFixture<ReportesBandejaComponent>; comp: ReportesBandejaComponent }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ReportesBandejaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'x@medichain.demo', rol, activo: true },
      null,
      rol === 'ANMAT'
        ? { id: 9, usuarioId: 1, nombreCompleto: 'Inspector Demo', estado: inspectorEstado }
        : null,
    );
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ReportesBandejaComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === '/api/reportes-ciudadanos' && r.params.keys().length === 0)
      .flush([PENDIENTE]);
    http.expectOne((r) => r.url === '/api/reportes-ciudadanos' && r.params.get('estado') === 'PENDIENTE').flush([
      PENDIENTE,
    ]);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('un reporte PENDIENTE aparece en la bandeja de ANMAT', async () => {
    const { comp } = await montar('ANMAT');
    expect(comp.reportes().length).toBe(1);
    expect(comp.reportes()[0].estado).toBe('PENDIENTE');
  });

  it('el motivo se interpola como texto, nunca como HTML', async () => {
    const { fixture } = await montar('ANMAT');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<script>');
  });

  it('SUPERADMIN ve la bandeja en modo lectura, sin botones de acción', async () => {
    const { comp, fixture } = await montar('SUPERADMIN');
    expect(comp.puedeActuar()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('modo lectura');
  });

  it('un inspector SUSPENDIDO no puede actuar (solo lectura)', async () => {
    const { comp } = await montar('ANMAT', 'SUSPENDIDO');
    expect(comp.puedeActuar()).toBe(false);
  });

  it('ANMAT habilitado inicia revisión y luego puede resolver', async () => {
    const { comp } = await montar('ANMAT');
    expect(comp.puedeActuar()).toBe(true);

    comp.iniciarRevision(PENDIENTE);
    const reqIniciar = http.expectOne('/api/reportes-ciudadanos/1/iniciar-revision');
    expect(reqIniciar.request.body).toEqual({ inspectorAsignadoId: 9 });
    reqIniciar.flush({ ...PENDIENTE, estado: 'EN_REVISION' });
    http.expectOne((r) => r.url === '/api/reportes-ciudadanos' && r.params.get('estado') === 'PENDIENTE').flush([]);
    expect(comp.reportes()[0].estado).toBe('EN_REVISION');

    comp.resolver(comp.reportes()[0]);
    const reqResolver = http.expectOne('/api/reportes-ciudadanos/1/resolver');
    reqResolver.flush({ ...PENDIENTE, estado: 'RESUELTO' });
    http.expectOne((r) => r.url === '/api/reportes-ciudadanos' && r.params.get('estado') === 'PENDIENTE').flush([]);
    expect(comp.reportes()[0].estado).toBe('RESUELTO');
  });

  it('un 409 de transición inválida se muestra y no rompe la fila', async () => {
    const { comp } = await montar('ANMAT');
    comp.resolver(PENDIENTE); // está PENDIENTE, no EN_REVISION: el backend lo rechaza
    http
      .expectOne('/api/reportes-ciudadanos/1/resolver')
      .flush(
        { status: 409, code: 'STATE_CONFLICT', message: 'La operación no está permitida para el estado actual del recurso.' },
        { status: 409, statusText: 'Conflict' },
      );
    expect(comp.reportes()[0].estado).toBe('PENDIENTE');
    expect(comp.procesando().has(1)).toBe(false);
  });
});
