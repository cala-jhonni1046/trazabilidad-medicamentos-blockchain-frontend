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
