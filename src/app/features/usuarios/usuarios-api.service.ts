import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioDto, UsuarioRequest } from './usuarios.models';

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/usuarios';

  listar(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(this.base);
  }

  crear(body: UsuarioRequest): Observable<UsuarioDto> {
    return this.http.post<UsuarioDto>(this.base, body);
  }

  actualizar(id: number, body: UsuarioRequest): Observable<UsuarioDto> {
    return this.http.put<UsuarioDto>(`${this.base}/${id}`, body);
  }

  /** Restablece la contraseña. El backend exige el rol, así que se reenvían email, rol y organización. */
  cambiarPassword(u: UsuarioDto, password: string): Observable<UsuarioDto> {
    const body: UsuarioRequest = { email: u.email, rol: u.rol, password };
    if (u.organizacionId != null) body.organizacionId = u.organizacionId;
    return this.http.put<UsuarioDto>(`${this.base}/${u.id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  activar(id: number): Observable<UsuarioDto> {
    return this.http.patch<UsuarioDto>(`${this.base}/${id}/activar`, {});
  }

  desactivar(id: number): Observable<UsuarioDto> {
    return this.http.patch<UsuarioDto>(`${this.base}/${id}/desactivar`, {});
  }
}
