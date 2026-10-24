import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RolUsuario, SessionService } from '../../core/session/session.service';
import { MedicamentosComponent } from './medicamentos.component';
import { MedicamentoDto } from './medicamentos.models';

const LISTA_MOCK: MedicamentoDto[] = [
  { id: 1, nombre: 'Paracetamol 500mg', principioActivo: 'Paracetamol', requiereCadenaFrio: false },
  { id: 2, nombre: 'Insulina Glargina', principioActivo: 'Insulina humana', requiereCadenaFrio: true },
  { id: 3, nombre: 'Amoxicilina 500mg', principioActivo: 'Amoxicilina', requiereCadenaFrio: false },
];

describe('MedicamentosComponent', () => {
  let http: HttpTestingController;

  async function montar(rol: RolUsuario): Promise<{
    fixture: ComponentFixture<MedicamentosComponent>;
    comp: MedicamentosComponent;
  }> {
    window.sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MedicamentosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    TestBed.inject(SessionService).iniciarSesion({
      id: 1,
      email: 'lab@medichain.demo',
      rol,
      activo: true,
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MedicamentosComponent);
    fixture.detectChanges();
    http.expectOne('/api/medicamentos').flush(LISTA_MOCK);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  afterEach(() => http.verify());

  it('LABORATORIO ve el formulario de alta y columna de acciones', async () => {
    const { fixture, comp } = await montar('LABORATORIO');
    expect(comp.puedeEditar()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(comp.columnas()).toContain('acciones');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(3);
  });

  it('SUPERADMIN también ve el formulario y puede editar', async () => {
    const { fixture, comp } = await montar('SUPERADMIN');
    expect(comp.puedeEditar()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });

  it('ANMAT ve la tabla en modo solo lectura sin formulario ni botones de edición', async () => {
    const { fixture, comp } = await montar('ANMAT');
    expect(comp.puedeEditar()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(comp.columnas()).not.toContain('acciones');
    expect(fixture.nativeElement.querySelector('button[aria-label="Editar medicamento"]')).toBeNull();
    comp.editar(LISTA_MOCK[0]);
    expect(comp.editando()).toBeNull();
  });

  it('filtra por búsqueda de texto y por requerimiento de cadena de frío', async () => {
    const { comp } = await montar('LABORATORIO');
    comp.busqueda.set('insulina');
    expect(comp.filtrados().map((m) => m.id)).toEqual([2]);

    comp.busqueda.set('');
    comp.filtroFrio.set('CON_FRIO');
    expect(comp.filtrados().map((m) => m.id)).toEqual([2]);

    comp.filtroFrio.set('SIN_FRIO');
    expect(comp.filtrados().map((m) => m.id)).toEqual([1, 3]);
  });

  it('no envía el formulario si faltan campos obligatorios', async () => {
    const { comp } = await montar('LABORATORIO');
    comp.form.controls.nombre.setValue('');
    comp.form.controls.principioActivo.setValue('');
    comp.guardar();
    expect(comp.enviando()).toBe(false);
  });

  it('crea un medicamento válido con POST y lo agrega a la lista', async () => {
    const { comp } = await montar('LABORATORIO');
    comp.form.setValue({
      nombre: 'Ibuprofeno 600',
      principioActivo: 'Ibuprofeno',
      requiereCadenaFrio: false,
    });
    comp.guardar();

    const nuevo: MedicamentoDto = {
      id: 4,
      nombre: 'Ibuprofeno 600',
      principioActivo: 'Ibuprofeno',
      requiereCadenaFrio: false,
    };
    const req = http.expectOne('/api/medicamentos');
    expect(req.request.method).toBe('POST');
    req.flush(nuevo);

    expect(comp.medicamentos().some((m) => m.id === 4)).toBe(true);
    expect(comp.editando()).toBeNull();
  });

  it('edita un medicamento existente con PUT', async () => {
    const { comp } = await montar('LABORATORIO');
    comp.editar(LISTA_MOCK[0]);
    expect(comp.editando()?.id).toBe(1);

    comp.form.controls.nombre.setValue('Paracetamol 1g');
    comp.guardar();

    const actualizado: MedicamentoDto = {
      ...LISTA_MOCK[0],
      nombre: 'Paracetamol 1g',
    };
    const req = http.expectOne('/api/medicamentos/1');
    expect(req.request.method).toBe('PUT');
    req.flush(actualizado);

    expect(comp.medicamentos().find((m) => m.id === 1)?.nombre).toBe('Paracetamol 1g');
    expect(comp.editando()).toBeNull();
  });

  it('eliminar pide confirmación y maneja error 409 con mensaje del backend', async () => {
    const { comp } = await montar('LABORATORIO');
    const dialog = TestBed.inject(MatDialog);
    const snack = TestBed.inject(MatSnackBar);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as ReturnType<MatDialog['open']>);
    const snackSpy = vi.spyOn(snack, 'open');

    comp.eliminar(LISTA_MOCK[0]);
    const req = http.expectOne('/api/medicamentos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(
      { message: 'No se puede eliminar: tiene lotes asociados' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(snackSpy).toHaveBeenCalledWith('No se puede eliminar: tiene lotes asociados', 'Cerrar', {
      duration: 8000,
    });
    expect(comp.medicamentos().length).toBe(3);
  });
});
