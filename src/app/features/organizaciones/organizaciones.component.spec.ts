import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RolUsuario, SessionService } from '../../core/session/session.service';
import { OrganizacionesComponent } from './organizaciones.component';
import { OrganizacionDto } from './organizaciones.models';

const LISTA: OrganizacionDto[] = [
  { id: 1, cuit: '30111111111', nombre: 'Laboratorio Demo Uno', tipo: 'LABORATORIO' },
  { id: 2, cuit: '30222222222', nombre: 'Distribuidora Demo', tipo: 'DISTRIBUIDOR' },
  { id: 3, cuit: '30333333333', nombre: 'Farmacia Demo', tipo: 'FARMACIA' },
];

describe('OrganizacionesComponent', () => {
  let http: HttpTestingController;

  async function montar(rol: RolUsuario): Promise<{
    fixture: ComponentFixture<OrganizacionesComponent>;
    comp: OrganizacionesComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [OrganizacionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion({
      id: 1,
      email: 'x@medichain.demo',
      rol,
      activo: true,
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(OrganizacionesComponent);
    fixture.detectChanges();
    http.expectOne('/api/organizaciones').flush(LISTA);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('SUPERADMIN ve el formulario y las acciones', async () => {
    const { fixture, comp } = await montar('SUPERADMIN');
    expect(comp.puedeEditar()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(comp.columnas()).toContain('acciones');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(3);
  });

  it('ANMAT ve la tabla sin formulario ni botones de edición', async () => {
    const { fixture, comp } = await montar('ANMAT');
    expect(comp.puedeEditar()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(comp.columnas()).not.toContain('acciones');
    expect(fixture.nativeElement.querySelector('button[aria-label="Editar organización"]')).toBeNull();
    comp.editar(LISTA[0]);
    expect(comp.editando()).toBeNull();
  });

  it('busca por CUIT con o sin guiones y por nombre; filtra por tipo', async () => {
    const { comp } = await montar('SUPERADMIN');
    comp.busqueda.set('30-22222222-2');
    expect(comp.filtradas().map((o) => o.id)).toEqual([2]);
    comp.busqueda.set('30222222222');
    expect(comp.filtradas().map((o) => o.id)).toEqual([2]);
    comp.busqueda.set('farmacia');
    expect(comp.filtradas().map((o) => o.id)).toEqual([3]);
    comp.busqueda.set('');
    comp.filtroTipo.set('DISTRIBUIDOR');
    expect(comp.filtradas().map((o) => o.id)).toEqual([2]);
  });

  it('rechaza un CUIT mal formado sin llamar al backend', async () => {
    const { comp } = await montar('SUPERADMIN');
    comp.form.setValue({ cuit: '123', nombre: 'Lab', tipo: 'LABORATORIO' });
    comp.guardar();
    http.expectNone('/api/organizaciones');
    expect(comp.form.controls.cuit.hasError('cuitInvalido')).toBe(true);
  });

  it('envía el CUIT tal como lo escribió el usuario', async () => {
    const { comp } = await montar('SUPERADMIN');
    comp.form.setValue({ cuit: '30-44444444-4', nombre: ' Lab Nuevo ', tipo: 'LABORATORIO' });
    comp.guardar();
    const req = http.expectOne('/api/organizaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cuit: '30-44444444-4', nombre: 'Lab Nuevo', tipo: 'LABORATORIO' });
    req.flush({ id: 9, cuit: '30444444444', nombre: 'Lab Nuevo', tipo: 'LABORATORIO' });
    expect(comp.organizaciones().length).toBe(4);
  });

  it('muestra el 409 de CUIT duplicado junto al campo CUIT', async () => {
    const { comp } = await montar('SUPERADMIN');
    comp.form.setValue({ cuit: '30111111111', nombre: 'Otro', tipo: 'LABORATORIO' });
    comp.guardar();
    http.expectOne('/api/organizaciones').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'Ya existe una organización registrada con el CUIT: 30111111111' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(comp.form.controls.cuit.getError('servidor')).toContain('Ya existe');
    expect(comp.organizaciones().length).toBe(3);
  });

  it('al editar sin cambiar el tipo hace PUT directo', async () => {
    const { comp } = await montar('SUPERADMIN');
    comp.editar(LISTA[2]);
    comp.form.controls.nombre.setValue('Farmacia Demo Norte');
    comp.guardar();
    const req = http.expectOne('/api/organizaciones/3');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...LISTA[2], nombre: 'Farmacia Demo Norte' });
    expect(comp.organizaciones().find((o) => o.id === 3)?.nombre).toBe('Farmacia Demo Norte');
    expect(comp.editando()).toBeNull();
  });

  it('al cambiar el tipo pide confirmación antes de guardar', async () => {
    const { comp } = await montar('SUPERADMIN');
    const dialog = TestBed.inject(MatDialog);
    const abrir = vi
      .spyOn(dialog, 'open')
      .mockReturnValue({ afterClosed: () => of(false) } as ReturnType<MatDialog['open']>);
    comp.editar(LISTA[2]);
    comp.form.controls.tipo.setValue('DISTRIBUIDOR');
    comp.guardar();
    expect(abrir).toHaveBeenCalledTimes(1);
    http.expectNone('/api/organizaciones/3');

    abrir.mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);
    comp.guardar();
    expect(http.expectOne('/api/organizaciones/3').request.method).toBe('PUT');
  });

  it('si la baja da 409 muestra el mensaje del backend y conserva la fila', async () => {
    const { comp } = await montar('SUPERADMIN');
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);
    const snack = vi.spyOn(TestBed.inject(MatSnackBar), 'open');
    comp.eliminar(LISTA[0]);
    http.expectOne('/api/organizaciones/1').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'No es posible eliminar la organización con ID 1 porque se encuentra vinculada a uno o más enlaces CUIT.' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(snack.mock.calls[0][0]).toContain('vinculada');
    expect(comp.organizaciones().length).toBe(3);
    expect(comp.estaProcesando(1)).toBe(false);
  });
});
