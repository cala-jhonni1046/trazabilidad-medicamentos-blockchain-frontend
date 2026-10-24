import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CuarentenaDTO,
  CuarentenaRequest,
  CuarentenaResolucionRequest,
} from './cuarentenas.models';
import { LoteSimple, EnlaceCuitSimple, DespachoLogistico } from '../despachos/despachos.models';
import { TelemetriaTemperatura } from '../telemetria/telemetria.models';

@Injectable({ providedIn: 'root' })
export class CuarentenasApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/cuarentenas';

  getCuarentenas(filtros?: { estado?: string | null; loteId?: number | null }): Observable<CuarentenaDTO[]> {
    let params = new HttpParams();
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.loteId) params = params.set('loteId', filtros.loteId.toString());

    return this.http.get<CuarentenaDTO[]>(this.baseUrl, { params });
  }

  getCuarentenaPorId(id: number): Observable<CuarentenaDTO> {
    return this.http.get<CuarentenaDTO>(`${this.baseUrl}/${id}`);
  }

  abrirCuarentena(request: CuarentenaRequest): Observable<CuarentenaDTO> {
    return this.http.post<CuarentenaDTO>(this.baseUrl, request);
  }

  liberarCuarentena(id: number, request: CuarentenaResolucionRequest): Observable<CuarentenaDTO> {
    return this.http.post<CuarentenaDTO>(`${this.baseUrl}/${id}/liberar`, request);
  }

  mantenerCuarentena(id: number, request: CuarentenaResolucionRequest): Observable<CuarentenaDTO> {
    return this.http.post<CuarentenaDTO>(`${this.baseUrl}/${id}/mantener`, request);
  }

  getLotes(): Observable<LoteSimple[]> {
    return this.http.get<LoteSimple[]>('/api/lotes');
  }

  getDespachos(loteId?: number): Observable<DespachoLogistico[]> {
    let params = new HttpParams();
    if (loteId) params = params.set('loteId', loteId.toString());
    return this.http.get<DespachoLogistico[]>('/api/despachos-logisticos', { params });
  }

  getTemperaturas(despachoId?: number): Observable<TelemetriaTemperatura[]> {
    let params = new HttpParams();
    if (despachoId) params = params.set('despachoLogisticoId', despachoId.toString());
    return this.http.get<TelemetriaTemperatura[]>('/api/telemetrias-temperatura', { params });
  }

  getEnlacesActivos(): Observable<EnlaceCuitSimple[]> {
    const params = new HttpParams().set('estado', 'ACTIVO');
    return this.http.get<EnlaceCuitSimple[]>('/api/enlaces-cuit', { params });
  }

  getReportesPendientes(): Observable<unknown[]> {
    const params = new HttpParams().set('estado', 'PENDIENTE');
    return this.http.get<unknown[]>('/api/reportes-ciudadanos', { params });
  }
}
