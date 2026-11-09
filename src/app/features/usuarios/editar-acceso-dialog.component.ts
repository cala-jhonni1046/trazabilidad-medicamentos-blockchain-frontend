import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { mensajeApi } from '../../core/http/api-error';
import { UsuariosApiService } from './usuarios-api.service';
import { PASSWORD_MIN, UsuarioDto } from './usuarios.models';

/** Diálogo "Editar acceso": permite a SUPERADMIN fijar una contraseña nueva para un usuario. */
@Component({
  selector: 'app-editar-acceso-dialog',
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
    <h2 mat-dialog-title>Editar acceso</h2>
    <mat-dialog-content>
      <p class="usuario">{{ data.email }}</p>
      <mat-form-field appearance="outline" class="campo">
        <mat-label>Nueva contraseña</mat-label>
        <input
          matInput
          [type]="verPassword() ? 'text' : 'password'"
          [formControl]="password"
          autocomplete="new-password"
        />
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="verPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          (click)="verPassword.set(!verPassword())"
        >
          <mat-icon>{{ verPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (password.hasError('required')) {
          <mat-error>La contraseña es obligatoria.</mat-error>
        } @else if (password.hasError('minlength')) {
          <mat-error>Debe tener al menos {{ min }} caracteres.</mat-error>
        } @else if (password.hasError('servidor')) {
          <mat-error>{{ password.getError('servidor') }}</mat-error>
        }
      </mat-form-field>
      <p class="ayuda">La persona deberá usar esta contraseña en su próximo ingreso.</p>
      @if (error(); as msg) {
        <p class="error" role="alert">{{ msg }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" [disabled]="enviando()" (click)="guardar()">
        {{ enviando() ? 'Guardando…' : 'Guardar contraseña' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .usuario {
        margin: 0 0 12px;
        font-weight: 600;
      }
      .campo {
        width: 100%;
        min-width: 300px;
      }
      .ayuda {
        margin: 4px 0 0;
        font-size: 0.85rem;
        opacity: 0.75;
      }
      .error {
        margin: 8px 0 0;
        color: #b91c1c;
      }
    `,
  ],
})
export class EditarAccesoDialogComponent {
  protected readonly data = inject<UsuarioDto>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EditarAccesoDialogComponent, boolean>);
  private readonly api = inject(UsuariosApiService);

  protected readonly min = PASSWORD_MIN;
  readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(PASSWORD_MIN)],
  });
  readonly verPassword = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  guardar(): void {
    if (this.password.invalid || this.enviando()) {
      this.password.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.api.cambiarPassword(this.data, this.password.value).subscribe({
      next: () => {
        this.enviando.set(false);
        this.ref.close(true);
      },
      error: (err: unknown) => {
        this.enviando.set(false);
        if (err instanceof HttpErrorResponse && err.status === 400) {
          this.password.setErrors({ servidor: mensajeApi(err) });
          this.password.markAsTouched();
        } else {
          this.error.set(mensajeApi(err));
        }
      },
    });
  }

  cancelar(): void {
    this.ref.close(false);
  }
}
