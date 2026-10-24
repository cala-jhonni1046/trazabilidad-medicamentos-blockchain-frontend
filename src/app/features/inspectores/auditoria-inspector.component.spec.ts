import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AuditoriaInspectorComponent } from './auditoria-inspector.component';

const TODOS = [
  { id: 1, usuarioId: 2, nombreCompleto: 'Inspector Uno', dni: '11.222.333', estado: 'HABILITADO' },
  { id: 2, usuarioId: 3, nombreCompleto: 'Inspector Dos', dni: '44555666', estado: 'SUSPENDIDO' },
];

describe('AuditoriaInspectorComponent', () => {
  let http: HttpTestingController;
  let comp: AuditoriaInspectorComponent;
  let fixture: ComponentFixture<AuditoriaInspectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditoriaInspectorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AuditoriaInspectorComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function buscar(dni: string, respuesta: unknown[]): void {
    comp.dni.setValue(dni);
    comp.buscar();
    http.expectOne((r) => r.url === '/api/inspectores').flush(respuesta);
  }

  it('encuentra al inspector con y sin puntos, aunque el backend devuelva todo el listado', () => {
    buscar('11222333', TODOS);
    expect(comp.resultado()?.id).toBe(1);
    buscar('11.222.333', TODOS);
    expect(comp.resultado()?.id).toBe(1);
    buscar('44.555.666', TODOS);
    expect(comp.resultado()?.id).toBe(2);
  });

  it('sin coincidencia deja el estado "consultado" sin resultado', () => {
    buscar('99999999', TODOS);
    expect(comp.resultado()).toBeNull();
    expect(comp.consultado()).toBe(true);
  });

  it('un DNI inválido no consulta al backend', () => {
    comp.dni.setValue('12');
    comp.buscar();
    http.expectNone((r) => r.url === '/api/inspectores');
    expect(comp.dni.invalid).toBe(true);
  });

  it('al enviar el formulario (botón o Enter) consulta al backend', () => {
    comp.dni.setValue('11.222.333');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    http.expectOne((r) => r.url === '/api/inspectores').flush(TODOS);
    expect(comp.resultado()?.id).toBe(1);
  });
});
