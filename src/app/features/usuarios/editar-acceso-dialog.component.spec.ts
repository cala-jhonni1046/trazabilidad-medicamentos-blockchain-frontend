import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EditarAccesoDialogComponent } from './editar-acceso-dialog.component';
import { UsuarioDto } from './usuarios.models';

const USUARIO: UsuarioDto = {
  id: 7,
  email: 'lab@medichain.demo',
  rol: 'LABORATORIO',
  activo: true,
  organizacionId: 10,
};

describe('EditarAccesoDialogComponent', () => {
  let fixture: ComponentFixture<EditarAccesoDialogComponent>;
  let comp: EditarAccesoDialogComponent;
  let http: HttpTestingController;
  const ref = { close: vi.fn() };

  beforeEach(async () => {
    ref.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [EditarAccesoDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: USUARIO },
        { provide: MatDialogRef, useValue: ref },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EditarAccesoDialogComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('no envía una contraseña corta ni vacía', () => {
    comp.guardar();
    comp.password.setValue('corta');
    comp.guardar();
    http.expectNone('/api/usuarios/7');
    expect(comp.password.invalid).toBe(true);
  });

  it('guarda la contraseña nueva y cierra el diálogo', () => {
    comp.password.setValue('NuevaClave1');
    comp.guardar();
    const req = http.expectOne('/api/usuarios/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.password).toBe('NuevaClave1');
    req.flush(USUARIO);
    expect(ref.close).toHaveBeenCalledWith(true);
  });

  it('muestra el error del backend y no cierra', () => {
    comp.password.setValue('NuevaClave1');
    comp.guardar();
    http.expectOne('/api/usuarios/7').flush(
      { status: 400, code: 'INVALID_ARGUMENT', message: 'La contraseña debe tener al menos 8 caracteres.' },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(comp.password.getError('servidor')).toContain('8 caracteres');
    expect(ref.close).not.toHaveBeenCalled();
    expect(comp.enviando()).toBe(false);
  });
});
