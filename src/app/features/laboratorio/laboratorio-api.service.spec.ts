import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LaboratorioApiService } from './laboratorio-api.service';

describe('LaboratorioApiService', () => {
  let api: LaboratorioApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LaboratorioApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene lotes con filtro de laboratorioId', () => {
    api.getLotes(12).subscribe();
    expect(http.expectOne('/api/lotes?laboratorioId=12').request.method).toBe('GET');
  });

  it('obtiene despachos con filtro de laboratorioId', () => {
    api.getDespachos(12).subscribe();
    expect(
      http.expectOne('/api/despachos-logisticos?laboratorioId=12').request.method,
    ).toBe('GET');
  });

  it('obtiene enlaces con filtro de laboratorioId', () => {
    api.getEnlaces(12).subscribe();
    expect(http.expectOne('/api/enlaces-cuit?laboratorioId=12').request.method).toBe('GET');
  });

  it('obtiene cuarentenas abiertas', () => {
    api.getCuarentenasAbiertas().subscribe();
    expect(http.expectOne('/api/cuarentenas?estado=ABIERTA').request.method).toBe('GET');
  });

  it('obtiene unidades por lote', () => {
    api.getUnidadesPorLote(9).subscribe();
    expect(http.expectOne('/api/unidades-trazables?loteId=9').request.method).toBe('GET');
  });
});
