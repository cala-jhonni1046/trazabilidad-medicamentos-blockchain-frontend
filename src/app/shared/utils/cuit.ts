import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Normaliza un CUIT eliminando guiones, espacios y caracteres no numéricos.
 */
export function normalizarCuit(cuit: string | null | undefined): string {
  if (!cuit) return '';
  return cuit.toString().replace(/\D/g, '');
}

/**
 * Formatea un CUIT numérico de 11 dígitos al formato XX-XXXXXXXX-X.
 * Si no tiene 11 dígitos, devuelve el texto limpio original.
 */
export function formatearCuit(cuit: string | null | undefined): string {
  const limpio = normalizarCuit(cuit);
  if (limpio.length === 11) {
    return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10, 11)}`;
  }
  return cuit ? cuit.toString() : '';
}

/**
 * Validador para Reactive Forms de Angular.
 * Acepta 11 dígitos o el formato XX-XXXXXXXX-X, igual que el backend.
 * No verifica el dígito verificador: el CUIT es un dato demostrativo y no se valida contra ARCA/AFIP.
 */
export function cuitValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (val === null || val === undefined || val === '') {
      return null; // si es obligatorio, usar Validators.required por separado
    }
    const texto = String(val).trim();
    if (!/^(\d{11}|\d{2}-\d{8}-\d)$/.test(texto)) {
      return { cuitInvalido: 'El CUIT debe tener 11 dígitos o el formato XX-XXXXXXXX-X.' };
    }
    return null;
  };
}
