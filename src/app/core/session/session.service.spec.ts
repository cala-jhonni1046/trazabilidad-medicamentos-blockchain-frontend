import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthResponse, SessionService } from './session.service';

const KEY = 'medichain_session';

const RESPUESTA: AuthResponse = {
  token: 'T1',
  tipo: 'Bearer',
  expiraEnSegundos: 3600,
  usuario: { id: 5, email: 'farmacia@medichain.demo', rol: 'FARMACIA', activo: true },
  organizacion: { id: 9, cuit: '30333333338', nombre: 'Farmacia Central Demo', tipo: 'FARMACIA' },
  inspector: null,
};

function crear() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return {
    session: TestBed.inject(SessionService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('SessionService', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('guarda token, usuario y organización con la clave nueva y borra la vieja', () => {
    window.sessionStorage.setItem('medichain_session_simulada', '{"usuario":{"id":1}}');
    const { session } = crear();
    session.iniciarDesdeRespuesta(RESPUESTA);

    expect(session.token()).toBe('T1');
    expect(session.rol()).toBe('FARMACIA');
    expect(session.organizacion()?.id).toBe(9);
    expect(JSON.parse(window.sessionStorage.getItem(KEY)!).token).toBe('T1');
    expect(window.sessionStorage.getItem('medichain_session_simulada')).toBeNull();
  });

  it('recupera la sesión guardada al crearse', () => {
    crear().session.iniciarDesdeRespuesta(RESPUESTA);
    const { session } = crear();
    expect(session.isAuthenticated()).toBe(true);
    expect(session.token()).toBe('T1');
  });

  it('descarta una sesión guardada sin token', () => {
    window.sessionStorage.setItem(KEY, JSON.stringify({ usuario: RESPUESTA.usuario }));
    expect(crear().session.isAuthenticated()).toBe(false);
  });

  it('cerrarSesion borra todo', () => {
    const { session } = crear();
    session.iniciarDesdeRespuesta(RESPUESTA);
    session.cerrarSesion();
    expect(session.isAuthenticated()).toBe(false);
    expect(session.token()).toBeNull();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('validarConBackend refresca los datos con /api/auth/me', () => {
    const { session, http } = crear();
    session.iniciarDesdeRespuesta(RESPUESTA);
    let ok: boolean | undefined;
    session.validarConBackend().subscribe((v) => (ok = v));
    const req = http.expectOne('/api/auth/me');
    req.flush({ ...RESPUESTA, token: null, organizacion: { ...RESPUESTA.organizacion!, nombre: 'Nuevo nombre' } });
    expect(ok).toBe(true);
    expect(session.organizacion()?.nombre).toBe('Nuevo nombre');
    expect(session.token()).toBe('T1');
  });

  it('validarConBackend cierra la sesión si /me responde 401', () => {
    const { session, http } = crear();
    session.iniciarDesdeRespuesta(RESPUESTA);
    let ok: boolean | undefined;
    session.validarConBackend().subscribe((v) => (ok = v));
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'x' });
    expect(ok).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it('validarConBackend conserva la sesión si el backend no responde', () => {
    const { session, http } = crear();
    session.iniciarDesdeRespuesta(RESPUESTA);
    session.validarConBackend().subscribe();
    http.expectOne('/api/auth/me').error(new ProgressEvent('error'));
    expect(session.isAuthenticated()).toBe(true);
  });

  it('validarConBackend no llama al backend si no hay sesión', () => {
    const { session, http } = crear();
    let ok: boolean | undefined;
    session.validarConBackend().subscribe((v) => (ok = v));
    http.expectNone('/api/auth/me');
    expect(ok).toBe(false);
  });
});
