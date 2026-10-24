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
  { id: 3, email: 'farmacia@medichain.demo', rol: 'FARMACIA', activo: false },
];

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
    comp.form.setValue({ email: 'no-es-email', rol: null });
    comp.crear();
    http.expectNone('/api/usuarios');
    expect(comp.form.invalid).toBe(true);
  });

  it('crea un usuario ANMAT y ofrece crear su perfil de inspector', () => {
    comp.form.setValue({ email: 'nuevo@medichain.demo', rol: 'ANMAT' });
    comp.crear();
    const req = http.expectOne('/api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'nuevo@medichain.demo', rol: 'ANMAT', activo: true });
    req.flush({ id: 9, email: 'nuevo@medichain.demo', rol: 'ANMAT', activo: true });
    expect(comp.usuarios().length).toBe(4);
    expect(comp.ultimoAnmat()?.id).toBe(9);
  });

  it('muestra el 409 de email repetido junto al campo email', () => {
    comp.form.setValue({ email: 'inspector@medichain.demo', rol: 'ANMAT' });
    comp.crear();
    http.expectOne('/api/usuarios').flush(
      { status: 409, code: 'RESOURCE_CONFLICT', message: 'Ya existe un usuario registrado con el email: inspector@medichain.demo' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(comp.form.controls.email.getError('servidor')).toContain('Ya existe');
    expect(comp.usuarios().length).toBe(3);
    expect(comp.enviando()).toBe(false);
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
