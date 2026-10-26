import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DispensacionRequest, DispensacionResponse, LoteLite, UnidadTrazableLite } from './dispensacion.models';

/** Servicio propio de F32 (dispensación). */
@Injectable({ providedIn: 'root' })
export class DispensacionApiService {
  private readonly http = inject(HttpClient);

  buscarUnidadPorQr(codigoQr: string): Observable<UnidadTrazableLite> {
    return this.http.get<UnidadTrazableLite>(`/api/unidades-trazables/qr/${encodeURIComponent(codigoQr)}`);
  }

  obtenerLote(id: number): Observable<LoteLite> {
    return this.http.get<LoteLite>(`/api/lotes/${id}`);
  }

  crear(body: DispensacionRequest): Observable<DispensacionResponse> {
    return this.http.post<DispensacionResponse>('/api/dispensaciones', body);
  }
}
