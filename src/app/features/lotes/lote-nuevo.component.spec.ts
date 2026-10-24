import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';

import { SessionService } from '../../core/session/session.service';
import { MedicamentoDto } from '../medicamentos/medicamentos.models';
import { LoteNuevoComponent } from './lote-nuevo.component';
import { Lote } from './lotes.models';

const MEDS_MOCK: MedicamentoDto[] = [
  { id: 1, nombre: 'Paracetamol 500mg', principioActivo: 'Paracetamol', requiereCadenaFrio: false },
  { id: 2, nombre: 'Insulina Glargina', principioActivo: 'Insulina humana', requiereCadenaFrio: true },
];

describe('LoteNuevoComponent', () => {
  let http: HttpTestingController;

  async function montar(): Promise<{
    fixture: ComponentFixture<LoteNuevoComponent>;
    comp: LoteNuevoComponent;
    router: Router;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoteNuevoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'lab@medichain.demo', rol: 'LABORATORIO', activo: true },
      { id: 10, cuit: '30111111111', nombre: 'Lab Test', tipo: 'LABORATORIO' },
    );

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LoteNuevoComponent);
    fixture.detectChanges();
    http.expectOne('/api/medicamentos').flush(MEDS_MOCK);
    fixture.detectChanges();

    return { fixture, comp: fixture.componentInstance, router };
  }

  afterEach(() => http.verify());

  it('valida client-side que tempMin no supere tempMax', async () => {
    const { comp } = await montar();
    comp.form.setValue({
      codigoLote: 'LOT-INV-01',
      medicamentoId: 1,
      cantidadUnidades: 10,
      tempMin: 15,
      tempMax: 5,
      fechaHoraFabricacion: '2026-10-24T12:00',
    });

    comp.guardar();
    expect(comp.form.controls.tempMin.hasError('rangoInvalido')).toBe(true);
    expect(comp.enviando()).toBe(false);
  });

  it('crea lote con éxito y genera las unidades QR', async () => {
    const { comp, router } = await montar();
    comp.form.setValue({
      codigoLote: 'LOT-OK-100',
      medicamentoId: 1,
      cantidadUnidades: 50,
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T12:00',
    });

    comp.guardar();
    expect(comp.enviando()).toBe(true);

    const reqLote = http.expectOne('/api/lotes');
    expect(reqLote.request.method).toBe('POST');
    const loteCreado: Lote = {
      id: 55,
      codigoLote: 'LOT-OK-100',
      medicamentoId: 1,
      medicamentoNombre: 'Paracetamol 500mg',
      laboratorioId: 10,
      laboratorioNombre: 'Lab Test',
      laboratorioCuit: '30111111111',
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T12:00',
      estado: 'CREADO',
    };
    reqLote.flush(loteCreado);

    const reqUnidades = http.expectOne('/api/lotes/55/unidades');
    expect(reqUnidades.request.method).toBe('POST');
    reqUnidades.flush([{ id: 1, codigoQr: 'QR-55-1', loteId: 55, estado: 'DISPONIBLE' }]);

    expect(comp.enviando()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/lotes', 55]);
  });

  it('si falla la generación de unidades no pierde el lote y navega al detalle con aviso', async () => {
    const { comp, router } = await montar();
    comp.form.setValue({
      codigoLote: 'LOT-FAIL-UNIDADES',
      medicamentoId: 1,
      cantidadUnidades: 10,
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T12:00',
    });

    comp.guardar();

    const reqLote = http.expectOne('/api/lotes');
    reqLote.flush({
      id: 77,
      codigoLote: 'LOT-FAIL-UNIDADES',
      medicamentoId: 1,
      medicamentoNombre: 'Paracetamol 500mg',
      laboratorioId: 10,
      laboratorioNombre: 'Lab Test',
      laboratorioCuit: '30111111111',
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T12:00',
      estado: 'CREADO',
    });

    const reqUnidades = http.expectOne('/api/lotes/77/unidades');
    reqUnidades.flush(
      { message: 'Error interno al generar unidades' },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(router.navigate).toHaveBeenCalledWith(['/lotes', 77], {
      queryParams: { errorGeneracion: '1' },
    });
  });

  it('muestra 409 de código duplicado junto al campo codigoLote', async () => {
    const { comp } = await montar();
    comp.form.setValue({
      codigoLote: 'LOT-DUPLICADO',
      medicamentoId: 1,
      cantidadUnidades: 10,
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: '2026-10-24T12:00',
    });

    comp.guardar();

    const req = http.expectOne('/api/lotes');
    req.flush(
      { message: 'Ya existe un lote con código LOT-DUPLICADO' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(comp.form.controls.codigoLote.hasError('duplicado')).toBe(true);
  });
});
