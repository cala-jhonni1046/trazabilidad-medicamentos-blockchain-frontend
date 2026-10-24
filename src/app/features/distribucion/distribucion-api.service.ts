import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DespachoLogistico,
  EventoCustodia,
  TransicionDespachoRequest,
  EventoCustodiaRequest,
} from '../despachos/despachos.models';
import { UnidadVerificacionResponse } from './distribucion.models';

@Injectable({ providedIn: 'root' })
export class DistribucionApiService {
  private readonly http = inject(HttpClient);

  getDespachosDistribuidor(distribuidorId: number): Observable<DespachoLogistico[]> {
    const params = new HttpParams().set('distribuidorId', distribuidorId.toString());
    return this.http.get<DespachoLogistico[]>('/api/despachos-logisticos', { params });
  }

  iniciarDespacho(id: number, request: TransicionDespachoRequest = {}): Observable<DespachoLogistico> {
    return this.http.post<DespachoLogistico>(`/api/despachos-logisticos/${id}/iniciar`, request);
  }

  consultarUnidadPorQr(codigoQr: string): Observable<UnidadVerificacionResponse> {
    return this.http.get<UnidadVerificacionResponse>(
      `/api/unidades-trazables/qr/${encodeURIComponent(codigoQr.trim())}`,
    );
  }

  registrarEvento(despachoId: number, request: EventoCustodiaRequest): Observable<EventoCustodia> {
    return this.http.post<EventoCustodia>(`/api/despachos-logisticos/${despachoId}/eventos`, request);
  }

  getEventos(despachoId: number): Observable<EventoCustodia[]> {
    return this.http.get<EventoCustodia[]>(`/api/despachos-logisticos/${despachoId}/eventos`);
  }
}
