import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DespachoLogistico,
  DespachoLogisticoRequest,
  TransicionDespachoRequest,
  EventoCustodia,
  EventoCustodiaRequest,
  LoteSimple,
  EnlaceCuitSimple,
} from './despachos.models';

@Injectable({ providedIn: 'root' })
export class DespachosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/despachos-logisticos';

  getDespachos(filtros?: {
    loteId?: number | null;
    estado?: string | null;
    distribuidorId?: number | null;
    farmaciaDestinoId?: number | null;
  }): Observable<DespachoLogistico[]> {
    let params = new HttpParams();
    if (filtros?.loteId) params = params.set('loteId', filtros.loteId.toString());
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.distribuidorId) params = params.set('distribuidorId', filtros.distribuidorId.toString());
    if (filtros?.farmaciaDestinoId) params = params.set('farmaciaDestinoId', filtros.farmaciaDestinoId.toString());

    return this.http.get<DespachoLogistico[]>(this.baseUrl, { params });
  }

  getDespachoPorId(id: number): Observable<DespachoLogistico> {
    return this.http.get<DespachoLogistico>(`${this.baseUrl}/${id}`);
  }

  crearDespacho(request: DespachoLogisticoRequest): Observable<DespachoLogistico> {
    return this.http.post<DespachoLogistico>(this.baseUrl, request);
  }

  iniciarDespacho(id: number, request: TransicionDespachoRequest = {}): Observable<DespachoLogistico> {
    return this.http.post<DespachoLogistico>(`${this.baseUrl}/${id}/iniciar`, request);
  }

  cancelarDespacho(id: number, request: TransicionDespachoRequest = {}): Observable<DespachoLogistico> {
    return this.http.post<DespachoLogistico>(`${this.baseUrl}/${id}/cancelar`, request);
  }

  getEventos(despachoId: number): Observable<EventoCustodia[]> {
    return this.http.get<EventoCustodia[]>(`${this.baseUrl}/${despachoId}/eventos`);
  }

  registrarEvento(despachoId: number, request: EventoCustodiaRequest): Observable<EventoCustodia> {
    return this.http.post<EventoCustodia>(`${this.baseUrl}/${despachoId}/eventos`, request);
  }

  getEnlacesActivos(): Observable<EnlaceCuitSimple[]> {
    const params = new HttpParams().set('estado', 'ACTIVO');
    return this.http.get<EnlaceCuitSimple[]>('/api/enlaces-cuit', { params });
  }

  getLotes(): Observable<LoteSimple[]> {
    return this.http.get<LoteSimple[]>('/api/lotes');
  }
}
