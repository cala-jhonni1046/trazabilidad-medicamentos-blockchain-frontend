import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoteLite,
  ReporteCiudadanoDto,
  ReporteFiltros,
  TransicionReporteRequest,
  UnidadTrazableLite,
} from './reportes.models';

/** Servicio propio de F31. */
@Injectable({ providedIn: 'root' })
export class ReportesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/reportes-ciudadanos';

  /**
   * Los filtros son opcionales y se combinan. Según docs/api.md, el backend puede
   * ignorar inspectorId si se combina con otros; por eso quien llama vuelve a
   * filtrar en el cliente (igual patrón que EnlacesApiService).
   */
  listar(filtros: ReporteFiltros = {}): Observable<ReporteCiudadanoDto[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.inspectorId !== undefined) params = params.set('inspectorId', String(filtros.inspectorId));
    if (filtros.unidadTrazableId !== undefined) {
      params = params.set('unidadTrazableId', String(filtros.unidadTrazableId));
    }
    return this.http.get<ReporteCiudadanoDto[]>(this.base, { params });
  }

  obtener(id: number): Observable<ReporteCiudadanoDto> {
    return this.http.get<ReporteCiudadanoDto>(`${this.base}/${id}`);
  }

  /** PENDIENTE → EN_REVISION. El issue pide usar solo POST (también existe PUT; no se usa). */
  iniciarRevision(id: number, body: TransicionReporteRequest = {}): Observable<ReporteCiudadanoDto> {
    return this.http.post<ReporteCiudadanoDto>(`${this.base}/${id}/iniciar-revision`, body);
  }

  /** EN_REVISION → RESUELTO. Igual: solo POST. */
  resolver(id: number, body: TransicionReporteRequest = {}): Observable<ReporteCiudadanoDto> {
    return this.http.post<ReporteCiudadanoDto>(`${this.base}/${id}/resolver`, body);
  }

  /** Para el detalle, cuando el reporte trae unidadTrazableId numérico. */
  obtenerUnidadPorId(id: number): Observable<UnidadTrazableLite> {
    return this.http.get<UnidadTrazableLite>(`/api/unidades-trazables/${id}`);
  }

  /** Para el detalle, cuando el reporte solo trae codigoUnicoQR. */
  obtenerUnidadPorQr(codigoQr: string): Observable<UnidadTrazableLite> {
    return this.http.get<UnidadTrazableLite>(`/api/unidades-trazables/qr/${encodeURIComponent(codigoQr)}`);
  }

  obtenerLote(id: number): Observable<LoteLite> {
    return this.http.get<LoteLite>(`/api/lotes/${id}`);
  }
}
