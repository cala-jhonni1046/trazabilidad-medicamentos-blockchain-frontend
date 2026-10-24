import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SessionService } from '../../core/session/session.service';
import { InspectoresComponent } from './inspectores.component';
import { InspectorDto } from './inspectores.models';

const USUARIOS = [
  { id: 1, email: 'superadmin@medichain.demo', rol: 'SUPERADMIN', activo: true },
  { id: 2, email: 'inspector@medichain.demo', rol: 'ANMAT', activo: true },
  { id: 3, email: 'anmat2@medichain.demo', rol: 'ANMAT', activo: true },
  { id: 4, email: 'farmacia@medichain.demo', rol: 'FARMACIA', activo: true },
];
const INSPECTORES: InspectorDto[] = [
  {
    id: 10,
    usuarioId: 2,
    usuarioEmail: 'inspector@medichain.demo',
    nombreCompleto: 'Inspector Demo',
    legajoOficial: 'LEG-001',
    dni: '11222333',
    estado: 'HABILITADO',
  },
];

describe('InspectoresComponent', () => {
  let http: HttpTestingController;

  async function montar(usuarioIdParam?: string): Promise<{
    fixture: ComponentFixture<InspectoresComponent>;
    comp: InspectoresComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [InspectoresComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(usuarioIdParam ? { usuarioId: usuarioIdParam } : {}),
            },
          },
        },
      ],
    }).compileComponents();
    TestBed.inject(SessionService).iniciarSesion({
      id: 1,
      email: 'superadmin@medichain.demo',
      rol: 'SUPERADMIN',
      activo: true,
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(InspectoresComponent);
    fixture.detectChanges();
    http.expectOne('/api/inspectores').flush(INSPECTORES);
    http.expectOne('/api/usuarios').flush(USUARIOS);
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush([{}, {}]);
    http.expectOne('/api/organizaciones').flush([{}, {}, {}]);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('carga métricas reales y la tabla', async () => {
    const { fixture, comp } = await montar();
    expect(comp.habilitados()).toBe(1);
    expect(comp.cadenasActivas()).toBe(2);
    expect(comp.organizacionesTotal()).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(1);
  });

  it('ofrece solo usuarios ANMAT que todavía no tienen perfil', async () => {
    const { comp } = await montar();
    expect(comp.candidatos().map((u) => u.id)).toEqual([3]);
  });

  it('preselecciona el usuario que llega por query param', async () => {
    const { comp } = await montar('3');
    expect(comp.form.controls.usuarioId.value).toBe(3);
  });

  it('sugiere como jefe autorizador al usuario de la sesión', async () => {
    const { comp } = await montar();
    expect(comp.form.controls.jefeAutorizador.value).toBe('superadmin@medichain.demo');
  });

  it('no envía si faltan datos obligatorios', async () => {
    const { comp } = await montar();
    comp.guardar();
    http.expectNone('/api/inspectores');
    expect(comp.form.invalid).toBe(true);
  });

  it('da de alta con el DNI normalizado y estado HABILITADO', async () => {
    const { comp } = await montar();
    comp.form.patchValue({
      usuarioId: 3,
      nombreCompleto: 'Nueva Inspectora',
      legajoOficial: 'LEG-002',
      dni: '22.333.444',
    });
    comp.guardar();
    const req = http.expectOne('/api/inspectores');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      usuarioId: 3,
      legajoOficial: 'LEG-002',
      dni: '22333444',
      estado: 'HABILITADO',
      jefeAutorizador: 'superadmin@medichain.demo',
    });
    req.flush({ id: 11, usuarioId: 3, nombreCompleto: 'Nueva Inspectora', estado: 'HABILITADO' });
    expect(comp.inspectores().length).toBe(2);
    expect(comp.candidatos().length).toBe(0);
  });

  it('muestra el 409 de legajo duplicado junto al campo legajo', async () => {
    const { comp } = await montar();
    comp.form.patchValue({ usuarioId: 3, nombreCompleto: 'X', legajoOficial: 'LEG-001' });
    comp.guardar();
    http.expectOne('/api/inspectores').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'Ya existe un inspector con el legajo oficial: LEG-001' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(comp.form.controls.legajoOficial.getError('servidor')).toContain('legajo');
    expect(comp.inspectores().length).toBe(1);
  });

  it('crear usuario nuevo: si falla el perfil, el usuario queda y se reintenta solo el perfil', async () => {
    const { comp } = await montar();
    comp.cambiarModo(true);
    comp.form.patchValue({
      emailNuevo: 'nuevo.anmat@medichain.demo',
      nombreCompleto: 'Persona Nueva',
      legajoOficial: 'LEG-001',
    });
    comp.guardar();
    http.expectOne('/api/usuarios').flush({ id: 7, email: 'nuevo.anmat@medichain.demo', rol: 'ANMAT', activo: true });
    // el perfil falla por legajo repetido
    http.expectOne('/api/inspectores').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'Ya existe un inspector con el legajo oficial: LEG-001' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(comp.usuarioSinPerfil()?.id).toBe(7);
    expect(comp.modoNuevoUsuario()).toBe(false);
    expect(comp.form.controls.usuarioId.value).toBe(7);
    // reintento: corrige el legajo y solo se llama al POST de inspectores
    comp.form.controls.legajoOficial.setValue('LEG-777');
    comp.guardar();
    http.expectNone('/api/usuarios');
    http.expectOne('/api/inspectores').flush({ id: 12, usuarioId: 7, nombreCompleto: 'Persona Nueva', estado: 'HABILITADO' });
    expect(comp.usuarioSinPerfil()).toBeNull();
    expect(comp.inspectores().length).toBe(2);
  });

  it('suspender pide confirmación y reenvía el resto de los campos', async () => {
    const { comp } = await montar();
    const abrir = vi
      .spyOn(TestBed.inject(MatDialog), 'open')
      .mockReturnValue({ afterClosed: () => of(true) } as ReturnType<MatDialog['open']>);
    comp.alternarEstado(INSPECTORES[0]);
    expect(abrir).toHaveBeenCalledTimes(1);
    const req = http.expectOne('/api/inspectores/10');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({
      usuarioId: 2,
      nombreCompleto: 'Inspector Demo',
      legajoOficial: 'LEG-001',
      dni: '11222333',
      estado: 'SUSPENDIDO',
    });
    req.flush({ ...INSPECTORES[0], estado: 'SUSPENDIDO' });
    expect(comp.habilitados()).toBe(0);
  });

  it('habilitar no pide confirmación', async () => {
    const { comp } = await montar();
    comp.inspectores.set([{ ...INSPECTORES[0], estado: 'SUSPENDIDO' }]);
    const abrir = vi.spyOn(TestBed.inject(MatDialog), 'open');
    comp.alternarEstado(comp.inspectores()[0]);
    expect(abrir).not.toHaveBeenCalled();
    http.expectOne('/api/inspectores/10').flush({ ...INSPECTORES[0], estado: 'HABILITADO' });
    expect(comp.habilitados()).toBe(1);
  });
});
