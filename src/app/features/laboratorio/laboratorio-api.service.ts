import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnlaceDto } from '../enlaces/enlaces.models';
import { Lote, UnidadResumen } from '../lotes/lotes.models';
import { CuarentenaAbierta, DespachoLaboratorio } from './laboratorio.models';

@Injectable({ providedIn: 'root' })
export class LaboratorioApiService {
  private readonly http = inject(HttpClient);

  getLotes(laboratorioId?: number): Observable<Lote[]> {
    let params = new HttpParams();
    if (laboratorioId != null) {
      params = params.set('laboratorioId', String(laboratorioId));
    }
    return this.http.get<Lote[]>('/api/lotes', { params });
  }

  getDespachos(laboratorioId?: number): Observable<DespachoLaboratorio[]> {
    let params = new HttpParams();
    if (laboratorioId != null) {
      params = params.set('laboratorioId', String(laboratorioId));
    }
    return this.http.get<DespachoLaboratorio[]>('/api/despachos-logisticos', { params });
  }

  getEnlaces(laboratorioId?: number): Observable<EnlaceDto[]> {
    let params = new HttpParams();
    if (laboratorioId != null) {
      params = params.set('laboratorioId', String(laboratorioId));
    }
    return this.http.get<EnlaceDto[]>('/api/enlaces-cuit', { params });
  }

  getCuarentenasAbiertas(): Observable<CuarentenaAbierta[]> {
    const params = new HttpParams().set('estado', 'ABIERTA');
    return this.http.get<CuarentenaAbierta[]>('/api/cuarentenas', { params });
  }

  getUnidadesPorLote(loteId: number): Observable<UnidadResumen[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<UnidadResumen[]>('/api/unidades-trazables', { params });
  }
}
