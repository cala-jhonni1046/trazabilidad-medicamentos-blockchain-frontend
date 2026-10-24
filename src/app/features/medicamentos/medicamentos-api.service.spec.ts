import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MedicamentosApiService } from './medicamentos-api.service';
import { MedicamentoRequest } from './medicamentos.models';

describe('MedicamentosApiService', () => {
  let api: MedicamentosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MedicamentosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con GET /api/medicamentos', () => {
    api.listar().subscribe();
    expect(http.expectOne('/api/medicamentos').request.method).toBe('GET');
  });

  it('obtiene por ID con GET /api/medicamentos/{id}', () => {
    api.obtenerPorId(10).subscribe();
    expect(http.expectOne('/api/medicamentos/10').request.method).toBe('GET');
  });

  it('crea con POST /api/medicamentos', () => {
    const body: MedicamentoRequest = {
      nombre: 'Ibuprofeno 400',
      principioActivo: 'Ibuprofeno',
      requiereCadenaFrio: false,
    };
    api.crear(body).subscribe();
    const req = http.expectOne('/api/medicamentos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
  });

  it('actualiza y elimina con PUT y DELETE', () => {
    const body: MedicamentoRequest = {
      nombre: 'Insulina NPH',
      principioActivo: 'Insulina humana',
      requiereCadenaFrio: true,
    };
    api.actualizar(2, body).subscribe();
    expect(http.expectOne('/api/medicamentos/2').request.method).toBe('PUT');

    api.eliminar(2).subscribe();
    expect(http.expectOne('/api/medicamentos/2').request.method).toBe('DELETE');
  });
});
