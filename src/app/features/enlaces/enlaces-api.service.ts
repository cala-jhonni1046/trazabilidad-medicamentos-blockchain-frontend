import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EnlaceDto,
  EnlaceRequest,
  EnlaceResolucionRequest,
  EstadoEnlace,
  OrganizacionLite,
} from './enlaces.models';

@Injectable({ providedIn: 'root' })
export class EnlacesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/enlaces-cuit';

  /** El backend normaliza el CUIT. Responde 404 si no existe. */
  buscarOrganizacionPorCuit(cuit: string): Observable<OrganizacionLite> {
    return this.http.get<OrganizacionLite>(`/api/organizaciones/cuit/${encodeURIComponent(cuit)}`);
  }

  crear(body: EnlaceRequest): Observable<EnlaceDto> {
    return this.http.post<EnlaceDto>(this.base, body);
  }

  obtener(id: number): Observable<EnlaceDto> {
    return this.http.get<EnlaceDto>(`${this.base}/${id}`);
  }

  aprobar(id: number, body: EnlaceResolucionRequest): Observable<EnlaceDto> {
    return this.http.post<EnlaceDto>(`${this.base}/${id}/aprobar`, body);
  }

  rechazar(id: number, body: EnlaceResolucionRequest): Observable<EnlaceDto> {
    return this.http.post<EnlaceDto>(`${this.base}/${id}/rechazar`, body);
  }

  /**
   * Los filtros laboratorioId y estado son opcionales. Un backend sin el filtro por laboratorio
   * lo ignora y devuelve todo, por eso quien llama vuelve a filtrar en el cliente.
   */
  listar(filtros: { estado?: EstadoEnlace; laboratorioId?: number } = {}): Observable<EnlaceDto[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.laboratorioId !== undefined) {
      params = params.set('laboratorioId', String(filtros.laboratorioId));
    }
    return this.http.get<EnlaceDto[]>(this.base, { params });
  }
}
