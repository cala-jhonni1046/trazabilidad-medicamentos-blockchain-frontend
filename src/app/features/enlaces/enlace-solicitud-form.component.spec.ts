import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnlaceSolicitudFormComponent } from './enlace-solicitud-form.component';
import { EnlaceDto, OrganizacionLite, SLOTS } from './enlaces.models';

const LAB: OrganizacionLite = { id: 1, cuit: '30111111111', nombre: 'Laboratorio Demo', tipo: 'LABORATORIO' };
const DIST: OrganizacionLite = { id: 2, cuit: '30222222222', nombre: 'Distribuidora Demo', tipo: 'DISTRIBUIDOR' };
const FARM: OrganizacionLite = { id: 3, cuit: '30333333333', nombre: 'Farmacia Demo', tipo: 'FARMACIA' };
const [SLOT_LAB, SLOT_DIST, SLOT_FARM] = SLOTS;

describe('EnlaceSolicitudFormComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<EnlaceSolicitudFormComponent>;
  let comp: EnlaceSolicitudFormComponent;

  async function montar(fijo: OrganizacionLite | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [EnlaceSolicitudFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EnlaceSolicitudFormComponent);
    fixture.componentRef.setInput('laboratorioFijo', fijo);
    fixture.detectChanges();
    comp = fixture.componentInstance;
  }

  function resolver(slot: (typeof SLOTS)[number], cuit: string, org: OrganizacionLite): void {
    comp.form.controls[slot.key].setValue(cuit);
    comp.buscar(slot, true);
    http.expectOne(`/api/organizaciones/cuit/${cuit}`).flush(org);
  }

  afterEach(() => http.verify());

  it('SUPERADMIN: los tres CUIT son editables y el envío está bloqueado hasta confirmarlos', async () => {
    await montar(null);
    expect(comp.form.controls.laboratorio.enabled).toBe(true);
    expect(comp.todosResueltos()).toBe(false);
    comp.enviar();
    http.expectNone('/api/enlaces-cuit');
  });

  it('LABORATORIO: el laboratorio queda fijo y ya confirmado', async () => {
    await montar(LAB);
    expect(comp.form.controls.laboratorio.disabled).toBe(true);
    expect(comp.resoluciones().laboratorio.estado).toBe('ok');
    expect(comp.form.controls.laboratorio.value).toBe('30-11111111-1');
  });

  it('un CUIT inexistente muestra el mensaje claro y no permite enviar', async () => {
    await montar(LAB);
    comp.form.controls.distribuidor.setValue('30999999999');
    comp.buscar(SLOT_DIST, true);
    http.expectOne('/api/organizaciones/cuit/30999999999').flush(
      { status: 404, code: 'RESOURCE_NOT_FOUND', message: 'Organización no encontrada con CUIT: 30999999999' },
      { status: 404, statusText: 'Not Found' },
    );
    expect(comp.resoluciones().distribuidor.estado).toBe('error');
    expect(comp.resoluciones().distribuidor.mensaje).toBe(
      'Ese CUIT no está registrado; pedí a Sede Central que lo registre.',
    );
    expect(comp.todosResueltos()).toBe(false);
  });

  it('un CUIT de tipo equivocado se rechaza en el cliente', async () => {
    await montar(LAB);
    resolver(SLOT_DIST, '30333333333', FARM); // una farmacia en el campo distribuidor
    expect(comp.resoluciones().distribuidor.estado).toBe('error');
    expect(comp.resoluciones().distribuidor.mensaje).toContain('farmacia');
    expect(comp.resoluciones().distribuidor.mensaje).toContain('distribuidor');
  });

  it('un CUIT mal formado no consulta al backend', async () => {
    await montar(LAB);
    comp.form.controls.distribuidor.setValue('123');
    comp.buscar(SLOT_DIST, true);
    http.expectNone((r) => r.url.startsWith('/api/organizaciones/cuit/'));
    expect(comp.form.controls.distribuidor.hasError('cuitInvalido')).toBe(true);
  });

  it('al editar un CUIT confirmado se descarta la confirmación', async () => {
    await montar(LAB);
    resolver(SLOT_DIST, '30222222222', DIST);
    expect(comp.resoluciones().distribuidor.estado).toBe('ok');
    comp.alEditar(SLOT_DIST);
    expect(comp.resoluciones().distribuidor.estado).toBe('vacio');
  });

  it('envía solo IDs y datos del certificado, sin estado, inspector ni fechas', async () => {
    await montar(LAB);
    resolver(SLOT_DIST, '30222222222', DIST);
    resolver(SLOT_FARM, '30333333333', FARM);
    comp.form.patchValue({
      numeroDisposicionANMAT: ' DISP-123 ',
      documentoCertificadoUrl: 'https://ejemplo.demo/cert.pdf',
    });
    const creadas: EnlaceDto[] = [];
    comp.creada.subscribe((e) => creadas.push(e));
    comp.enviar();
    const req = http.expectOne('/api/enlaces-cuit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      laboratorioId: 1,
      distribuidorId: 2,
      farmaciaId: 3,
      numeroDisposicionANMAT: 'DISP-123',
      documentoCertificadoUrl: 'https://ejemplo.demo/cert.pdf',
    });
    req.flush({ id: 50, laboratorioId: 1, distribuidorId: 2, farmaciaId: 3, estado: 'PENDIENTE' });
    expect(creadas[0].estado).toBe('PENDIENTE');
    // el formulario se limpia pero el laboratorio sigue fijo
    expect(comp.resoluciones().distribuidor.estado).toBe('vacio');
    expect(comp.resoluciones().laboratorio.estado).toBe('ok');
  });

  it('rechaza una URL que no sea http(s)', async () => {
    await montar(LAB);
    comp.form.controls.documentoCertificadoUrl.setValue('ftp://x');
    expect(comp.form.controls.documentoCertificadoUrl.hasError('pattern')).toBe(true);
  });

  it('muestra el mensaje del backend si el alta falla', async () => {
    await montar(LAB);
    resolver(SLOT_DIST, '30222222222', DIST);
    resolver(SLOT_FARM, '30333333333', FARM);
    comp.enviar();
    http.expectOne('/api/enlaces-cuit').flush(
      { status: 400, code: 'INVALID_ARGUMENT', message: 'La organización con ID 3 no es de tipo FARMACIA (tipo actual: DISTRIBUIDOR).' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(comp.errorEnvio()).toContain('no es de tipo FARMACIA');
    expect(comp.enviando()).toBe(false);
  });
});
