import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SessionService } from '../session/session.service';
import { authInterceptor, esRutaPublica } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let session: SessionService;
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };
  let snack: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    window.sessionStorage.clear();
    router = { url: '/lotes', navigate: vi.fn() };
    snack = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snack },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => ctrl.verify());

  function iniciar() {
    session.iniciarSesion(
      { id: 1, email: 'lab@medichain.demo', rol: 'LABORATORIO', activo: true },
      null,
      null,
      'TOKEN-123',
    );
  }

  it('agrega el token a los pedidos de /api cuando hay sesión', () => {
    iniciar();
    http.get('/api/lotes').subscribe();
    expect(ctrl.expectOne('/api/lotes').request.headers.get('Authorization')).toBe(
      'Bearer TOKEN-123',
    );
  });

  it('no agrega encabezado si no hay sesión', () => {
    http.get('/api/lotes').subscribe();
    expect(ctrl.expectOne('/api/lotes').request.headers.has('Authorization')).toBe(false);
  });

  it('no manda el token al login, al portal público ni al alta pública de reportes', () => {
    iniciar();
    http.post('/api/auth/login', {}).subscribe();
    http.get('/api/public/consulta-qr/ABC').subscribe();
    http.get('/api/consulta-publica/qr/ABC').subscribe();
    http.post('/api/reportes-ciudadanos', {}).subscribe();
    for (const req of ctrl.match(() => true)) {
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('sí manda el token al listar reportes (GET)', () => {
    iniciar();
    http.get('/api/reportes-ciudadanos').subscribe();
    expect(ctrl.expectOne('/api/reportes-ciudadanos').request.headers.has('Authorization')).toBe(
      true,
    );
  });

  it('no toca pedidos que no son de /api', () => {
    iniciar();
    http.get('/assets/config.json').subscribe();
    expect(ctrl.expectOne('/assets/config.json').request.headers.has('Authorization')).toBe(false);
  });

  it('ante 401 cierra la sesión y vuelve al login con aviso y returnUrl', () => {
    iniciar();
    http.get('/api/lotes').subscribe({ error: () => undefined });
    ctrl.expectOne('/api/lotes').flush({ code: 'NO_AUTENTICADO' }, { status: 401, statusText: 'x' });
    expect(session.isAuthenticated()).toBe(false);
    expect(session.aviso()).toContain('venció');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/lotes' },
    });
  });

  it('un 401 del login no cierra nada ni redirige', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    ctrl.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'x' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ante 403 avisa que falta permiso y mantiene la sesión', () => {
    iniciar();
    http.post('/api/lotes', {}).subscribe({ error: () => undefined });
    ctrl.expectOne('/api/lotes').flush({ code: 'ACCESO_DENEGADO' }, { status: 403, statusText: 'x' });
    expect(snack.open).toHaveBeenCalledWith(
      'No tenés permiso para esta acción.',
      'Cerrar',
      expect.anything(),
    );
    expect(session.isAuthenticated()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('esRutaPublica distingue rutas públicas de privadas', () => {
    expect(esRutaPublica('/api/auth/login', 'POST')).toBe(true);
    expect(esRutaPublica('/api/auth/me', 'GET')).toBe(false);
    expect(esRutaPublica('/api/reportes-ciudadanos', 'GET')).toBe(false);
    expect(esRutaPublica('/api/lotes', 'GET')).toBe(false);
  });
});
