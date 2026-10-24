import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { mensajeApi } from '../../core/http/api-error';
import { PortalApiService } from './portal-api.service';
import { ConsultaPublicaQR } from './portal.models';
import { ReporteFormDialogComponent } from './reporte-form-dialog.component';

type ResultadoResumen = 'APTA' | 'CON_ADVERTENCIAS' | 'EN_CUARENTENA' | 'DISPENSADA' | 'BLOQUEADA';

const RESUMEN_CONFIG: Record<ResultadoResumen, { label: string; icono: string; clase: string }> = {
  APTA: { label: 'Sin advertencias registradas', icono: 'check_circle', clase: 'resumen-ok' },
  CON_ADVERTENCIAS: { label: 'Con advertencias', icono: 'warning', clase: 'resumen-advertencia' },
  EN_CUARENTENA: { label: 'Lote en cuarentena', icono: 'report', clase: 'resumen-critico' },
  DISPENSADA: { label: 'Ya dispensada', icono: 'inventory', clase: 'resumen-neutro' },
  BLOQUEADA: { label: 'Unidad bloqueada', icono: 'block', clase: 'resumen-critico' },
};

/**
 * Portal público (F30): consulta de QR sin sesión y reporte ciudadano.
 * Es el ROLE_HOME de PACIENTE, pero no requiere sesión (ruta pública).
 * Migra la consulta pública de pages/trazabilidad (sin importarla).
 */
@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FechaArPipe,
    LoadingOverlayComponent,
  ],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.scss',
})
export class PortalComponent {
  private readonly api = inject(PortalApiService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly resumenConfig = RESUMEN_CONFIG;

  codigoQr = '';
  consultando = false;
  errorConsulta = '';
  resultado = signal<ConsultaPublicaQR | null>(null);
  /** Se guarda aparte: si la última consulta fue 404, no se precarga ese QR en el reporte. */
  private ultimaConsultaOk = false;
  /** Confirmación visible tras un reporte recién enviado desde esta pantalla. */
  reporteConfirmadoId = signal<number | null>(null);

  consultar(): void {
    if (this.consultando) return;
    const codigo = this.codigoQr.trim();
    this.errorConsulta = '';
    this.resultado.set(null);
    this.reporteConfirmadoId.set(null);
    this.ultimaConsultaOk = false;
    if (!codigo) {
      this.errorConsulta = 'Ingresá un código QR.';
      return;
    }
    this.consultando = true;
    this.api
      .consultarQr(codigo)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.consultando = false)),
      )
      .subscribe({
        next: (r) => {
          this.resultado.set(r);
          this.ultimaConsultaOk = true;
        },
        error: (err: unknown) => {
          // No se revelan detalles internos: 404 → mensaje fijo.
          this.errorConsulta = this.esNoEncontrado(err)
            ? 'Código no encontrado.'
            : mensajeApi(err);
        },
      });
  }

  resumenDe(r: ConsultaPublicaQR): { label: string; icono: string; clase: string } {
    if (r.cuarentena?.enCuarentena) return this.resumenConfig.EN_CUARENTENA;
    if (r.estadoUnidad === 'BLOQUEADA') return this.resumenConfig.BLOQUEADA;
    if (r.estadoUnidad === 'DISPENSADA') return this.resumenConfig.DISPENSADA;
    if (r.advertencias.length > 0) return this.resumenConfig.CON_ADVERTENCIAS;
    return this.resumenConfig.APTA;
  }

  truncarHash(hash: string | null): string {
    if (!hash) return '—';
    return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
  }

  copiarHash(hash: string | null): void {
    if (!hash || typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(hash);
  }

  abrirReporte(): void {
    const codigoPrecargado = this.ultimaConsultaOk ? this.resultado()?.codigoConsultado ?? null : null;
    const ref = this.dialog.open(ReporteFormDialogComponent, {
      data: { codigoQr: codigoPrecargado },
      width: '480px',
      maxWidth: '92vw',
    });
    ref.afterClosed().subscribe((creado) => {
      if (creado && typeof creado === 'object' && 'id' in creado) {
        this.reporteConfirmadoId.set((creado as { id: number }).id);
      }
    });
  }

  private esNoEncontrado(err: unknown): boolean {
    return !!err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404;
  }
}
