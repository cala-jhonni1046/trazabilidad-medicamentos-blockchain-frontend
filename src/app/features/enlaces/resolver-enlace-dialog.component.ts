import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { formatearCuit } from '../../shared/utils/cuit';
import { EnlaceDto } from './enlaces.models';

export type AccionEnlace = 'aprobar' | 'rechazar';

export interface ResolverEnlaceDialogData {
  enlace: EnlaceDto;
  accion: AccionEnlace;
}

export interface ResolverEnlaceDialogResult {
  numeroDisposicionANMAT: string;
  documentoCertificadoUrl: string;
}

/** Confirmación para aprobar o rechazar un enlace, con resumen y campos opcionales. */
@Component({
  selector: 'app-resolver-enlace-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ aprobar ? 'Aprobar solicitud' : 'Rechazar solicitud' }}</h2>
    <mat-dialog-content>
      <dl class="resumen">
        <div>
          <dt>Laboratorio</dt>
          <dd>{{ data.enlace.laboratorioNombre }} · {{ formatearCuit(data.enlace.laboratorioCuit) }}</dd>
        </div>
        <div>
          <dt>Distribuidor</dt>
          <dd>{{ data.enlace.distribuidorNombre }} · {{ formatearCuit(data.enlace.distribuidorCuit) }}</dd>
        </div>
        <div>
          <dt>Farmacia</dt>
          <dd>{{ data.enlace.farmaciaNombre }} · {{ formatearCuit(data.enlace.farmaciaCuit) }}</dd>
        </div>
      </dl>

      @if (!aprobar) {
        <p class="nota" role="note">
          <mat-icon>info</mat-icon>
          El contrato actual no registra quién rechaza ni cuándo.
        </p>
      }

      <form [formGroup]="form" class="campos" novalidate>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Número de disposición ANMAT (opcional)</mat-label>
          <input matInput formControlName="numeroDisposicionANMAT" maxlength="80" autocomplete="off" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>URL del certificado (opcional)</mat-label>
          <input matInput type="url" formControlName="documentoCertificadoUrl" maxlength="500" autocomplete="off" />
          @if (form.controls.documentoCertificadoUrl.hasError('pattern')) {
            <mat-error>Ingresá una URL que empiece con http:// o https://.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button
        mat-flat-button
        type="button"
        [color]="aprobar ? 'primary' : 'warn'"
        [disabled]="form.invalid"
        (click)="confirmar()"
      >
        {{ aprobar ? 'Aprobar' : 'Rechazar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .resumen {
        display: grid;
        gap: 8px;
        margin: 0 0 12px;
      }
      dt {
        font-size: 0.8rem;
        color: #64748b;
      }
      dd {
        margin: 0;
        font-weight: 500;
      }
      .nota {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: #92400e;
      }
      .campos {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 8px;
        min-width: min(420px, 80vw);
      }
    `,
  ],
})
export class ResolverEnlaceDialogComponent {
  readonly data = inject<ResolverEnlaceDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject<MatDialogRef<ResolverEnlaceDialogComponent, ResolverEnlaceDialogResult>>(
    MatDialogRef,
  );
  readonly formatearCuit = formatearCuit;

  readonly aprobar = this.data.accion === 'aprobar';

  readonly form = new FormGroup({
    numeroDisposicionANMAT: new FormControl(this.data.enlace.numeroDisposicionANMAT ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    documentoCertificadoUrl: new FormControl(this.data.enlace.documentoCertificadoUrl ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(500), Validators.pattern(/^\s*https?:\/\/\S+\s*$/i)],
    }),
  });

  cancelar(): void {
    this.ref.close();
  }

  confirmar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({
      numeroDisposicionANMAT: v.numeroDisposicionANMAT.trim(),
      documentoCertificadoUrl: v.documentoCertificadoUrl.trim(),
    });
  }
}
