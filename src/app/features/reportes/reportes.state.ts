import { signal } from '@angular/core';

/**
 * Contador de reportes PENDIENTES para el badge del menú (F31). Es un signal a nivel
 * de módulo (no un servicio) porque reportes.menu.ts se evalúa antes de que exista el
 * inyector de Angular. ReportesBandejaComponent lo actualiza al cargar/filtrar.
 *
 * F23 (Dev3, cuarentenas) puede leer este mismo signal para su propio contador;
 * no se modifica esa feature desde aquí.
 */
export const reportesPendientesCount = signal<number | null>(null);
