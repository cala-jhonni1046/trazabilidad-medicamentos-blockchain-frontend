import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CuarentenaRequest } from './cuarentenas.models';
import { SessionService } from '../../core/session/session.service';

export interface AbrirCuarentenaDialogData {
  loteId: number;
  codigoLote: string;
  medicamentoNombre?: string;
  alertaExcursion?: boolean;
}

@Component({
  selector: 'app-abrir-cuarentena-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="icon-danger">warning</mat-icon>
      <span>Abrir cuarentena oficial (ANMAT)</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="info-lote-box">
        <strong>Lote:</strong> {{ data.codigoLote }} — {{ data.medicamentoNombre || 'Medicamento' }}
        <div *ngIf="data.alertaExcursion" class="excursion-alert">
          <mat-icon>thermostat</mat-icon>
          <span>Excursión térmica registrada en telemetría. Apertura recomendada.</span>
        </div>
      </div>

      <form [formGroup]="form" class="cuarentena-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código de cuarentena</mat-label>
          <input matInput formControlName="codigoCuarentena" required />
          <mat-error *ngIf="form.get('codigoCuarentena')?.hasError('required')">El código es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de la medida preventiva</mat-label>
          <textarea
            matInput
            formControlName="motivo"
            rows="3"
            placeholder="Describa el motivo técnico, excursion térmica o reporte de desvío"
            required
          ></textarea>
          <mat-error *ngIf="form.get('motivo')?.hasError('required')">El motivo es obligatorio</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones de auditoría (opcional)</mat-label>
          <textarea matInput formControlName="observaciones" rows="2" placeholder="Notas internas o referencia de expediente"></textarea>
        </mat-form-field>

        <div class="inspector-badge" *ngIf="session.inspector() as insp">
          <mat-icon>verified_user</mat-icon>
          <span>Inspector interviniente: <strong>{{ insp.nombreCompleto }}</strong> (Legajo: {{ insp.legajoOficial || insp.id }})</span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="confirmar()" [disabled]="form.invalid">
        <mat-icon>lock</mat-icon>
        Poner en cuarentena
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #991b1b;
        margin: 0;
      }
      .icon-danger {
        color: #dc2626;
      }
      .dialog-content {
        padding-top: 12px;
      }
      .info-lote-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px 14px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 0.92rem;
      }
      .excursion-alert {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        color: #b91c1c;
        font-weight: 600;
        font-size: 0.85rem;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .cuarentena-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .full-width {
        width: 100%;
      }
      .inspector-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        color: #166534;
        font-size: 0.85rem;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
      .dialog-actions {
        padding: 16px 24px;
      }
    `,
  ],
})
export class AbrirCuarentenaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly session = inject(SessionService);

  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AbrirCuarentenaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AbrirCuarentenaDialogData,
  ) {}

  ngOnInit(): void {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    const num = Math.floor(100 + Math.random() * 900);
    const codigoSugerido = `CUA-${yyyy}${mm}${dd}-${num}`;

    const motivoDefault = this.data.alertaExcursion
      ? 'Apertura preventiva por alerta de excursión térmica en tránsito.'
      : '';

    this.form = this.fb.group({
      codigoCuarentena: [codigoSugerido, [Validators.required, Validators.maxLength(50)]],
      motivo: [motivoDefault, [Validators.required, Validators.maxLength(500)]],
      observaciones: ['', [Validators.maxLength(500)]],
    });
  }

  confirmar(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    const request: CuarentenaRequest = {
      codigoCuarentena: String(val.codigoCuarentena).trim(),
      loteId: this.data.loteId,
      motivo: String(val.motivo).trim(),
      inspectorResponsableId: this.session.inspector()?.id || null,
      observaciones: val.observaciones ? String(val.observaciones).trim() : null,
    };

    this.dialogRef.close(request);
  }
}
