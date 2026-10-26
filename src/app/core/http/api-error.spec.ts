import { HttpErrorResponse } from '@angular/common/http';
import { extraerFieldErrors, mensajeApi } from './api-error';

describe('api-error', () => {
  it('presenta validaciones H0 y un mensaje útil cuando no hay conexión', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { fieldErrors: [{ field: 'codigoLote', message: 'Es obligatorio' }] },
    });
    expect(mensajeApi(err)).toContain('codigoLote: Es obligatorio');
    expect(mensajeApi(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
  });

  it('extrae los errores por campo', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { fieldErrors: [{ field: 'cuit', message: 'Inválido' }] },
    });
    expect(extraerFieldErrors(err)).toEqual({ cuit: 'Inválido' });
  });
});
