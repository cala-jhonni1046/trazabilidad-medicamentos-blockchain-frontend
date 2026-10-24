import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { mensajeApi } from '../../core/http/api-error';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { ReportesApiService } from './reportes-api.service';
import { LoteLite, ReporteCiudadanoDto, UnidadTrazableLite } from './reportes.models';

export interface ReporteDetalleDialogData {
  reporte: ReporteCiudadanoDto;
}

/**
 * Detalle del reporte con la unidad y su lote. El motivo es texto libre de un
 * tercero: se renderiza siempre como texto plano (interpolación), nunca [innerHTML].
 */
@Component({
  selector: 'app-reporte-detalle-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FechaArPipe,
    StatusBadgeComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <h2 mat-dialog-title>Reporte #{{ data.reporte.id }}</h2>

    <mat-dialog-content>
      <dl class="detalle-grid">
        <dt>Estado</dt>
        <dd><app-status-badge [estado]="data.reporte.estado"></app-status-badge></dd>

        <dt>Fecha del reporte</dt>
        <dd>{{ data.reporte.fechaHoraReporte | fechaAr }}</dd>

        <dt>Inspector asignado</dt>
        <dd>{{ data.reporte.inspectorNombre || '—' }}</dd>
      </dl>

      <h3>Motivo</h3>
      <!-- Texto libre de un tercero: siempre interpolado, nunca HTML -->
      <p class="motivo-texto">{{ data.reporte.motivoReporte }}</p>

      <h3>Unidad reportada</h3>
      <app-loading-overlay [loading]="cargandoUnidad()" message="Buscando unidad…"></app-loading-overlay>

      @if (!cargandoUnidad()) {
        @if (errorUnidad()) {
          <p class="sin-unidad">{{ errorUnidad() }}</p>
        } @else if (unidad()) {
          <dl class="detalle-grid">
            <dt>Código QR</dt>
            <dd>{{ unidad()!.codigoUnicoQR }}</dd>
            <dt>Estado de la unidad</dt>
            <dd><app-status-badge [estado]="unidad()!.estado"></app-status-badge></dd>
            @if (lote()) {
              <dt>Lote</dt>
              <dd>
                {{ lote()!.codigoLote }}
                <app-status-badge [estado]="lote()!.estado"></app-status-badge>
              </dd>
              @if (lote()!.medicamentoNombre) {
                <dt>Medicamento</dt>
                <dd>{{ lote()!.medicamentoNombre }}</dd>
              }
            }
          </dl>
        } @else {
          <p class="sin-unidad">Este reporte no está asociado a ninguna unidad trazable.</p>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="dialogRef.close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .detalle-grid {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 16px;
        margin: 0 0 16px;
        font-size: 0.9rem;
      }
      dt {
        color: #64748b;
        font-weight: 500;
      }
      dd {
        margin: 0;
        color: #0f172a;
      }
      h3 {
        font-size: 0.9rem;
        color: #0f172a;
        margin: 16px 0 6px;
      }
      .motivo-texto {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        margin: 0;
        color: #334155;
        font-size: 0.9rem;
      }
      .sin-unidad {
        color: #94a3b8;
        font-size: 0.88rem;
        font-style: italic;
      }
    `,
  ],
})
export class ReporteDetalleDialogComponent {
  private readonly api = inject(ReportesApiService);
  readonly dialogRef = inject(MatDialogRef<ReporteDetalleDialogComponent>);

  readonly cargandoUnidad = signal(false);
  readonly unidad = signal<UnidadTrazableLite | null>(null);
  readonly lote = signal<LoteLite | null>(null);
  readonly errorUnidad = signal<string | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReporteDetalleDialogData) {
    this.cargarUnidad();
  }

  private cargarUnidad(): void {
    const r = this.data.reporte;
    const obsUnidad = r.unidadTrazableId
      ? this.api.obtenerUnidadPorId(r.unidadTrazableId)
      : r.codigoUnicoQR
        ? this.api.obtenerUnidadPorQr(r.codigoUnicoQR)
        : null;

    if (!obsUnidad) return; // Reporte sin unidad asociada: no hay nada que buscar.

    this.cargandoUnidad.set(true);
    obsUnidad
      .pipe(
        catchError((err: unknown) => {
          this.errorUnidad.set(mensajeApi(err));
          return of(null);
        }),
        finalize(() => this.cargandoUnidad.set(false)),
      )
      .subscribe((unidad) => {
        if (!unidad) return;
        this.unidad.set(unidad);
        this.api
          .obtenerLote(unidad.loteId)
          .pipe(catchError(() => of(null)))
          .subscribe((lote) => this.lote.set(lote));
      });
  }
}
