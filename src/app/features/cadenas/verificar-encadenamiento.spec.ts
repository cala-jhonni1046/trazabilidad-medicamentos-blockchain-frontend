import { EventoCustodiaDto } from './cadenas.models';
import { verificarEncadenamiento } from './verificar-encadenamiento';

function evento(parcial: Partial<EventoCustodiaDto>): EventoCustodiaDto {
  return {
    id: 1,
    tipo: 'LOTE_DESPACHADO',
    fechaHoraEvento: '2026-10-20T10:00:00',
    despachoLogisticoId: 1,
    hashAnterior: null,
    hashEvento: null,
    ...parcial,
  };
}

describe('verificarEncadenamiento', () => {
  it('una lista vacía es OK (nada que romper)', () => {
    expect(verificarEncadenamiento([])).toEqual({ ok: true, noVerificable: false, indiceRuptura: null });
  });

  it('una cadena continua de 3 eventos es OK', () => {
    const eventos = [
      evento({ id: 1, hashAnterior: null, hashEvento: 'h1' }),
      evento({ id: 2, hashAnterior: 'h1', hashEvento: 'h2' }),
      evento({ id: 3, hashAnterior: 'h2', hashEvento: 'h3' }),
    ];
    expect(verificarEncadenamiento(eventos)).toEqual({ ok: true, noVerificable: false, indiceRuptura: null });
  });

  it('un solo evento sin hashAnterior (inicio de cadena) es OK', () => {
    const eventos = [evento({ id: 1, hashAnterior: null, hashEvento: 'h1' })];
    expect(verificarEncadenamiento(eventos)).toEqual({ ok: true, noVerificable: false, indiceRuptura: null });
  });

  it('detecta una ruptura y señala el índice del evento donde ocurre', () => {
    const eventos = [
      evento({ id: 1, hashAnterior: null, hashEvento: 'h1' }),
      evento({ id: 2, hashAnterior: 'h1', hashEvento: 'h2' }),
      evento({ id: 3, hashAnterior: 'OTRO-HASH-DISTINTO', hashEvento: 'h3' }), // rota acá
    ];
    expect(verificarEncadenamiento(eventos)).toEqual({ ok: false, noVerificable: false, indiceRuptura: 2 });
  });

  it('si falta el hashEvento de cualquier evento, es "no verificable" (no "OK")', () => {
    const eventos = [
      evento({ id: 1, hashAnterior: null, hashEvento: 'h1' }),
      evento({ id: 2, hashAnterior: 'h1', hashEvento: null }), // falta
    ];
    const r = verificarEncadenamiento(eventos);
    expect(r.ok).toBe(false);
    expect(r.noVerificable).toBe(true);
  });

  it('si falta el hashAnterior de un evento que no es el primero, es "no verificable"', () => {
    const eventos = [
      evento({ id: 1, hashAnterior: null, hashEvento: 'h1' }),
      evento({ id: 2, hashAnterior: null, hashEvento: 'h2' }), // debería tener hashAnterior='h1'
    ];
    const r = verificarEncadenamiento(eventos);
    expect(r.ok).toBe(false);
    expect(r.noVerificable).toBe(true);
  });
});
