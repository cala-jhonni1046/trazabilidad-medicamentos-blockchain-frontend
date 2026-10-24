import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type EstadoInspector = 'HABILITADO' | 'SUSPENDIDO';

/** Refleja InspectorANMATResponseDTO del backend. */
export interface InspectorDto {
  id: number;
  usuarioId: number;
  usuarioEmail?: string | null;
  usuarioRol?: string | null;
  dni?: string | null;
  legajoOficial?: string | null;
  nombreCompleto: string;
  emailInstitucional?: string | null;
  fechaHoraAlta?: string | null;
  jefeAutorizador?: string | null;
  estado: EstadoInspector;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

/** Refleja InspectorANMATRequestDTO del backend. */
export interface InspectorRequest {
  usuarioId: number;
  nombreCompleto: string;
  legajoOficial?: string | null;
  dni?: string | null;
  emailInstitucional?: string | null;
  jefeAutorizador?: string | null;
  estado?: EstadoInspector;
}

/** Quita puntos, espacios y cualquier carácter que no sea dígito. */
export function normalizarDni(valor: string | null | undefined): string {
  return (valor ?? '').toString().replace(/\D/g, '');
}

/** DNI opcional: si se carga, debe tener 7 u 8 dígitos (se aceptan puntos y espacios). */
export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || String(valor).trim() === '') return null;
    const texto = String(valor).trim();
    const digitos = normalizarDni(texto);
    if (!/^[\d.\s]+$/.test(texto) || (digitos.length !== 7 && digitos.length !== 8)) {
      return { dniInvalido: 'El DNI debe tener 7 u 8 dígitos (se aceptan puntos).' };
    }
    return null;
  };
}
