import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  message?: string;
  fieldErrors?: FieldError[];
  timestamp?: string;
  status?: number;
  error?: string;
}

export function mensajeApi(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el backend. Revisá que esté iniciado y que el proxy esté configurado.';
    }
    const body = error.error as ApiErrorBody | null;
    if (body?.fieldErrors && body.fieldErrors.length > 0) {
      return body.fieldErrors.map((item) => `${item.field}: ${item.message}`).join(' · ');
    }
    if (body?.message) {
      return body.message;
    }
    return `La solicitud falló (HTTP ${error.status}).`;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'No se pudo completar la solicitud.';
}

export function extraerFieldErrors(error: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorBody | null;
    if (body?.fieldErrors) {
      for (const fe of body.fieldErrors) {
        map[fe.field] = fe.message;
      }
    }
  }
  return map;
}
