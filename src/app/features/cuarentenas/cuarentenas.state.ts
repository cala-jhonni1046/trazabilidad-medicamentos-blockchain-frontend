import { signal } from '@angular/core';

/**
 * Contador de lotes en cuarentena abierta para el badge del menú (F23).
 * Signal a nivel de módulo que se actualiza al cargar el dashboard de cuarentenas.
 */
export const cuarentenasAbiertasCount = signal<number | null>(null);
