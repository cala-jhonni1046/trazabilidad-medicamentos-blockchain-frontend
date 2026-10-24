import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type EstadoLote = 'CREADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'EN_CUARENTENA' | 'LIBERADO' | 'CERRADO';
export type EstadoDespacho = 'PREPARADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'CANCELADO';

export interface Lote {
  id: number;
  codigoLote: string;
  medicamentoId: number;
  medicamentoNombre: string;
  laboratorioId: number;
  laboratorioNombre: string;
  laboratorioCuit: string;
  tempMin: number | null;
  tempMax: number | null;
  fechaHoraFabricacion: string | null;
  estado: EstadoLote;
  fechaCreacion: string;
}

export interface LoteRequest {
  codigoLote: string;
  medicamentoId: number;
  laboratorioId: number;
  tempMin?: number | null;
  tempMax?: number | null;
  fechaHoraFabricacion?: string | null;
}

export interface Medicamento { id: number; nombre: string; principioActivo: string; requiereCadenaFrio: boolean; }
export interface Organizacion { id: number; nombre: string; cuit: string; tipo: string; }
export interface Despacho {
  id: number;
  loteId: number;
  codigoLote: string;
  numeroRemito: string;
  distribuidorNombre: string;
  farmaciaDestinoNombre: string;
  estado: EstadoDespacho;
  fechaSalida: string | null;
}
export interface TelemetriaTemperatura {
  id: number;
  despachoLogisticoId: number;
  sensorId: string;
  temperatura: number;
  alertaExcursion: boolean | null;
  fechaHora: string;
}
export interface Cuarentena { id: number; loteId: number; codigoLote: string; estado: string; fechaInicio: string; }
export interface EventoCustodia {
  id: number;
  tipo: string;
  fechaHoraEvento: string;
  organizacionActorNombre: string | null;
  descripcion: string | null;
  hashEvento: string | null;
}
export interface ConsultaQR {
  codigoConsultado: string;
  estadoUnidad: string;
  medicamento: { nombre: string; principioActivo: string; requiereCadenaFrio: boolean } | null;
  lote: { codigoLote: string; fechaFabricacion: string | null; estadoLote: string } | null;
  cuarentena: { enCuarentena: boolean; resumen: string | null; fechaInicio: string | null } | null;
  historialCustodia: { tipoEvento: string; fechaHoraEvento: string; descripcion: string; hashDemostrativo: string | null }[];
  advertencias: string[];
  informacionRegulatoria: string;
}

@Injectable({ providedIn: 'root' })
export class MedicamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getLotes(): Observable<Lote[]> { return this.http.get<Lote[]>(`${this.base}/lotes`); }
  getMedicamentos(): Observable<Medicamento[]> { return this.http.get<Medicamento[]>(`${this.base}/medicamentos`); }
  getOrganizaciones(): Observable<Organizacion[]> { return this.http.get<Organizacion[]>(`${this.base}/organizaciones`); }
  crearLote(request: LoteRequest): Observable<Lote> { return this.http.post<Lote>(`${this.base}/lotes`, request); }
  getDespachos(loteId?: number): Observable<Despacho[]> {
    const params = loteId == null ? undefined : new HttpParams().set('loteId', loteId);
    return this.http.get<Despacho[]>(`${this.base}/despachos-logisticos`, { params });
  }
  getTemperaturas(): Observable<TelemetriaTemperatura[]> { return this.http.get<TelemetriaTemperatura[]>(`${this.base}/telemetrias-temperatura`); }
  getCuarentenasAbiertas(): Observable<Cuarentena[]> {
    return this.http.get<Cuarentena[]>(`${this.base}/cuarentenas`, { params: new HttpParams().set('estado', 'ABIERTA') });
  }
  getEventos(despachoId: number): Observable<EventoCustodia[]> {
    return this.http.get<EventoCustodia[]>(`${this.base}/despachos-logisticos/${despachoId}/eventos`);
  }
  consultarQR(codigoQr: string): Observable<ConsultaQR> {
    return this.http.get<ConsultaQR>(`${this.base}/public/consulta-qr/${encodeURIComponent(codigoQr)}`);
  }
}

export { mensajeApi } from './http/api-error';

