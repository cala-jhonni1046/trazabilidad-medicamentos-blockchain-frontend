import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EnlaceDto } from './enlaces.models';
import { ResolverEnlaceDialogComponent } from './resolver-enlace-dialog.component';

const ENLACE: EnlaceDto = {
  id: 1, laboratorioId: 1, distribuidorId: 2, farmaciaId: 3,
  numeroDisposicionANMAT: 'DISP-1', documentoCertificadoUrl: null, estado: 'PENDIENTE',
};

describe('ResolverEnlaceDialogComponent', () => {
  const cerrar = vi.fn();

  function crear(accion: 'aprobar' | 'rechazar'): ResolverEnlaceDialogComponent {
    cerrar.mockClear();
    TestBed.configureTestingModule({
      imports: [ResolverEnlaceDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { enlace: ENLACE, accion } },
        { provide: MatDialogRef, useValue: { close: cerrar } },
      ],
    });
    const fixture = TestBed.createComponent(ResolverEnlaceDialogComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('precarga la disposición y devuelve los valores al confirmar', () => {
    const comp = crear('aprobar');
    expect(comp.aprobar).toBe(true);
    expect(comp.form.controls.numeroDisposicionANMAT.value).toBe('DISP-1');
    comp.form.patchValue({ documentoCertificadoUrl: ' https://ejemplo.demo/c ' });
    comp.confirmar();
    expect(cerrar).toHaveBeenCalledWith({
      numeroDisposicionANMAT: 'DISP-1',
      documentoCertificadoUrl: 'https://ejemplo.demo/c',
    });
  });

  it('no confirma con una URL inválida', () => {
    const comp = crear('rechazar');
    expect(comp.aprobar).toBe(false);
    comp.form.patchValue({ documentoCertificadoUrl: 'javascript:alert(1)' });
    comp.confirmar();
    expect(cerrar).not.toHaveBeenCalled();
  });

  it('cancelar cierra sin resultado', () => {
    const comp = crear('aprobar');
    comp.cancelar();
    expect(cerrar).toHaveBeenCalledWith();
  });
});
