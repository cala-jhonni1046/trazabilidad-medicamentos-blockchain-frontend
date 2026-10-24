import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InspectorDto, InspectorRequest } from './inspectores.models';

/** Usuario tal como lo devuelve GET /api/usuarios (solo los campos que usa esta feature). */
export interface UsuarioLite {
  id: number;
  email: string;
  rol: string;
  activo: boolean;
}

export interface UsuarioNuevoRequest {
  email: string;
  rol: 'ANMAT';
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class InspectoresApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/inspectores';

  listar(): Observable<InspectorDto[]> {
    return this.http.get<InspectorDto[]>(this.base);
  }

  /**
   * Pide el filtro ?dni= (backend de cierre). Si el backend todavía no lo implementa,
   * ignora el parámetro y devuelve todo el listado: por eso el cliente vuelve a filtrar.
   */
  buscarPorDni(dni: string): Observable<InspectorDto[]> {
    return this.http.get<InspectorDto[]>(this.base, { params: new HttpParams().set('dni', dni) });
  }

  crear(body: InspectorRequest): Observable<InspectorDto> {
    return this.http.post<InspectorDto>(this.base, body);
  }

  actualizar(id: number, body: InspectorRequest): Observable<InspectorDto> {
    return this.http.put<InspectorDto>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listarUsuarios(): Observable<UsuarioLite[]> {
    return this.http.get<UsuarioLite[]>('/api/usuarios');
  }

  crearUsuario(body: UsuarioNuevoRequest): Observable<UsuarioLite> {
    return this.http.post<UsuarioLite>('/api/usuarios', body);
  }

  /** Cadenas activas = enlaces CUIT en estado ACTIVO. */
  listarEnlacesActivos(): Observable<unknown[]> {
    return this.http.get<unknown[]>('/api/enlaces-cuit', {
      params: new HttpParams().set('estado', 'ACTIVO'),
    });
  }

  listarOrganizaciones(): Observable<unknown[]> {
    return this.http.get<unknown[]>('/api/organizaciones');
  }
}
