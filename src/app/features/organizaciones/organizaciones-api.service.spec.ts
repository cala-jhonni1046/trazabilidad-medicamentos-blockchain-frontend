import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrganizacionesApiService } from './organizaciones-api.service';

describe('OrganizacionesApiService', () => {
  let api: OrganizacionesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(OrganizacionesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con GET /api/organizaciones', () => {
    api.listar().subscribe();
    expect(http.expectOne('/api/organizaciones').request.method).toBe('GET');
  });

  it('consulta por CUIT con el endpoint /cuit/{cuit}', () => {
    api.obtenerPorCuit('30-12345678-1').subscribe();
    const req = http.expectOne('/api/organizaciones/cuit/30-12345678-1');
    expect(req.request.method).toBe('GET');
  });

  it('crea, edita y elimina con los verbos del contrato', () => {
    const body = { cuit: '30-12345678-1', nombre: 'Lab Demo', tipo: 'LABORATORIO' as const };
    api.crear(body).subscribe();
    const post = http.expectOne('/api/organizaciones');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(body);
    api.actualizar(4, body).subscribe();
    expect(http.expectOne('/api/organizaciones/4').request.method).toBe('PUT');
    api.eliminar(4).subscribe();
    expect(http.expectOne('/api/organizaciones/4').request.method).toBe('DELETE');
  });
});
