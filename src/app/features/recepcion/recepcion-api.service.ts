import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RecepcionFarmaciaRequest,
  RecepcionFarmaciaResponse,
} from './recepcion.models';
import { DespachoLogistico, EventoCustodia } from '../despachos/despachos.models';
import { TelemetriaTemperatura } from '../telemetria/telemetria.models';

@Injectable({ providedIn: 'root' })
export class RecepcionApiService {
  private readonly http = inject(HttpClient);

  getDespachosEnTransito(farmaciaDestinoId: number): Observable<DespachoLogistico[]> {
    const params = new HttpParams()
      .set('farmaciaDestinoId', farmaciaDestinoId.toString())
      .set('estado', 'EN_TRANSITO');
    return this.http.get<DespachoLogistico[]>('/api/despachos-logisticos', { params });
  }

  getEventos(despachoId: number): Observable<EventoCustodia[]> {
    return this.http.get<EventoCustodia[]>(`/api/despachos-logisticos/${despachoId}/eventos`);
  }

  getTemperaturas(despachoId: number): Observable<TelemetriaTemperatura[]> {
    const params = new HttpParams().set('despachoLogisticoId', despachoId.toString());
    return this.http.get<TelemetriaTemperatura[]>('/api/telemetrias-temperatura', { params });
  }

  crearRecepcion(request: RecepcionFarmaciaRequest): Observable<RecepcionFarmaciaResponse> {
    return this.http.post<RecepcionFarmaciaResponse>('/api/recepciones-farmacia', request);
  }

  getRecepciones(farmaciaId: number): Observable<RecepcionFarmaciaResponse[]> {
    const params = new HttpParams().set('farmaciaId', farmaciaId.toString());
    return this.http.get<RecepcionFarmaciaResponse[]>('/api/recepciones-farmacia', { params });
  }
}
