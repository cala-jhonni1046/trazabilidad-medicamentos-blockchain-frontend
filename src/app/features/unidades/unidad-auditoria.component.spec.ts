import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { UnidadAuditoriaComponent } from './unidad-auditoria.component';

describe('UnidadAuditoriaComponent', () => {
  let http: HttpTestingController;

  async function montar(queryQr?: string): Promise<{
    fixture: ComponentFixture<UnidadAuditoriaComponent>;
    comp: UnidadAuditoriaComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [UnidadAuditoriaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (k: string) => (k === 'qr' && queryQr ? queryQr : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(UnidadAuditoriaComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('muestra estado vacío si no se ingresó código QR', async () => {
    const { fixture, comp } = await montar();
    expect(comp.historial()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Búsqueda de unidad trazable');
  });

  it('busca automáticamente si recibe parámetro ?qr en la URL y reconstruye el recorrido', async () => {
    const { fixture, comp } = await montar('QR-PAR-900');
    expect(comp.cargando()).toBe(true);

    const reqQr = http.expectOne('/api/unidades-trazables/qr/QR-PAR-900');
    reqQr.flush({
      id: 5,
      codigoQr: 'QR-PAR-900',
      loteId: 10,
      estado: 'DISPONIBLE',
      fechaCreacion: '2026-10-24T09:00:00',
    });

    http.expectOne('/api/lotes/10').flush({
      id: 10,
      codigoLote: 'LOT-PAR-2026',
      medicamentoNombre: 'Paracetamol 500mg',
      laboratorioNombre: 'Lab Central',
      fechaHoraFabricacion: '2026-10-24T08:00:00',
      estado: 'CREADO',
    });

    http.expectOne('/api/cuarentenas?loteId=10').flush([]);
    http.expectOne('/api/despachos-logisticos?loteId=10').flush([]);
    http.expectOne('/api/dispensaciones/unidad/5').flush(null, { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.historial()).not.toBeNull();
    expect(comp.historial()?.unidad.codigoQr).toBe('QR-PAR-900');
    expect(fixture.nativeElement.textContent).toContain('Paracetamol 500mg');
    expect(fixture.nativeElement.textContent).toContain('Fabricación y generación de unidad QR');
  });

  it('muestra mensaje claro cuando el código QR no existe (HTTP 404)', async () => {
    const { fixture, comp } = await montar('QR-INEXISTENTE');

    const reqQr = http.expectOne('/api/unidades-trazables/qr/QR-INEXISTENTE');
    reqQr.flush({ message: 'Unidad no encontrada' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(comp.cargando()).toBe(false);
    expect(comp.qrNoEncontrado()).toBe('QR-INEXISTENTE');
    expect(fixture.nativeElement.textContent).toContain('No se encontró la unidad');
  });
});
