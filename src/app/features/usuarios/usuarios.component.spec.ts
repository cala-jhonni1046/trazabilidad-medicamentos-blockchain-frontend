import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../core/session/session.service';
import { UsuariosComponent } from './usuarios.component';
import { UsuarioDto } from './usuarios.models';

const LISTA: UsuarioDto[] = [
  { id: 1, email: 'superadmin@medichain.demo', rol: 'SUPERADMIN', activo: true },
  { id: 2, email: 'inspector@medichain.demo', rol: 'ANMAT', activo: true },
  { id: 3, email: 'farmacia@medichain.demo', rol: 'FARMACIA', activo: false, organizacionId: 30 },
];

const ORGS = [
  { id: 10, cuit: '30111111118', nombre: 'Laboratorio Demo', tipo: 'LABORATORIO' },
  { id: 11, cuit: '30444444448', nombre: 'Laboratorio Dos', tipo: 'LABORATORIO' },
  { id: 20, cuit: '30222222228', nombre: 'Distribuidora Demo', tipo: 'DISTRIBUIDOR' },
  { id: 30, cuit: '30333333338', nombre: 'Farmacia Central Demo', tipo: 'FARMACIA' },
];

const CLAVE_OK = 'Clave1234';

describe('UsuariosComponent', () => {
  let fixture: ComponentFixture<UsuariosComponent>;
  let comp: UsuariosComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion({
      id: 1,
      email: 'superadmin@medichain.demo',
      rol: 'SUPERADMIN',
      activo: true,
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuariosComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/usuarios').flush(LISTA);
    http.expectOne('/api/organizaciones').flush(ORGS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carga y lista los usuarios', () => {
    expect(comp.usuarios().length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(3);
  });

  it('filtra por rol y por email', () => {
    comp.filtroRol.set('ANMAT');
    expect(comp.filtrados().map((u) => u.id)).toEqual([2]);
    comp.filtroRol.set('');
    comp.busqueda.set('FARMA');
    expect(comp.filtrados().map((u) => u.id)).toEqual([3]);
  });

  it('bloquea acciones sobre el propio usuario y sobre un SUPERADMIN', () => {
    expect(comp.accionBloqueada(LISTA[0])).toBe(true);
    expect(comp.motivoBloqueo(LISTA[0])).not.toBe('');
    expect(comp.accionBloqueada(LISTA[1])).toBe(false);
  });

  it('no envía el formulario si es inválido', () => {
    comp.form.setValue({ email: 'no-es-email', rol: null, password: '', organizacionId: null });
    comp.crear();
    http.expectNone('/api/usuarios');
    expect(comp.form.invalid).toBe(true);
  });

  it('crea un usuario ANMAT y ofrece crear su perfil de inspector', () => {
    comp.form.setValue({ email: 'nuevo@medichain.demo', rol: 'ANMAT', password: CLAVE_OK, organizacionId: null });
    comp.crear();
    const req = http.expectOne('/api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'nuevo@medichain.demo',
      rol: 'ANMAT',
      activo: true,
      password: CLAVE_OK,
    });
    req.flush({ id: 9, email: 'nuevo@medichain.demo', rol: 'ANMAT', activo: true });
    expect(comp.usuarios().length).toBe(4);
    expect(comp.ultimoAnmat()?.id).toBe(9);
  });

  it('muestra el 409 de email repetido junto al campo email', () => {
    comp.form.setValue({ email: 'inspector@medichain.demo', rol: 'ANMAT', password: CLAVE_OK, organizacionId: null });
    comp.crear();
    http.expectOne('/api/usuarios').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'Ya existe un usuario registrado con el email: inspector@medichain.demo' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(comp.form.controls.email.getError('servidor')).toContain('Ya existe');
    expect(comp.usuarios().length).toBe(3);
    expect(comp.enviando()).toBe(false);
  });

  it('muestra la organización de cada usuario en la tabla', () => {
    expect(comp.nombreOrganizacion(LISTA[2])).toBe('Farmacia Central Demo');
    expect(comp.nombreOrganizacion(LISTA[1])).toBe('—');
  });

  it('para un rol de empresa pide la organización y ofrece solo las de su tipo', () => {
    comp.form.controls.rol.setValue('LABORATORIO');
    fixture.detectChanges();
    expect(comp.necesitaOrganizacion()).toBe(true);
    expect(comp.organizacionesDisponibles().map((o) => o.id)).toEqual([10, 11]);
    expect(fixture.nativeElement.querySelector('.campo-organizacion')).not.toBeNull();

    comp.form.patchValue({ email: 'lab@medichain.demo', password: CLAVE_OK });
    comp.crear();
    http.expectNone('/api/usuarios');
    expect(comp.form.controls.organizacionId.hasError('required')).toBe(true);
  });

  it('para ANMAT no pide organización', () => {
    comp.form.controls.rol.setValue('ANMAT');
    fixture.detectChanges();
    expect(comp.necesitaOrganizacion()).toBe(false);
    expect(fixture.nativeElement.querySelector('.campo-organizacion')).toBeNull();
  });

  it('crea un usuario de laboratorio con su organización y contraseña', () => {
    comp.form.controls.rol.setValue('LABORATORIO');
    comp.form.patchValue({ email: 'lab3@medichain.demo', password: CLAVE_OK, organizacionId: 11 });
    comp.crear();
    const req = http.expectOne('/api/usuarios');
    expect(req.request.body).toEqual({
      email: 'lab3@medichain.demo',
      rol: 'LABORATORIO',
      activo: true,
      password: CLAVE_OK,
      organizacionId: 11,
    });
    req.flush({ id: 12, email: 'lab3@medichain.demo', rol: 'LABORATORIO', activo: true, organizacionId: 11 });
    expect(comp.usuarios().length).toBe(4);
  });

  it('al cambiar de rol se limpia la organización elegida', () => {
    comp.form.controls.rol.setValue('LABORATORIO');
    comp.form.controls.organizacionId.setValue(10);
    comp.form.controls.rol.setValue('FARMACIA');
    expect(comp.form.controls.organizacionId.value).toBeNull();
  });

  it('exige una contraseña de al menos 8 caracteres', () => {
    comp.form.setValue({ email: 'x@medichain.demo', rol: 'ANMAT', password: 'corta', organizacionId: null });
    comp.crear();
    http.expectNone('/api/usuarios');
    expect(comp.form.controls.password.hasError('minlength')).toBe(true);
  });

  it('activa un usuario y actualiza la fila sin recargar', () => {
    comp.alternarEstado(LISTA[2]);
    http.expectOne('/api/usuarios/3/activar').flush({ ...LISTA[2], activo: true });
    expect(comp.usuarios().find((u) => u.id === 3)?.activo).toBe(true);
  });

  it('ante un 404 al activar refresca la lista', () => {
    comp.alternarEstado(LISTA[2]);
    http.expectOne('/api/usuarios/3/activar').flush(
      { status: 404, code: 'RESOURCE_NOT_FOUND', message: 'Usuario no encontrado' },
      { status: 404, statusText: 'Not Found' },
    );
    http.expectOne('/api/usuarios').flush(LISTA.slice(0, 2));
    expect(comp.usuarios().length).toBe(2);
  });
});
