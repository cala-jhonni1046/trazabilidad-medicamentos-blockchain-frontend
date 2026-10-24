import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { mensajeApi } from '../../core/http/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { CadenasApiService } from './cadenas-api.service';
import { RegistroBlockchainDto } from './cadenas.models';

/**
 * "Registros demostrativos" (RegistroBlockchain): CRUD de metadatos declarados.
 * No hay conexión con una blockchain distribuida: el aviso es siempre visible.
 */
@Component({
  selector: 'app-registros-demo-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './registros-demo-panel.component.html',
  styleUrl: './registros-demo-panel.component.scss',
})
export class RegistrosDemoPanelComponent implements OnInit {
  private readonly api = inject(CadenasApiService);
  private readonly fb = inject(FormBuilder);

  readonly registros = signal<RegistroBlockchainDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorEnvio = signal<string | null>(null);

  readonly form = this.fb.group({
    transactionHash: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    bloque: this.fb.control<number | null>(null),
    firma: this.fb.control('', { nonNullable: true }),
    confirmado: this.fb.control(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listarRegistros().subscribe({
      next: (registros) => {
        this.registros.set(registros);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  truncarHash(hash: string | null): string {
    if (!hash) return '—';
    return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
  }

  copiarHash(hash: string | null): void {
    if (!hash || typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(hash);
  }

  guardar(): void {
    if (this.form.invalid || this.enviando()) return;
    this.enviando.set(true);
    this.errorEnvio.set(null);
    const v = this.form.getRawValue();
    this.api
      .crearRegistro({
        transactionHash: v.transactionHash.trim(),
        ...(v.bloque != null ? { bloque: v.bloque } : {}),
        ...(v.firma.trim() ? { firmaInspectorANMAT: v.firma.trim() } : {}),
        confirmado: v.confirmado,
      })
      .subscribe({
        next: (nuevo) => {
          this.enviando.set(false);
          this.registros.set([nuevo, ...this.registros()]);
          this.form.reset({ transactionHash: '', bloque: null, firma: '', confirmado: false });
        },
        error: (err: unknown) => {
          this.enviando.set(false);
          this.errorEnvio.set(mensajeApi(err));
        },
      });
  }
}
