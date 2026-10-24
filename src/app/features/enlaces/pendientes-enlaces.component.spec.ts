import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { InspectorSession, SessionService } from '../../core/session/session.service';
import { EnlaceDto } from './enlaces.models';
import { PendientesEnlacesComponent } from './pendientes-enlaces.component';
import { cantidadPendientes } from './pendientes.store';

function enlace(id: number): EnlaceDto {
  return {
    id,
    laboratorioId: 1,
    laboratorioNombre: 'Laboratorio Demo',
    laboratorioCuit: '30111111111',
    distribuidorId: 2,
    distribuidorNombre: 'Distribuidora Demo',
    distribuidorCuit: '30222222222',
    farmaciaId: 3,
    farmaciaNombre: 'Farmacia Demo',
    farmaciaCuit: '30333333333',
    estado: 'PENDIENTE',
    fechaSolicitud: '2026-10-20T10:00:00',
  };
}

const INSPECTOR_OK: InspectorSession = {
  id: 77,
  usuarioId: 2,
  nombreCompleto: 'Inspector Demo',
  estado: 'HABILITADO',
};

describe('PendientesEnlacesComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<PendientesEnlacesComponent>;
  let comp: PendientesEnlacesComponent;

  async function montar(inspector: InspectorSession | null): Promise<void> {
    window.sessionStorage.clear();
    cantidadPendientes.set(null);
    await TestBed.configureTestingModule({
      imports: [PendientesEnlacesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion(
      { id: 2, email: 'inspector@medichain.demo', rol: 'ANMAT', activo: true },
      null,
      inspector,
    );
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PendientesEnlacesComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([enlace(1), enlace(2)]);
    fixture.detectChanges();
  }

  function dialogDevuelve(valor: unknown): void {
    vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of(valor),
    } as ReturnType<MatDialog['open']>);
  }

  afterEach(() => http.verify());

  it('lista las pendientes y actualiza el badge del menú', async () => {
    await montar(INSPECTOR_OK);
    expect(comp.pendientes().length).toBe(2);
    expect(cantidadPendientes()).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('mat-card.solicitud').length).toBe(2);
  });

  it('con inspector habilitado se puede resolver', async () => {
    await montar(INSPECTOR_OK);
    expect(comp.puedeResolver()).toBe(true);
    expect(comp.motivoBloqueo()).toBe('');
  });

  it('sin inspector en la sesión no se puede resolver y se explica', async () => {
    await montar(null);
    expect(comp.puedeResolver()).toBe(false);
    expect(comp.motivoBloqueo()).toContain('perfil de inspector habilitado');
    const abrir = vi.spyOn(TestBed.inject(MatDialog), 'open');
    comp.resolver(comp.pendientes()[0], 'aprobar');
    expect(abrir).not.toHaveBeenCalled();
    const botones: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('mat-card-actions button'));
    expect(botones.every((b) => b.disabled)).toBe(true);
  });

  it('con un inspector suspendido tampoco se puede resolver', async () => {
    await montar({ ...INSPECTOR_OK, estado: 'SUSPENDIDO' });
    expect(comp.puedeResolver()).toBe(false);
    expect(comp.motivoBloqueo()).toContain('suspendido');
  });

  it('aprobar usa el inspector de la sesión y saca el enlace de la bandeja', async () => {
    await montar(INSPECTOR_OK);
    dialogDevuelve({ numeroDisposicionANMAT: ' DISP-9 '.trim(), documentoCertificadoUrl: '' });
    comp.resolver(comp.pendientes()[0], 'aprobar');
    const req = http.expectOne('/api/enlaces-cuit/1/aprobar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      inspectorId: 77,
      numeroDisposicionANMAT: 'DISP-9',
      documentoCertificadoUrl: null,
    });
    req.flush({ ...enlace(1), estado: 'ACTIVO' });
    expect(comp.pendientes().map((e) => e.id)).toEqual([2]);
    expect(cantidadPendientes()).toBe(1);
  });

  it('rechazar llama a /rechazar', async () => {
    await montar(INSPECTOR_OK);
    dialogDevuelve({ numeroDisposicionANMAT: '', documentoCertificadoUrl: '' });
    comp.resolver(comp.pendientes()[1], 'rechazar');
    http.expectOne('/api/enlaces-cuit/2/rechazar').flush({ ...enlace(2), estado: 'RECHAZADO' });
    expect(comp.pendientes().map((e) => e.id)).toEqual([1]);
  });

  it('si se cancela el diálogo no se llama al backend', async () => {
    await montar(INSPECTOR_OK);
    dialogDevuelve(undefined);
    comp.resolver(comp.pendientes()[0], 'aprobar');
    http.expectNone('/api/enlaces-cuit/1/aprobar');
  });

  it('un 409 (ya resuelto) muestra el mensaje y refresca la lista', async () => {
    await montar(INSPECTOR_OK);
    const snack = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
    dialogDevuelve({ numeroDisposicionANMAT: '', documentoCertificadoUrl: '' });
    comp.resolver(comp.pendientes()[0], 'aprobar');
    http.expectOne('/api/enlaces-cuit/1/aprobar').flush(
      { status: 409, code: 'STATE_CONFLICT', message: 'Solo se puede aprobar un enlace en estado PENDIENTE. Estado actual: ACTIVO' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(snack.mock.calls[0][0]).toContain('Estado actual: ACTIVO');
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([enlace(2)]);
    expect(comp.pendientes().map((e) => e.id)).toEqual([2]);
    expect(comp.estaProcesando(1)).toBe(false);
  });
});
