import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RolUsuario } from '../../core/session/session.service';

export interface UsuarioApi {
  id: number;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion?: string;
}

export interface OrganizacionApi {
  id: number;
  cuit: string;
  nombre: string;
  tipo: 'LABORATORIO' | 'DISTRIBUIDOR' | 'FARMACIA';
}

export interface InspectorApi {
  id: number;
  usuarioId: number;
  nombreCompleto: string;
  dni?: string;
  legajoOficial?: string;
  emailInstitucional?: string;
  fechaHoraAlta?: string;
  jefeAutorizador?: string;
  estado: 'HABILITADO' | 'SUSPENDIDO';
}

@Injectable({ providedIn: 'root' })
export class LoginApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getUsuarios(): Observable<UsuarioApi[]> {
    return this.http.get<UsuarioApi[]>(`${this.base}/usuarios`);
  }

  getOrganizaciones(): Observable<OrganizacionApi[]> {
    return this.http.get<OrganizacionApi[]>(`${this.base}/organizaciones`);
  }

  getInspectorPorUsuario(usuarioId: number): Observable<InspectorApi> {
    return this.http.get<InspectorApi>(`${this.base}/inspectores/usuario/${usuarioId}`);
  }
}
