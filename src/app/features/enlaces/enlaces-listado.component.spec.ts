import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RolUsuario, SessionService } from '../../core/session/session.service';
import { EnlaceDto } from './enlaces.models';
import { EnlacesListadoComponent } from './enlaces-listado.component';

const LISTA: EnlaceDto[] = [
  {
    id: 1, laboratorioId: 1, laboratorioNombre: 'Laboratorio Uno', laboratorioCuit: '30111111111',
    distribuidorId: 2, distribuidorNombre: 'Distribuidora Demo', distribuidorCuit: '30222222222',
    farmaciaId: 3, farmaciaNombre: 'Farmacia Demo', farmaciaCuit: '30333333333',
    estado: 'ACTIVO', fechaSolicitud: '2026-10-01T10:00:00', fechaAprobacionANMAT: '2026-10-02T10:00:00',
    inspectorAprobadorNombre: 'Inspector Demo',
  },
  {
    id: 2, laboratorioId: 4, laboratorioNombre: 'Laboratorio Dos', laboratorioCuit: '30444444444',
    distribuidorId: 2, distribuidorNombre: 'Distribuidora Demo', distribuidorCuit: '30222222222',
    farmaciaId: 3, farmaciaNombre: 'Farmacia Demo', farmaciaCuit: '30333333333',
    estado: 'RECHAZADO', fechaSolicitud: '2026-10-05T10:00:00',
  },
  {
    id: 3, laboratorioId: 4, laboratorioNombre: 'Laboratorio Dos', laboratorioCuit: '30444444444',
    distribuidorId: 2, distribuidorNombre: 'Distribuidora Demo', distribuidorCuit: '30222222222',
    farmaciaId: 3, farmaciaNombre: 'Farmacia Demo', farmaciaCuit: '30333333333',
    estado: 'PENDIENTE', fechaSolicitud: '2026-10-10T10:00:00',
  },
];

describe('EnlacesListadoComponent', () => {
  let http: HttpTestingController;

  async function montar(rol: RolUsuario): Promise<EnlacesListadoComponent> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [EnlacesListadoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion({ id: 1, email: 'x@medichain.demo', rol, activo: true });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(EnlacesListadoComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush(LISTA);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => http.verify());

  it('ordena del más nuevo al más viejo y filtra por estado', async () => {
    const comp = await montar('ANMAT');
    expect(comp.filtrados().map((e) => e.id)).toEqual([3, 2, 1]);
    comp.filtroEstado.set('ACTIVO');
    expect(comp.filtrados().map((e) => e.id)).toEqual([1]);
  });

  it('busca por nombre y por CUIT con o sin guiones', async () => {
    const comp = await montar('ANMAT');
    comp.busqueda.set('laboratorio dos');
    expect(comp.filtrados().map((e) => e.id)).toEqual([3, 2]);
    comp.busqueda.set('30-11111111-1');
    expect(comp.filtrados().map((e) => e.id)).toEqual([1]);
  });

  it('avisa que los rechazados no registran inspector ni fecha', async () => {
    const comp = await montar('ANMAT');
    expect(comp.hayRechazados()).toBe(true);
    comp.filtroEstado.set('ACTIVO');
    expect(comp.hayRechazados()).toBe(false);
  });

  it('SUPERADMIN ve el listado sin el acceso a pendientes', async () => {
    const comp = await montar('SUPERADMIN');
    expect(comp.esAnmat()).toBe(false);
    expect(comp.filtrados().length).toBe(3);
  });
});
