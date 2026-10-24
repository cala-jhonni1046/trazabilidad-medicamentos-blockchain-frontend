import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrganizacionDto, OrganizacionRequest } from './organizaciones.models';

@Injectable({ providedIn: 'root' })
export class OrganizacionesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/organizaciones';

  listar(): Observable<OrganizacionDto[]> {
    return this.http.get<OrganizacionDto[]>(this.base);
  }

  /** El backend normaliza el CUIT (acepta XX-XXXXXXXX-X o 11 dígitos). Responde 404 si no existe. */
  obtenerPorCuit(cuit: string): Observable<OrganizacionDto> {
    return this.http.get<OrganizacionDto>(`${this.base}/cuit/${encodeURIComponent(cuit)}`);
  }

  crear(body: OrganizacionRequest): Observable<OrganizacionDto> {
    return this.http.post<OrganizacionDto>(this.base, body);
  }

  actualizar(id: number, body: OrganizacionRequest): Observable<OrganizacionDto> {
    return this.http.put<OrganizacionDto>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
