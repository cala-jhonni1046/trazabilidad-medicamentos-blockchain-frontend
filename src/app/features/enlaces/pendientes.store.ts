import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

/**
 * Cantidad de solicitudes de enlace en estado PENDIENTE. Es un signal de módulo para que el
 * menú (que se declara fuera de un contexto de inyección) pueda leerlo con badgeFn.
 */
export const cantidadPendientes = signal<number | null>(null);

@Injectable({ providedIn: 'root' })
export class PendientesEnlacesService {
  private readonly http = inject(HttpClient);

  refrescar(): void {
    this.http
      .get<unknown[]>('/api/enlaces-cuit', { params: new HttpParams().set('estado', 'PENDIENTE') })
      .subscribe({
        next: (lista) => cantidadPendientes.set(lista.length),
        // Si falla, el menú simplemente no muestra el número.
        error: () => cantidadPendientes.set(null),
      });
  }

  fijar(cantidad: number): void {
    cantidadPendientes.set(cantidad);
  }
}
