import { EventoCustodiaDto, ResultadoEncadenamiento } from './cadenas.models';

/**
 * Verifica, en el cliente, que la cadena de eventos de un despacho sea continua:
 * cada hashAnterior debe coincidir con el hashEvento del evento inmediatamente
 * anterior en el arreglo recibido (se asume ya ordenado cronológicamente).
 *
 * Es una verificación de CONSISTENCIA local, no una prueba criptográfica de firmas
 * ni de pertenencia a una blockchain distribuida (F33, "Comprobar lote").
 *
 * El primer evento no tiene un evento previo con el que comparar: que su
 * hashAnterior venga vacío es normal (inicio de la cadena) y no cuenta como dato
 * faltante. Si falta cualquier otro hash (hashEvento de cualquier evento, o el
 * hashAnterior de un evento que no sea el primero), el resultado es "no
 * verificable", distinto de "OK" y distinto de "ruptura detectada".
 */
export function verificarEncadenamiento(eventos: EventoCustodiaDto[]): ResultadoEncadenamiento {
  if (eventos.length === 0) {
    return { ok: true, noVerificable: false, indiceRuptura: null };
  }

  for (let i = 0; i < eventos.length; i++) {
    if (!eventos[i].hashEvento) {
      return { ok: false, noVerificable: true, indiceRuptura: null };
    }
    if (i > 0 && !eventos[i].hashAnterior) {
      return { ok: false, noVerificable: true, indiceRuptura: null };
    }
  }

  for (let i = 1; i < eventos.length; i++) {
    if (eventos[i].hashAnterior !== eventos[i - 1].hashEvento) {
      return { ok: false, noVerificable: false, indiceRuptura: i };
    }
  }

  return { ok: true, noVerificable: false, indiceRuptura: null };
}
