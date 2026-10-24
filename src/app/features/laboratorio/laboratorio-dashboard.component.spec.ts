import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { SessionService } from '../../core/session/session.service';
import { EnlaceDto } from '../enlaces/enlaces.models';
import { Lote } from '../lotes/lotes.models';
import { LaboratorioDashboardComponent } from './laboratorio-dashboard.component';

const LOTES_MOCK: Lote[] = [
  {
    id: 1,
    codigoLote: 'LOT-A1',
    medicamentoId: 10,
    medicamentoNombre: 'Paracetamol 500mg',
    laboratorioId: 10,
    laboratorioNombre: 'Laboratorio Alfa',
    laboratorioCuit: '30111111111',
    tempMin: 2,
    tempMax: 8,
    fechaHoraFabricacion: '2026-10-24T10:00:00',
    estado: 'CREADO',
  },
  {
    id: 2,
    codigoLote: 'LOT-A2',
    medicamentoId: 20,
    medicamentoNombre: 'Insulina Glargina',
    laboratorioId: 10,
    laboratorioNombre: 'Laboratorio Alfa',
    laboratorioCuit: '30111111111',
    tempMin: 2,
    tempMax: 8,
    fechaHoraFabricacion: '2026-10-24T11:00:00',
    estado: 'EN_CUARENTENA',
  },
];

const ENLACES_MOCK: EnlaceDto[] = [
  {
    id: 100,
    laboratorioId: 10,
    distribuidorId: 20,
    distribuidorNombre: 'Logística Exprés',
    distribuidorCuit: '30444444444',
    farmaciaId: 30,
    farmaciaNombre: 'Farmacia Norte',
    farmaciaCuit: '30555555555',
    inspectorAprobadorNombre: 'Dr. Rossi',
    estado: 'ACTIVO',
  },
];

describe('LaboratorioDashboardComponent', () => {
  let http: HttpTestingController;

  async function montar(): Promise<{
    fixture: ComponentFixture<LaboratorioDashboardComponent>;
    comp: LaboratorioDashboardComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LaboratorioDashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'lab@medichain.demo', rol: 'LABORATORIO', activo: true },
      { id: 10, cuit: '30111111111', nombre: 'Laboratorio Alfa', tipo: 'LABORATORIO' },
    );

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LaboratorioDashboardComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('calcula métricas reales filtradas por el laboratorio y arma la tabla de monitoreo', async () => {
    const { fixture, comp } = await montar();

    http.expectOne('/api/lotes?laboratorioId=10').flush(LOTES_MOCK);
    http.expectOne('/api/despachos-logisticos?laboratorioId=10').flush([
      { id: 50, loteId: 1, distribuidorNombre: 'Logística Exprés', farmaciaDestinoNombre: 'Farmacia Norte', patente: 'AB123CD' },
    ]);
    http.expectOne('/api/enlaces-cuit?laboratorioId=10').flush(ENLACES_MOCK);
    http.expectOne('/api/cuarentenas?estado=ABIERTA').flush([
      { id: 7, loteId: 2, estado: 'ABIERTA', fechaInicio: '2026-10-24T12:00:00', motivo: 'Inspección' },
    ]);

    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.metricas().find((m) => m.titulo === 'Lotes registrados')?.valor).toBe(2);
    expect(comp.metricas().find((m) => m.titulo === 'En cuarentena')?.valor).toBe(1);
    expect(comp.metricas().find((m) => m.titulo === 'Enlaces CUIT activos')?.valor).toBe(1);
    expect(comp.filas().length).toBe(2);

    const filaCuarentena = comp.filas().find((f) => f.lote.id === 2);
    expect(filaCuarentena?.cuarentenaAbierta).not.toBeNull();
  });

  it('si una consulta falla, muestra guión en la métrica sin romper el resto del dashboard', async () => {
    const { fixture, comp } = await montar();

    http.expectOne('/api/lotes?laboratorioId=10').flush(LOTES_MOCK);
    http
      .expectOne('/api/despachos-logisticos?laboratorioId=10')
      .flush({ message: 'Error en despachos' }, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/enlaces-cuit?laboratorioId=10').flush(ENLACES_MOCK);
    http.expectOne('/api/cuarentenas?estado=ABIERTA').flush([]);

    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.error()).toContain('Despachos');
    expect(comp.metricas().find((m) => m.titulo === 'Lotes registrados')?.valor).toBe(2);
    expect(comp.filas().length).toBe(2);
  });
});
