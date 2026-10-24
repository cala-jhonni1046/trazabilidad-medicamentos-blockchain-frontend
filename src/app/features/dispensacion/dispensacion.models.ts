import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Tipos propios de F32 (pantalla de dispensación). No amplía otra feature ni el servicio legado. */

export interface UnidadTrazableLite {
  id: number;
  codigoUnicoQR: string;
  loteId: number;
  estado: 'DISPONIBLE' | 'DISPENSADA' | 'BLOQUEADA' | string;
}

export interface LoteLite {
  id: number;
  codigoLote: string;
  estado: string;
  medicamentoNombre?: string | null;
}

/** Refleja DispensacionRequestDTO. dniPaciente nunca se vuelve a leer tras enviarlo. */
export interface DispensacionRequest {
  unidadTrazableId: number;
  farmaciaId: number;
  recetaNumero?: string;
  dniPaciente?: string;
}

/** Refleja DispensacionResponseDTO. El backend nunca devuelve dniPaciente. */
export interface DispensacionResponse {
  id: number;
  recetaNumero: string | null;
  unidadTrazableId: number;
  codigoUnicoQR: string;
  farmaciaId: number;
  farmaciaNombre: string;
  farmaciaCuit: string;
  fechaDispensacion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Normaliza un DNI a solo dígitos (acepta puntos y espacios en la entrada). */
export function normalizarDni(valor: string | null | undefined): string {
  return (valor ?? '').toString().replace(/\D/g, '');
}

/** DNI opcional: si se carga, debe tener 7 u 8 dígitos (se aceptan puntos). */
export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || String(valor).trim() === '') return null;
    const texto = String(valor).trim();
    const digitos = normalizarDni(texto);
    if (!/^[\d.\s]+$/.test(texto) || (digitos.length !== 7 && digitos.length !== 8)) {
      return { dniInvalido: 'El DNI debe tener 7 u 8 dígitos (se aceptan puntos). Debe ser ficticio.' };
    }
    return null;
  };
}
