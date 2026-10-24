import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, concatMap, from, map, of, toArray, throwError } from 'rxjs';
import {
  Lote,
  LoteRequest,
  UnidadResumen,
} from './lotes.models';

export interface GeneracionResultado {
  unidades: UnidadResumen[];
  fallbackUsado: boolean;
  advertencia?: string;
}

@Injectable({ providedIn: 'root' })
export class LotesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/lotes';

  listar(laboratorioId?: number): Observable<Lote[]> {
    let params = new HttpParams();
    if (laboratorioId != null) {
      params = params.set('laboratorioId', String(laboratorioId));
    }
    return this.http.get<Lote[]>(this.base, { params });
  }

  obtenerPorId(id: number): Observable<Lote> {
    return this.http.get<Lote>(`${this.base}/${id}`);
  }

  crear(body: LoteRequest): Observable<Lote> {
    return this.http.post<Lote>(this.base, body);
  }

  actualizar(id: number, body: LoteRequest): Observable<Lote> {
    return this.http.put<Lote>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  obtenerUnidadesPorLote(loteId: number): Observable<UnidadResumen[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<UnidadResumen[]>('/api/unidades-trazables', { params });
  }

  generarUnidades(loteId: number, cantidad: number): Observable<GeneracionResultado> {
    // Intenta endpoint nuevo de backend 2.1: POST /api/lotes/{id}/unidades
    return this.http.post<UnidadResumen[]>(`${this.base}/${loteId}/unidades`, { cantidad }).pipe(
      map((unidades) => ({
        unidades: Array.isArray(unidades) ? unidades : [],
        fallbackUsado: false,
      })),
      catchError((err: unknown) => {
        // Si el endpoint no existe (404/405), activar fallback secuencial
        if (err instanceof HttpErrorResponse && (err.status === 404 || err.status === 405)) {
          const limite = Math.min(Math.max(1, cantidad), 50);
          const indices = Array.from({ length: limite }, (_, i) => i + 1);

          return from(indices).pipe(
            concatMap(() =>
              this.http.post<UnidadResumen>('/api/unidades-trazables', { loteId }),
            ),
            toArray(),
            map((creadas) => ({
              unidades: creadas,
              fallbackUsado: true,
              advertencia:
                cantidad > 50
                  ? `Se generaron 50 unidades en modo fallback secuencial (límite alcanzado).`
                  : `Unidades generadas en modo fallback secuencial.`,
            })),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
