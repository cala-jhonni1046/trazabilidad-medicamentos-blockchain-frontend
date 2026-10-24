import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SessionService } from '../../core/session/session.service';
import { EnlaceDto } from './enlaces.models';
import { SolicitudLaboratorioComponent } from './solicitud-laboratorio.component';

function enlace(id: number, labId: number, estado: EnlaceDto['estado'], fecha: string): EnlaceDto {
  return {
    id,
    laboratorioId: labId,
    distribuidorId: 2,
    farmaciaId: 3,
    distribuidorNombre: 'Distribuidora Demo',
    farmaciaNombre: 'Farmacia Demo',
    estado,
    fechaSolicitud: fecha,
  };
}

describe('SolicitudLaboratorioComponent', () => {
  let http: HttpTestingController;

  async function montar(conOrg: boolean): Promise<SolicitudLaboratorioComponent> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SolicitudLaboratorioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion(
      { id: 5, email: 'laboratorio@medichain.demo', rol: 'LABORATORIO', activo: true },
      conOrg ? { id: 1, cuit: '30111111111', nombre: 'Laboratorio Demo', tipo: 'LABORATORIO' } : null,
    );
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SolicitudLaboratorioComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => http.verify());

  it('lista solo las solicitudes del laboratorio de la sesión, de la más nueva a la más vieja', async () => {
    const comp = await montar(true);
    const req = http.expectOne((r) => r.url === '/api/enlaces-cuit');
    expect(req.request.params.get('laboratorioId')).toBe('1');
    // un backend sin el filtro devuelve también enlaces de otros laboratorios
    req.flush([
      enlace(1, 1, 'ACTIVO', '2026-10-01T10:00:00'),
      enlace(2, 9, 'PENDIENTE', '2026-10-05T10:00:00'),
      enlace(3, 1, 'PENDIENTE', '2026-10-10T10:00:00'),
    ]);
    expect(comp.misSolicitudes().map((e) => e.id)).toEqual([3, 1]);
  });

  it('filtra por estado', async () => {
    const comp = await montar(true);
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([
      enlace(1, 1, 'ACTIVO', '2026-10-01T10:00:00'),
      enlace(3, 1, 'PENDIENTE', '2026-10-10T10:00:00'),
    ]);
    comp.filtroEstado.set('PENDIENTE');
    expect(comp.misSolicitudes().map((e) => e.id)).toEqual([3]);
  });

  it('sin organización en la sesión no consulta y avisa', async () => {
    const comp = await montar(false);
    http.expectNone((r) => r.url === '/api/enlaces-cuit');
    expect(comp.miLaboratorio()).toBeNull();
  });

  it('al crear una solicitud vuelve a cargar la tabla', async () => {
    const comp = await montar(true);
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([]);
    comp.onCreada(enlace(7, 1, 'PENDIENTE', '2026-10-20T10:00:00'));
    expect(comp.ultimaCreada()?.id).toBe(7);
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([enlace(7, 1, 'PENDIENTE', '2026-10-20T10:00:00')]);
    expect(comp.misSolicitudes().length).toBe(1);
  });
});
