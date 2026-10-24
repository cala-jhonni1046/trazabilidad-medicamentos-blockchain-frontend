import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import {
  DespachoLite,
  ItemInventario,
  LoteLite,
  RecepcionLite,
  UnidadTrazableLite,
} from './farmacia.models';

/**
 * Servicio propio de F32. No existe un endpoint de inventario directo: se construye
 * combinando recepciones → despachos → lotes → unidades, agrupando las consultas por
 * ID único para evitar N+1 (una sola llamada por despacho/lote distintos, no por recepción).
 */
@Injectable({ providedIn: 'root' })
export class FarmaciaApiService {
  private readonly http = inject(HttpClient);

  listarRecepciones(farmaciaId: number): Observable<RecepcionLite[]> {
    const params = new HttpParams().set('farmaciaId', String(farmaciaId));
    return this.http.get<RecepcionLite[]>('/api/recepciones-farmacia', { params });
  }

  obtenerDespacho(id: number): Observable<DespachoLite> {
    return this.http.get<DespachoLite>(`/api/despachos-logisticos/${id}`);
  }

  obtenerLote(id: number): Observable<LoteLite> {
    return this.http.get<LoteLite>(`/api/lotes/${id}`);
  }

  listarUnidadesDeLote(loteId: number): Observable<UnidadTrazableLite[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<UnidadTrazableLite[]>('/api/unidades-trazables', { params });
  }

  listarDispensaciones(farmaciaId: number): Observable<{ id: number; codigoUnicoQR: string }[]> {
    const params = new HttpParams().set('farmaciaId', String(farmaciaId));
    return this.http.get<{ id: number; codigoUnicoQR: string }[]>('/api/dispensaciones', { params });
  }

  /**
   * Construye el inventario de la farmacia: recepciones CONFORME/OBSERVADA → sus lotes →
   * unidades de esos lotes. "estado" de la unidad viene siempre del backend (DISPONIBLE,
   * DISPENSADA o BLOQUEADA); esta pantalla no lo calcula.
   */
  inventario(farmaciaId: number): Observable<ItemInventario[]> {
    return this.listarRecepciones(farmaciaId).pipe(
      switchMap((recepciones) => {
        const validas = recepciones.filter(
          (r) => r.estadoConformidad === 'CONFORME' || r.estadoConformidad === 'OBSERVADA',
        );
        const despachoIds = [...new Set(validas.map((r) => r.despachoLogisticoId))];
        if (despachoIds.length === 0) return of<ItemInventario[]>([]);

        return forkJoin(despachoIds.map((id) => this.obtenerDespacho(id))).pipe(
          switchMap((despachos) => {
            const loteIds = [...new Set(despachos.map((d) => d.loteId))];
            return forkJoin(
              loteIds.map((loteId) =>
                forkJoin({
                  lote: this.obtenerLote(loteId),
                  unidades: this.listarUnidadesDeLote(loteId),
                }),
              ),
            );
          }),
          map((grupos) =>
            grupos.flatMap(({ lote, unidades }) =>
              unidades.map((u) => ({
                unidadId: u.id,
                codigoQr: u.codigoUnicoQR,
                loteId: lote.id,
                codigoLote: lote.codigoLote,
                medicamentoNombre: lote.medicamentoNombre ?? null,
                estado: u.estado,
              })),
            ),
          ),
        );
      }),
    );
  }
}
