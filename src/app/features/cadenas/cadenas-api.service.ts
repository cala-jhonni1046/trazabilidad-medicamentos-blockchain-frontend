import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  DespachoDto,
  EnlaceDto,
  EventoCustodiaDto,
  LoteDto,
  RegistroBlockchainDto,
  RegistroBlockchainRequest,
} from './cadenas.models';

/** Servicio propio de F33. */
@Injectable({ providedIn: 'root' })
export class CadenasApiService {
  private readonly http = inject(HttpClient);

  listarEnlacesActivos(): Observable<EnlaceDto[]> {
    const params = new HttpParams().set('estado', 'ACTIVO');
    return this.http.get<EnlaceDto[]>('/api/enlaces-cuit', { params });
  }

  listarLotes(): Observable<LoteDto[]> {
    return this.http.get<LoteDto[]>('/api/lotes');
  }

  /** Sin filtros: se carga una sola vez y se asocia en el cliente por loteId/enlaceCuitId. */
  listarDespachos(): Observable<DespachoDto[]> {
    return this.http.get<DespachoDto[]>('/api/despachos-logisticos');
  }

  listarDespachosDeLote(loteId: number): Observable<DespachoDto[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<DespachoDto[]>('/api/despachos-logisticos', { params });
  }

  listarEventos(despachoId: number): Observable<EventoCustodiaDto[]> {
    return this.http.get<EventoCustodiaDto[]>(`/api/despachos-logisticos/${despachoId}/eventos`);
  }

  obtenerLotePorCodigo(codigoLote: string): Observable<LoteDto | null> {
    // No hay búsqueda por código en el backend: se busca en el cliente sobre el listado completo.
    return this.listarLotes().pipe(
      map((lotes) => lotes.find((l) => l.codigoLote === codigoLote) ?? null),
    );
  }

  /**
   * GET /api/registros-blockchain devuelve 200 con el cuerpo vacío/nulo cuando no
   * hay registros (204 según docs/api.md); se normaliza siempre a un arreglo.
   */
  listarRegistros(): Observable<RegistroBlockchainDto[]> {
    return this.http
      .get<RegistroBlockchainDto[] | null>('/api/registros-blockchain')
      .pipe(map((body) => body ?? []));
  }

  crearRegistro(body: RegistroBlockchainRequest): Observable<RegistroBlockchainDto> {
    return this.http.post<RegistroBlockchainDto>('/api/registros-blockchain', body);
  }
}
