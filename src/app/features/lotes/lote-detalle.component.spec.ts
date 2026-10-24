import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SessionService } from '../../core/session/session.service';
import { LoteDetalleComponent } from './lote-detalle.component';
import { Lote, UnidadResumen } from './lotes.models';

const LOTE_MOCK: Lote = {
  id: 42,
  codigoLote: 'LOT-DEMO-42',
  medicamentoId: 5,
  medicamentoNombre: 'Amoxicilina 500mg',
  laboratorioId: 10,
  laboratorioNombre: 'Lab Test',
  laboratorioCuit: '30111111111',
  tempMin: 15,
  tempMax: 25,
  fechaHoraFabricacion: '2026-10-24T08:00:00',
  estado: 'CREADO',
};

const UNIDADES_MOCK: UnidadResumen[] = [
  { id: 1, codigoQr: 'MED-42-0001', loteId: 42, estado: 'DISPONIBLE' },
  { id: 2, codigoQr: 'MED-42-0002', loteId: 42, estado: 'DISPONIBLE' },
];

describe('LoteDetalleComponent', () => {
  let http: HttpTestingController;

  async function montar(queryParamError = false): Promise<{
    fixture: ComponentFixture<LoteDetalleComponent>;
    comp: LoteDetalleComponent;
    router: Router;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoteDetalleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '42' },
              queryParamMap: { get: (k: string) => (k === 'errorGeneracion' && queryParamError ? '1' : null) },
            },
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion(
      { id: 1, email: 'lab@medichain.demo', rol: 'LABORATORIO', activo: true },
      { id: 10, cuit: '30111111111', nombre: 'Lab Test', tipo: 'LABORATORIO' },
    );

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LoteDetalleComponent);
    fixture.detectChanges();

    http.expectOne('/api/lotes/42').flush(LOTE_MOCK);
    http.expectOne('/api/unidades-trazables?loteId=42').flush(queryParamError ? [] : UNIDADES_MOCK);
    fixture.detectChanges();

    return { fixture, comp: fixture.componentInstance, router };
  }

  afterEach(() => http.verify());

  it('muestra datos del lote y lista de unidades generadas', async () => {
    const { fixture, comp } = await montar();
    expect(comp.lote()?.codigoLote).toBe('LOT-DEMO-42');
    expect(comp.unidades().length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('LOT-DEMO-42');
  });

  it('filtra unidades por código QR', async () => {
    const { comp } = await montar();
    comp.busquedaQr.set('0002');
    expect(comp.unidadesFiltradas().map((u) => u.codigoQr)).toEqual(['MED-42-0002']);
  });

  it('el botón Asignar transporte está deshabilitado con aviso de módulo logístico F20', async () => {
    const { fixture } = await montar();
    const btn = fixture.nativeElement.querySelector('button[color="accent"]');
    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(true);
  });

  it('eliminar lote pide confirmación, llama a DELETE y redirige a /lotes', async () => {
    const { comp, router } = await montar();
    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);

    comp.eliminarLote();
    const req = http.expectOne('/api/lotes/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(router.navigate).toHaveBeenCalledWith(['/lotes']);
  });

  it('permite reintentar generación de unidades cuando está pendiente', async () => {
    const { comp } = await montar(true);
    expect(comp.errorGeneracion()).toBe(true);
    expect(comp.unidades().length).toBe(0);

    comp.generarUnidades(50);
    const reqGen = http.expectOne('/api/lotes/42/unidades');
    reqGen.flush([{ id: 10, codigoQr: 'MED-42-RETRY-1', loteId: 42, estado: 'DISPONIBLE' }]);

    const reqReload = http.expectOne('/api/unidades-trazables?loteId=42');
    reqReload.flush([{ id: 10, codigoQr: 'MED-42-RETRY-1', loteId: 42, estado: 'DISPONIBLE' }]);

    expect(comp.unidades().length).toBe(1);
    expect(comp.errorGeneracion()).toBe(false);
  });
});
