import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TelemetriaGPS,
  TelemetriaGPSRequest,
  TelemetriaTemperatura,
  TelemetriaTemperaturaRequest,
} from './telemetria.models';
import { DespachoLogistico } from '../despachos/despachos.models';

@Injectable({ providedIn: 'root' })
export class TelemetriaApiService {
  private readonly http = inject(HttpClient);

  getDespachosEnTransito(): Observable<DespachoLogistico[]> {
    const params = new HttpParams().set('estado', 'EN_TRANSITO');
    return this.http.get<DespachoLogistico[]>('/api/despachos-logisticos', { params });
  }

  getLecturasGps(despachoId: number): Observable<TelemetriaGPS[]> {
    const params = new HttpParams().set('despachoLogisticoId', despachoId.toString());
    return this.http.get<TelemetriaGPS[]>('/api/telemetrias-gps', { params });
  }

  registrarGps(request: TelemetriaGPSRequest): Observable<TelemetriaGPS> {
    return this.http.post<TelemetriaGPS>('/api/telemetrias-gps', request);
  }

  getLecturasTemperatura(despachoId: number): Observable<TelemetriaTemperatura[]> {
    const params = new HttpParams().set('despachoLogisticoId', despachoId.toString());
    return this.http.get<TelemetriaTemperatura[]>('/api/telemetrias-temperatura', { params });
  }

  registrarTemperatura(request: TelemetriaTemperaturaRequest): Observable<TelemetriaTemperatura> {
    return this.http.post<TelemetriaTemperatura>('/api/telemetrias-temperatura', request);
  }
}
