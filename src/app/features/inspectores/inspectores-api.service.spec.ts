import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InspectoresApiService } from './inspectores-api.service';
import { dniValidator, normalizarDni } from './inspectores.models';
import { FormControl } from '@angular/forms';

describe('InspectoresApiService', () => {
  let api: InspectoresApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(InspectoresApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca por DNI con el parámetro ?dni=', () => {
    api.buscarPorDni('11222333').subscribe();
    const req = http.expectOne((r) => r.url === '/api/inspectores');
    expect(req.request.params.get('dni')).toBe('11222333');
  });

  it('cuenta cadenas activas con ?estado=ACTIVO', () => {
    api.listarEnlacesActivos().subscribe();
    const req = http.expectOne((r) => r.url === '/api/enlaces-cuit');
    expect(req.request.params.get('estado')).toBe('ACTIVO');
  });

  it('usa los verbos del contrato para alta, edición y baja', () => {
    api.crear({ usuarioId: 1, nombreCompleto: 'X' }).subscribe();
    expect(http.expectOne('/api/inspectores').request.method).toBe('POST');
    api.actualizar(3, { usuarioId: 1, nombreCompleto: 'X' }).subscribe();
    expect(http.expectOne('/api/inspectores/3').request.method).toBe('PUT');
    api.eliminar(3).subscribe();
    expect(http.expectOne('/api/inspectores/3').request.method).toBe('DELETE');
  });
});

describe('DNI', () => {
  it('normaliza puntos y espacios', () => {
    expect(normalizarDni('11.222.333')).toBe('11222333');
    expect(normalizarDni(' 11 222 333 ')).toBe('11222333');
    expect(normalizarDni(null)).toBe('');
  });

  it('valida 7 u 8 dígitos y es opcional', () => {
    const v = dniValidator();
    expect(v(new FormControl(''))).toBeNull();
    expect(v(new FormControl('11.222.333'))).toBeNull();
    expect(v(new FormControl('1.222.333'))).toBeNull();
    expect(v(new FormControl('123'))).not.toBeNull();
    expect(v(new FormControl('123456789'))).not.toBeNull();
    expect(v(new FormControl('abc12345'))).not.toBeNull();
  });
});
