import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConsultaPublicaQR, ReporteCiudadanoCreado, ReporteCiudadanoCreateRequest } from './portal.models';

/**
 * Servicio propio de F30 (portal público). Solo usa los dos endpoints públicos
 * declarados en el issue: no requiere sesión ni envía datos personales.
 */
@Injectable({ providedIn: 'root' })
export class PortalApiService {
  private readonly http = inject(HttpClient);

  /** GET /api/public/consulta-qr/{codigoQr}. 404 si el QR no existe. */
  consultarQr(codigoQr: string): Observable<ConsultaPublicaQR> {
    return this.http.get<ConsultaPublicaQR>(`/api/public/consulta-qr/${encodeURIComponent(codigoQr)}`);
  }

  /** POST /api/reportes-ciudadanos. El reporte nace siempre PENDIENTE. */
  crearReporte(body: ReporteCiudadanoCreateRequest): Observable<ReporteCiudadanoCreado> {
    return this.http.post<ReporteCiudadanoCreado>('/api/reportes-ciudadanos', body);
  }
}
