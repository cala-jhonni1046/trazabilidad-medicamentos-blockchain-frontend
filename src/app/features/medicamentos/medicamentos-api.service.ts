import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MedicamentoDto, MedicamentoRequest } from './medicamentos.models';

@Injectable({ providedIn: 'root' })
export class MedicamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/medicamentos';

  listar(): Observable<MedicamentoDto[]> {
    return this.http.get<MedicamentoDto[]>(this.base);
  }

  obtenerPorId(id: number): Observable<MedicamentoDto> {
    return this.http.get<MedicamentoDto>(`${this.base}/${id}`);
  }

  crear(body: MedicamentoRequest): Observable<MedicamentoDto> {
    return this.http.post<MedicamentoDto>(this.base, body);
  }

  actualizar(id: number, body: MedicamentoRequest): Observable<MedicamentoDto> {
    return this.http.put<MedicamentoDto>(`${this.base}/${id}`, body);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
