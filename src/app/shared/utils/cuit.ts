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
 * Comprueba que el CUIT contenga exactamente 11 dígitos numéricos
 * y que verifique el dígito verificador del algoritmo oficial de CUIT argentino.
 */
export function cuitValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (val === null || val === undefined || val === '') {
      return null; // si es opcional, usar Validators.required por separado
    }

    const limpio = normalizarCuit(String(val));
    if (limpio.length !== 11) {
      return { cuitInvalido: 'El CUIT debe tener exactamente 11 dígitos numéricos.' };
    }

    // Validación del dígito verificador (módulo 11)
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += parseInt(limpio[i], 10) * multiplicadores[i];
    }
    const resto = suma % 11;
    let digitoEsperado = 11 - resto;
    if (digitoEsperado === 11) digitoEsperado = 0;
    if (digitoEsperado === 10) digitoEsperado = 9;

    const digitoReal = parseInt(limpio[10], 10);
    if (digitoReal !== digitoEsperado) {
      return { cuitVerificadorInvalido: 'El dígito verificador del CUIT no es válido.' };
    }

    return null;
  };
}
