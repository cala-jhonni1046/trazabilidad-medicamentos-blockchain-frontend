import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { cantidadPendientes, PendientesEnlacesService } from './pendientes.store';
import { urlSegura } from './enlaces.models';

describe('PendientesEnlacesService', () => {
  let http: HttpTestingController;
  let service: PendientesEnlacesService;

  beforeEach(() => {
    cantidadPendientes.set(null);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PendientesEnlacesService);
  });

  afterEach(() => http.verify());

  it('cuenta las solicitudes pendientes', () => {
    service.refrescar();
    const req = http.expectOne((r) => r.url === '/api/enlaces-cuit');
    expect(req.request.params.get('estado')).toBe('PENDIENTE');
    req.flush([{}, {}, {}]);
    expect(cantidadPendientes()).toBe(3);
  });

  it('si falla no muestra número', () => {
    cantidadPendientes.set(4);
    service.refrescar();
    http.expectOne((r) => r.url === '/api/enlaces-cuit').flush({}, { status: 500, statusText: 'Error' });
    expect(cantidadPendientes()).toBeNull();
  });

  it('fijar actualiza el badge sin consultar', () => {
    service.fijar(2);
    expect(cantidadPendientes()).toBe(2);
  });
});

describe('urlSegura', () => {
  it('solo acepta http(s)', () => {
    expect(urlSegura('https://ejemplo.demo/a')).toBe('https://ejemplo.demo/a');
    expect(urlSegura('javascript:alert(1)')).toBeNull();
    expect(urlSegura('ftp://x')).toBeNull();
    expect(urlSegura(null)).toBeNull();
  });
});
