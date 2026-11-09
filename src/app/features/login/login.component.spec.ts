import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SessionService } from '../../core/session/session.service';
import { LoginComponent } from './login.component';

function respuesta(rol: string, extra: object = {}) {
  return {
    token: 'TOK',
    tipo: 'Bearer',
    expiraEnSegundos: 3600,
    usuario: { id: 1, email: `${rol.toLowerCase()}@medichain.demo`, rol, activo: true },
    organizacion: null,
    inspector: null,
    ...extra,
  };
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let comp: LoginComponent;
  let http: HttpTestingController;
  let router: Router;
  let session: SessionService;

  beforeEach(async () => {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    session = TestBed.inject(SessionService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function enviar(email: string, password: string) {
    comp.loginForm.setValue({ email, password });
    comp.onSubmit();
  }

  it('no consulta al backend usuarios ni organizaciones al abrir', () => {
    http.expectNone('/api/usuarios');
    http.expectNone('/api/organizaciones');
  });

  it('exige correo y contraseña antes de enviar', () => {
    enviar('', '');
    http.expectNone('/api/auth/login');
    expect(comp.errorLogin()).toContain('Ingresá');
  });

  it.each([
    ['LABORATORIO', '/laboratorio'],
    ['DISTRIBUIDOR', '/distribucion'],
    ['FARMACIA', '/farmacia'],
    ['ANMAT', '/cuarentenas'],
    ['SUPERADMIN', '/inspectores'],
  ])('ingresa como %s y va a %s', (rol, destino) => {
    enviar('  x@medichain.demo ', 'Demo1234!');
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'x@medichain.demo', password: 'Demo1234!' });
    req.flush(respuesta(rol));
    expect(session.rol()).toBe(rol);
    expect(session.token()).toBe('TOK');
    expect(router.navigate).toHaveBeenCalledWith([destino]);
    expect(comp.enviando()).toBe(false);
  });

  it('no envía la organización ni la elige el usuario', () => {
    enviar('x@medichain.demo', 'Demo1234!');
    const req = http.expectOne('/api/auth/login');
    expect(Object.keys(req.request.body).sort()).toEqual(['email', 'password']);
    req.flush(respuesta('LABORATORIO'));
  });

  it('respeta returnUrl interno y descarta uno externo', () => {
    const route = TestBed.inject(Router);
    expect(route).toBeTruthy();
    (comp as unknown as { route: { snapshot: { queryParamMap: { get: () => string } } } }).route = {
      snapshot: { queryParamMap: { get: () => '/lotes' } },
    };
    enviar('x@medichain.demo', 'Demo1234!');
    http.expectOne('/api/auth/login').flush(respuesta('LABORATORIO'));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/lotes');

    (comp as unknown as { route: { snapshot: { queryParamMap: { get: () => string } } } }).route = {
      snapshot: { queryParamMap: { get: () => '//sitio-malo.com' } },
    };
    enviar('x@medichain.demo', 'Demo1234!');
    http.expectOne('/api/auth/login').flush(respuesta('LABORATORIO'));
    expect(router.navigate).toHaveBeenCalledWith(['/laboratorio']);
  });

  it('muestra un mensaje de credenciales ante 401 y no inicia sesión', () => {
    enviar('x@medichain.demo', 'mala');
    http.expectOne('/api/auth/login').flush(
      { status: 401, code: 'CREDENCIALES_INVALIDAS', message: 'Credenciales inválidas.' },
      { status: 401, statusText: 'x' },
    );
    expect(comp.errorLogin()).toBe('Correo o contraseña incorrectos.');
    expect(session.isAuthenticated()).toBe(false);
    expect(comp.enviando()).toBe(false);
  });

  it('muestra el aviso de demasiados intentos ante 429', () => {
    enviar('x@medichain.demo', 'mala');
    http.expectOne('/api/auth/login').flush(
      { status: 429, message: 'Demasiados intentos fallidos. Intente nuevamente en 5 minutos.' },
      { status: 429, statusText: 'x' },
    );
    expect(comp.errorLogin()).toContain('Demasiados intentos');
  });

  it('deshabilita el botón mientras envía y evita enviar dos veces', () => {
    enviar('x@medichain.demo', 'Demo1234!');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
    comp.onSubmit();
    http.expectOne('/api/auth/login').flush(respuesta('LABORATORIO'));
  });

  it('informa cuando no se puede conectar con el backend', () => {
    enviar('x@medichain.demo', 'Demo1234!');
    http.expectOne('/api/auth/login').error(new ProgressEvent('error'));
    expect(comp.errorLogin()).toContain('No se pudo conectar');
  });
});
