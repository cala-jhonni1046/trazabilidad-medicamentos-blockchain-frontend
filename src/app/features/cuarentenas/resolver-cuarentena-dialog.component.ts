import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CuarentenaResolucionRequest } from './cuarentenas.models';
import { SessionService } from '../../core/session/session.service';

export interface ResolverCuarentenaDialogData {
  cuarentenaId: number;
  codigoCuarentena: string;
  codigoLote?: string | null;
  accion: 'LIBERAR' | 'MANTENER';
}

@Component({
  selector: 'app-resolver-cuarentena-dialog',
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
    <h2 mat-dialog-title class="dialog-title" [ngClass]="{ 'text-danger': data.accion === 'MANTENER', 'text-success': data.accion === 'LIBERAR' }">
      <mat-icon>{{ data.accion === 'LIBERAR' ? 'lock_open' : 'block' }}</mat-icon>
      <span>{{ data.accion === 'LIBERAR' ? 'Liberar lote de cuarentena' : 'Mantener cuarentena (Confirmar desvío)' }}</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="info-cuarentena-box">
        <div><strong>Cuarentena:</strong> {{ data.codigoCuarentena }}</div>
        <div><strong>Lote:</strong> {{ data.codigoLote || 'Lote asociado' }}</div>
      </div>

      <form [formGroup]="form" class="resolucion-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Resolución final del inspector</mat-label>
          <textarea
            matInput
            formControlName="resolucionFinal"
            rows="3"
            [placeholder]="data.accion === 'LIBERAR' ? 'Fundamento técnico para dar conformidad y liberar el lote' : 'Dictamen de riesgo técnico, confirmando el bloqueo del lote'"
            required
          ></textarea>
          <mat-error *ngIf="form.get('resolucionFinal')?.hasError('required')">La resolución final es obligatoria</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones regulatorias adicionales</mat-label>
          <textarea matInput formControlName="observaciones" rows="2" placeholder="Número de acta, expediente o disposición"></textarea>
        </mat-form-field>

        <div class="inspector-badge" *ngIf="session.inspector() as insp">
          <mat-icon>verified_user</mat-icon>
          <span>Inspector interviniente: <strong>{{ insp.nombreCompleto }}</strong></span>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button
        mat-flat-button
        [color]="data.accion === 'LIBERAR' ? 'primary' : 'warn'"
        (click)="confirmar()"
        [disabled]="form.invalid"
      >
        <mat-icon>{{ data.accion === 'LIBERAR' ? 'check' : 'warning' }}</mat-icon>
        {{ data.accion === 'LIBERAR' ? 'Confirmar liberación' : 'Confirmar mantenimiento' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      .text-danger {
        color: #991b1b;
      }
      .text-success {
        color: #065f46;
      }
      .dialog-content {
        padding-top: 12px;
      }
      .info-cuarentena-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px 14px;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .resolucion-form {
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
export class ResolverCuarentenaDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly session = inject(SessionService);

  form!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ResolverCuarentenaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResolverCuarentenaDialogData,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      resolucionFinal: ['', [Validators.required, Validators.maxLength(500)]],
      observaciones: ['', [Validators.maxLength(500)]],
    });
  }

  confirmar(): void {
    if (this.form.invalid) return;

    const val = this.form.value;
    const request: CuarentenaResolucionRequest = {
      estado: this.data.accion === 'LIBERAR' ? 'LIBERADA' : 'MANTENIDA',
      resolucionFinal: String(val.resolucionFinal).trim(),
      observaciones: val.observaciones ? String(val.observaciones).trim() : null,
      inspectorResponsableId: this.session.inspector()?.id || null,
      fechaFin: new Date().toISOString(),
    };

    this.dialogRef.close(request);
  }
}
