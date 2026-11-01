import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    return this.http.get<UsuarioApi[]>(`${this.base}/usuarios`).pipe(
      catchError(() =>
        this.http.get<UsuarioApi[]>('http://localhost:8080/api/usuarios').pipe(
          catchError(() => this.http.get<UsuarioApi[]>('http://localhost:80/api/usuarios')),
        ),
      ),
    );
  }

  getOrganizaciones(): Observable<OrganizacionApi[]> {
    return this.http.get<OrganizacionApi[]>(`${this.base}/organizaciones`).pipe(
      catchError(() =>
        this.http.get<OrganizacionApi[]>('http://localhost:8080/api/organizaciones').pipe(
          catchError(() =>
            this.http.get<OrganizacionApi[]>('http://localhost:80/api/organizaciones'),
          ),
        ),
      ),
    );
  }

  getInspectorPorUsuario(usuarioId: number): Observable<InspectorApi> {
    return this.http.get<InspectorApi>(`${this.base}/inspectores/usuario/${usuarioId}`).pipe(
      catchError(() =>
        this.http
          .get<InspectorApi>(`http://localhost:8080/api/inspectores/usuario/${usuarioId}`)
          .pipe(
            catchError(() =>
              this.http.get<InspectorApi>(
                `http://localhost:80/api/inspectores/usuario/${usuarioId}`,
              ),
            ),
          ),
      ),
    );
  }
}
