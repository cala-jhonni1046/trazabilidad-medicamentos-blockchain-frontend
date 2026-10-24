import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { UnidadesListComponent } from './unidades-list.component';
import { UnidadTrazableDto } from './unidades.models';

const MOCK_UNIDADES: UnidadTrazableDto[] = [
  { id: 1, codigoQr: 'MED-LOT1-0001', loteId: 10, estado: 'DISPONIBLE' },
  { id: 2, codigoQr: 'MED-LOT1-0002', loteId: 10, estado: 'DISPENSADA' },
  { id: 3, codigoQr: 'MED-LOT2-0001', loteId: 20, estado: 'BLOQUEADA' },
];

describe('UnidadesListComponent', () => {
  let http: HttpTestingController;

  async function montar(): Promise<{
    fixture: ComponentFixture<UnidadesListComponent>;
    comp: UnidadesListComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [UnidadesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(UnidadesListComponent);
    fixture.detectChanges();
    http.expectOne('/api/unidades-trazables').flush(MOCK_UNIDADES);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('lista las unidades trazables y muestra la tabla', async () => {
    const { comp } = await montar();
    expect(comp.unidades().length).toBe(3);
    expect(comp.filtradas().length).toBe(3);
  });

  it('filtra por estado', async () => {
    const { comp } = await montar();
    comp.filtroEstado.set('DISPENSADA');
    expect(comp.filtradas().map((u) => u.id)).toEqual([2]);
  });

  it('filtra por búsqueda de código QR', async () => {
    const { comp } = await montar();
    comp.busqueda.set('LOT2');
    expect(comp.filtradas().map((u) => u.id)).toEqual([3]);
  });
});
