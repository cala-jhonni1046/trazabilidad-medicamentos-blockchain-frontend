import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LotesComponent } from './pages/lotes/lotes.component';
import { TrazabilidadComponent } from './pages/trazabilidad/trazabilidad.component';
import { mensajeApi } from './core/medicamentos-api.service';

const lote = {
  id: 1,
  codigoLote: 'LOTE-1',
  medicamentoId: 1,
  medicamentoNombre: 'Medicamento de prueba',
  laboratorioId: 1,
  laboratorioNombre: 'Laboratorio de prueba',
  estado: 'CREADO',
  tempMin: null,
  tempMax: 8,
};
const despacho = {
  id: 10,
  loteId: 1,
  codigoLote: 'LOTE-1',
  numeroRemito: 'R-10',
  estado: 'EN_TRANSITO',
};

describe('Pantallas conectadas al contrato del backend', () => {
  let http: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  const texto = (fixture: ComponentFixture<unknown>) => fixture.nativeElement.textContent as string;

  it('el panel conserva los datos disponibles si un endpoint falla y permite reintentar', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush([lote]);
    http.expectOne('/api/despachos-logisticos').flush([despacho]);
    http
      .expectOne('/api/telemetrias-temperatura')
      .flush(
        { message: 'Temperaturas no disponibles' },
        { status: 503, statusText: 'Unavailable' },
      );
    http.expectOne('/api/cuarentenas?estado=ABIERTA').flush([]);
    await fixture.whenStable();
    expect(fixture.componentInstance.metricas.map((m) => m.valor)).toEqual([1, 1, 0, null]);
    expect(texto(fixture)).toContain('Temperaturas no disponibles');
    expect(texto(fixture)).toContain('No disponible. Volvé a actualizar.');
    expect(texto(fixture)).not.toContain('Todavía no hay lecturas registradas.');

    fixture.componentInstance.recargar();
    http.expectOne('/api/lotes').flush([lote]);
    http.expectOne('/api/despachos-logisticos').flush([despacho]);
    http
      .expectOne('/api/telemetrias-temperatura')
      .flush([
        {
          id: 1,
          despachoLogisticoId: 10,
          temperatura: 12,
          alertaExcursion: true,
          fechaHora: '2026-10-22T10:00:00',
        },
      ]);
    http.expectOne('/api/cuarentenas?estado=ABIERTA').flush([]);
    await fixture.whenStable();
    expect(texto(fixture)).toContain('12 °C');
    expect(texto(fixture)).toContain('Fuera de rango');
    expect(fixture.componentInstance.error).toBe('');
  });

  async function cargarFormulario() {
    const fixture = TestBed.createComponent(LotesComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush([lote]);
    http.expectOne('/api/medicamentos').flush([{ id: 1, nombre: 'Medicamento de prueba' }]);
    http.expectOne('/api/organizaciones').flush([
      { id: 1, nombre: 'Laboratorio de prueba', tipo: 'LABORATORIO' },
      { id: 2, nombre: 'Farmacia', tipo: 'FARMACIA' },
    ]);
    await fixture.whenStable();
    return fixture;
  }

  it('exige seleccionar IDs reales, valida temperaturas y crea un lote reiniciando el formulario', async () => {
    const fixture = await cargarFormulario();
    const dom = fixture.nativeElement as HTMLElement;
    const codigo = dom.querySelector<HTMLInputElement>('input[name="codigoLote"]')!;
    codigo.value = '  NUEVO-1  ';
    codigo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(dom.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    const selects = [...dom.querySelectorAll<HTMLSelectElement>('select')];
    expect(selects[1].options.length).toBe(2);
    selects.forEach((select) => {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change'));
    });
    await fixture.whenStable();
    expect(dom.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    fixture.componentInstance.nuevo.tempMin = 9;
    fixture.componentInstance.nuevo.tempMax = 2;
    fixture.componentInstance.crear();
    http.expectNone('/api/lotes');
    expect(fixture.componentInstance.error).toContain('mínima');

    fixture.componentInstance.nuevo.tempMin = 2;
    fixture.componentInstance.nuevo.tempMax = 8;
    dom
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const post = http.expectOne('/api/lotes');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      codigoLote: 'NUEVO-1',
      medicamentoId: 1,
      laboratorioId: 1,
      tempMin: 2,
      tempMax: 8,
      fechaHoraFabricacion: null,
    });
    expect(post.request.body.estado).toBeUndefined();
    fixture.componentInstance.crear();
    http.expectNone('/api/lotes');
    post.flush({ ...lote, id: 2, codigoLote: 'NUEVO-1' });
    http.expectOne('/api/lotes').flush([lote, { ...lote, id: 2, codigoLote: 'NUEVO-1' }]);
    http.expectOne('/api/medicamentos').flush([{ id: 1, nombre: 'Medicamento de prueba' }]);
    http
      .expectOne('/api/organizaciones')
      .flush([{ id: 1, nombre: 'Laboratorio de prueba', tipo: 'LABORATORIO' }]);
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Lote NUEVO-1 creado en estado CREADO.');
    expect(codigo.value).toBe('');
    expect(dom.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(texto(fixture)).toContain('Sin mínimo a 8');
  });

  it('conserva los campos del lote cuando el backend rechaza el alta', async () => {
    const fixture = await cargarFormulario();
    fixture.componentInstance.nuevo = {
      codigoLote: 'DUPLICADO',
      medicamentoId: 1,
      laboratorioId: 1,
      tempMin: null,
      tempMax: null,
      fechaHoraFabricacion: '',
    };
    fixture.componentInstance.crear();
    http
      .expectOne('/api/lotes')
      .flush({ message: 'El lote ya existe' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    expect(texto(fixture)).toContain('El lote ya existe');
    expect(fixture.componentInstance.nuevo.codigoLote).toBe('DUPLICADO');
    expect(fixture.componentInstance.guardando).toBe(false);
  });

  it('cancela la custodia anterior al cambiar de lote y reacciona a los parámetros de navegación', async () => {
    params.next(convertToParamMap({ loteId: 1 }));
    const fixture = TestBed.createComponent(TrazabilidadComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush([lote, { ...lote, id: 2, codigoLote: 'LOTE-2' }]);
    http.expectOne('/api/despachos-logisticos?loteId=1').flush([despacho]);
    const viejo = http.expectOne('/api/despachos-logisticos/10/eventos');
    params.next(convertToParamMap({ loteId: 2 }));
    expect(viejo.cancelled).toBe(true);
    http
      .expectOne('/api/despachos-logisticos?loteId=2')
      .flush([{ ...despacho, id: 20, loteId: 2, numeroRemito: 'R-20' }]);
    http
      .expectOne('/api/despachos-logisticos/20/eventos')
      .flush([
        {
          id: 3,
          tipo: 'CUSTODIA_ASUMIDA',
          fechaHoraEvento: '2026-10-22T10:00:00',
          descripcion: 'Texto interno privado',
          organizacionActorNombre: 'Actor privado',
          hashEvento: 'hash-demo',
        },
      ]);
    await fixture.whenStable();
    expect(texto(fixture)).toContain('R-20');
    expect(texto(fixture)).toContain('CUSTODIA_ASUMIDA');
    expect(texto(fixture)).not.toContain('Texto interno privado');
    expect(texto(fixture)).not.toContain('Actor privado');
    params.next(convertToParamMap({ loteId: 999 }));
    await fixture.whenStable();
    expect(texto(fixture)).toContain('El lote indicado no está disponible');
    expect(texto(fixture)).not.toContain('R-20');
  });

  it('permite reintentar la carga de lotes y no confunde un error de custodia con ausencia de despachos', async () => {
    const fixture = TestBed.createComponent(TrazabilidadComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Reintentar carga de lotes');
    fixture.componentInstance.recargarLotes();
    http.expectOne('/api/lotes').flush([lote]);
    fixture.componentInstance.loteId = 1;
    fixture.componentInstance.cargarCustodia();
    http
      .expectOne('/api/despachos-logisticos?loteId=1')
      .flush({ message: 'Servicio no disponible' }, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Servicio no disponible');
    expect(texto(fixture)).not.toContain('Este lote todavía no tiene despachos');
  });

  it('mantiene la selección de lote en la URL sin repetir la consulta', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(TrazabilidadComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush([lote]);
    fixture.componentInstance.loteId = 1;
    fixture.componentInstance.seleccionarLote();
    expect(navegar).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { loteId: 1 }, replaceUrl: true }),
    );
    params.next(convertToParamMap({ loteId: 1 }));
    http.expectOne('/api/despachos-logisticos?loteId=1').flush([]);
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Este lote todavía no tiene despachos.');
  });

  it('consulta el QR codificado, muestra datos públicos y limpia la respuesta anterior ante un error', async () => {
    const fixture = TestBed.createComponent(TrazabilidadComponent);
    fixture.detectChanges();
    http.expectOne('/api/lotes').flush([]);
    fixture.componentInstance.codigoQr = ' QR/1 ';
    fixture.componentInstance.consultarQR();
    fixture.componentInstance.consultarQR();
    http
      .expectOne('/api/public/consulta-qr/QR%2F1')
      .flush({
        codigoConsultado: 'QR/1',
        estadoUnidad: 'DISPENSADA',
        medicamento: {
          nombre: 'Medicamento',
          principioActivo: 'Sustancia',
          requiereCadenaFrio: true,
        },
        lote: null,
        cuarentena: null,
        historialCustodia: [],
        advertencias: ['Unidad dispensada'],
        informacionRegulatoria: 'Consulta informativa',
      });
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Sustancia');
    expect(texto(fixture)).toContain('Unidad dispensada');
    expect(texto(fixture)).toContain('Sin hitos públicos registrados.');
    fixture.componentInstance.codigoQr = 'DESCONOCIDO';
    fixture.componentInstance.consultarQR();
    http
      .expectOne('/api/public/consulta-qr/DESCONOCIDO')
      .flush({ message: 'Unidad no encontrada' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(texto(fixture)).toContain('Unidad no encontrada');
    expect(texto(fixture)).not.toContain('Unidad dispensada');
    expect(fixture.componentInstance.consultando).toBe(false);
  });

  it('presenta validaciones H0 y un mensaje útil cuando no hay conexión', () => {
    expect(
      mensajeApi(
        new HttpErrorResponse({
          status: 400,
          error: { fieldErrors: [{ field: 'codigoLote', message: 'Es obligatorio' }] },
        }),
      ),
    ).toContain('codigoLote: Es obligatorio');
    expect(mensajeApi(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
  });
});
