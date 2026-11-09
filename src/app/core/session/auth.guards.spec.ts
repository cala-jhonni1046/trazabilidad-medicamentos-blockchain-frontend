import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, roleGuard } from './auth.guards';
import { SessionService } from './session.service';

const ruta = {} as ActivatedRouteSnapshot;
const estado = (url: string) => ({ url }) as RouterStateSnapshot;

describe('guards de sesión', () => {
  let session: SessionService;
  let router: Router;

  beforeEach(() => {
    window.sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  const correr = (fn: ReturnType<typeof roleGuard>, url = '/x') =>
    TestBed.runInInjectionContext(() => fn(ruta, estado(url)));

  it('sin sesión, authGuard manda a /login con returnUrl', () => {
    const r = correr(authGuard, '/lotes') as UrlTree;
    expect(router.serializeUrl(r)).toBe('/login?returnUrl=%2Flotes');
  });

  it('con sesión, authGuard deja pasar', () => {
    session.iniciarSesion({ id: 1, email: 'a@b.c', rol: 'LABORATORIO', activo: true }, null, null, 'T');
    expect(correr(authGuard)).toBe(true);
  });

  it('roleGuard deja pasar al rol permitido', () => {
    session.iniciarSesion({ id: 1, email: 'a@b.c', rol: 'LABORATORIO', activo: true }, null, null, 'T');
    expect(correr(roleGuard(['LABORATORIO', 'SUPERADMIN']))).toBe(true);
  });

  it('roleGuard manda a su inicio al rol no permitido', () => {
    session.iniciarSesion({ id: 1, email: 'a@b.c', rol: 'FARMACIA', activo: true }, null, null, 'T');
    const r = correr(roleGuard(['LABORATORIO'])) as UrlTree;
    expect(router.serializeUrl(r)).toBe('/farmacia');
  });

  it('roleGuard sin sesión va a /login', () => {
    const r = correr(roleGuard(['LABORATORIO'])) as UrlTree;
    expect(router.serializeUrl(r)).toBe('/login');
  });
});
