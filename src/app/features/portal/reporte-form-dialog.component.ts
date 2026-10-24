import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { extraerFieldErrors, mensajeApi } from '../../core/http/api-error';
import { PortalApiService } from './portal-api.service';
import { ReporteCiudadanoCreado } from './portal.models';

export interface ReporteFormDialogData {
  /** QR precargado desde la consulta; puede ser null si se reporta sin haber consultado. */
  codigoQr: string | null;
}

const MOTIVO_MAX = 1000;
const MOTIVO_MIN = 10;

/**
 * Formulario de denuncia ciudadana (F30). Es una denuncia: no pide ni guarda
 * datos personales del paciente. El motivo es el único campo obligatorio.
 */
@Component({
  selector: 'app-reporte-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="titulo-icono">report_problem</mat-icon>
      Reportar una irregularidad
    </h2>

    <mat-dialog-content>
      @if (enviado(); as rta) {
        <div class="confirmacion" role="status">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Reporte enviado.</strong>
            <p>Número de reporte: <strong>#{{ rta.id }}</strong>. Quedó registrado como PENDIENTE.</p>
          </div>
        </div>
      } @else {
        <p class="aviso-privacidad" role="note">
          <mat-icon class="aviso-icono">lock</mat-icon>
          No ingreses datos personales: ni DNI, ni nombre, ni email. El reporte es anónimo.
        </p>

        @if (data.codigoQr) {
          <p class="qr-precargado">
            <mat-icon>qr_code_2</mat-icon>
            QR: <strong>{{ data.codigoQr }}</strong>
          </p>
        }

        <form [formGroup]="form" (ngSubmit)="enviar()">
          <mat-form-field appearance="outline" class="campo-motivo">
            <mat-label>¿Qué problema encontraste?</mat-label>
            <textarea
              matInput
              formControlName="motivoReporte"
              rows="4"
              [maxlength]="motivoMax"
              placeholder="Ej.: el envase estaba dañado y el sello de seguridad roto."
            ></textarea>
            <mat-hint align="end">{{ form.value.motivoReporte?.length || 0 }}/{{ motivoMax }}</mat-hint>
            @if (form.controls.motivoReporte.hasError('required') && form.controls.motivoReporte.touched) {
              <mat-error>El motivo es obligatorio.</mat-error>
            }
            @if (form.controls.motivoReporte.hasError('minlength')) {
              <mat-error>Contanos un poco más (mínimo {{ motivoMin }} caracteres).</mat-error>
            }
            @if (form.controls.motivoReporte.hasError('maxlength')) {
              <mat-error>Como máximo {{ motivoMax }} caracteres.</mat-error>
            }
            @if (errorCampoBackend()) {
              <mat-error>{{ errorCampoBackend() }}</mat-error>
            }
          </mat-form-field>

          @if (errorGeneral()) {
            <p class="error-general" role="alert">{{ errorGeneral() }}</p>
          }
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (enviado()) {
        <button mat-flat-button color="primary" (click)="cerrar()">Cerrar</button>
      } @else {
        <button mat-button type="button" (click)="cerrar()" [disabled]="enviando()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="enviar()"
          [disabled]="form.invalid || enviando()"
        >
          @if (enviando()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>send</mat-icon>
          }
          Enviar reporte
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      .titulo-icono {
        vertical-align: middle;
        margin-right: 8px;
        color: #d97706;
      }
      .aviso-privacidad {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        background: #fef3c7;
        color: #92400e;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.85rem;
        margin: 0 0 16px 0;
      }
      .aviso-icono {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      .qr-precargado {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        color: #334155;
        margin-bottom: 12px;
      }
      .campo-motivo {
        width: 100%;
      }
      .error-general {
        color: #b91c1c;
        font-size: 0.85rem;
      }
      .confirmacion {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 8px;
        padding: 14px 16px;
      }
      .confirmacion mat-icon {
        color: #059669;
      }
      .confirmacion p {
        margin: 4px 0 0;
      }
    `,
  ],
})
export class ReporteFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortalApiService);
  private readonly dialogRef = inject(MatDialogRef<ReporteFormDialogComponent>);

  readonly motivoMax = MOTIVO_MAX;
  readonly motivoMin = MOTIVO_MIN;

  readonly enviando = signal(false);
  readonly enviado = signal<ReporteCiudadanoCreado | null>(null);
  readonly errorGeneral = signal<string | null>(null);
  readonly errorCampoBackend = signal<string | null>(null);

  readonly form = this.fb.group({
    motivoReporte: this.fb.control('', [
      Validators.required,
      Validators.minLength(MOTIVO_MIN),
      Validators.maxLength(MOTIVO_MAX),
    ]),
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReporteFormDialogData) {}

  enviar(): void {
    if (this.form.invalid || this.enviando()) return;
    this.enviando.set(true);
    this.errorGeneral.set(null);
    this.errorCampoBackend.set(null);

    const body = {
      motivoReporte: this.form.value.motivoReporte!.trim(),
      ...(this.data.codigoQr ? { codigoUnicoQR: this.data.codigoQr } : {}),
    };

    this.api.crearReporte(body).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.enviado.set(respuesta);
      },
      error: (err: unknown) => {
        this.enviando.set(false);
        const campos = extraerFieldErrors(err);
        this.errorCampoBackend.set(campos['motivoReporte'] ?? null);
        this.errorGeneral.set(mensajeApi(err));
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(this.enviado());
  }
}
