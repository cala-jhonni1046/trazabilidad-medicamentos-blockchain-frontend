import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { RolUsuario, SessionService } from '../../core/session/session.service';
import { LotesListComponent } from './lotes-list.component';
import { Lote } from './lotes.models';

const LOTES_MOCK: Lote[] = [
  {
    id: 1,
    codigoLote: 'LOT-LAB1-001',
    medicamentoId: 10,
    medicamentoNombre: 'Paracetamol 500mg',
    laboratorioId: 2,
    laboratorioNombre: 'Laboratorio Alfa',
    laboratorioCuit: '30111111111',
    tempMin: 2,
    tempMax: 8,
    fechaHoraFabricacion: '2026-10-20T10:00:00',
    estado: 'CREADO',
  },
  {
    id: 2,
    codigoLote: 'LOT-LAB2-002',
    medicamentoId: 20,
    medicamentoNombre: 'Insulina Glargina',
    laboratorioId: 3,
    laboratorioNombre: 'Laboratorio Beta',
    laboratorioCuit: '30222222222',
    tempMin: 2,
    tempMax: 8,
    fechaHoraFabricacion: '2026-10-21T10:00:00',
    estado: 'EN_TRANSITO',
  },
];

describe('LotesListComponent', () => {
  let http: HttpTestingController;

  async function montar(
    rol: RolUsuario,
    org?: { id: number; cuit: string; nombre: string; tipo: 'LABORATORIO' },
  ): Promise<{
    fixture: ComponentFixture<LotesListComponent>;
    comp: LotesListComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LotesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'test@medichain.demo', rol, activo: true },
      org ?? null,
    );

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LotesListComponent);
    fixture.detectChanges();

    const expectedUrl =
      rol === 'LABORATORIO' && org ? `/api/lotes?laboratorioId=${org.id}` : '/api/lotes';
    http.expectOne(expectedUrl).flush(LOTES_MOCK);
    fixture.detectChanges();

    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('LABORATORIO ve solo los lotes de su propia organización y el botón Crear Lote', async () => {
    const { fixture, comp } = await montar('LABORATORIO', {
      id: 2,
      cuit: '30111111111',
      nombre: 'Laboratorio Alfa',
      tipo: 'LABORATORIO',
    });

    expect(comp.esLaboratorio()).toBe(true);
    expect(fixture.nativeElement.querySelector('a[routerLink="/lotes/nuevo"]')).not.toBeNull();
    expect(comp.lotes().length).toBe(1);
    expect(comp.lotes()[0].id).toBe(1);
  });

  it('ANMAT ve todos los lotes de todos los laboratorios y no ve el botón Crear Lote', async () => {
    const { fixture, comp } = await montar('ANMAT');

    expect(comp.esLaboratorio()).toBe(false);
    expect(fixture.nativeElement.querySelector('a[routerLink="/lotes/nuevo"]')).toBeNull();
    expect(comp.lotes().length).toBe(2);
  });

  it('filtra por búsqueda de código de lote y por estado', async () => {
    const { comp } = await montar('SUPERADMIN');

    comp.busqueda.set('Beta');
    expect(comp.filtrados().map((l) => l.id)).toEqual([2]);

    comp.busqueda.set('');
    comp.filtroEstado.set('CREADO');
    expect(comp.filtrados().map((l) => l.id)).toEqual([1]);
  });
});
