import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { DispensacionApiService } from './dispensacion-api.service';
import { DispensacionResponse, LoteLite, UnidadTrazableLite, dniValidator, normalizarDni } from './dispensacion.models';

/**
 * F32 — "Dispensación Minorista y Venta por DNI". El DNI nunca se muestra ni se
 * conserva después de enviar: se limpia del formulario y del estado en cuanto
 * termina el envío (con éxito o con error), y no se registra en consola.
 */
@Component({
  selector: 'app-dispensacion',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingOverlayComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './dispensacion.component.html',
  styleUrl: './dispensacion.component.scss',
})
export class DispensacionComponent {
  private readonly api = inject(DispensacionApiService);
  private readonly session = inject(SessionService);
  private readonly fb = inject(FormBuilder);

  codigoQr = '';
  buscando = signal(false);
  errorBusqueda = signal<string | null>(null);
  unidad = signal<UnidadTrazableLite | null>(null);
  lote = signal<LoteLite | null>(null);

  enviando = signal(false);
  errorEnvio = signal<string | null>(null);
  confirmacion = signal<DispensacionResponse | null>(null);

  readonly form = this.fb.group({
    dniPaciente: this.fb.control('', [dniValidator()]),
    recetaNumero: this.fb.control('', [Validators.maxLength(100)]),
  });

  /**
   * Chequeo propio en el cliente: no reemplaza al backend (que vuelve a validar
   * la recepción conforme), solo evita envíos obviamente inválidos. Según
   * docs/api.md, solo los lotes RECIBIDO o LIBERADO admiten dispensación.
   */
  elegible(): boolean {
    const u = this.unidad();
    const l = this.lote();
    if (!u || !l) return false;
    return u.estado === 'DISPONIBLE' && (l.estado === 'RECIBIDO' || l.estado === 'LIBERADO');
  }

  motivoNoElegible(): string | null {
    const u = this.unidad();
    const l = this.lote();
    if (!u || !l) return null;
    if (u.estado !== 'DISPONIBLE') return `La unidad ya no está disponible (estado: ${u.estado}).`;
    if (l.estado === 'EN_CUARENTENA') return 'El lote está en cuarentena: no se puede dispensar.';
    if (l.estado === 'CERRADO') return 'El lote está cerrado: no se puede dispensar.';
    return `El lote todavía no está en condiciones de dispensarse (estado: ${l.estado}).`;
  }

  buscar(): void {
    if (this.buscando()) return;
    const codigo = this.codigoQr.trim();
    this.errorBusqueda.set(null);
    this.unidad.set(null);
    this.lote.set(null);
    this.confirmacion.set(null);
    if (!codigo) {
      this.errorBusqueda.set('Ingresá o escaneá un código QR.');
      return;
    }
    this.buscando.set(true);
    this.api
      .buscarUnidadPorQr(codigo)
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (unidad) => {
          this.unidad.set(unidad);
          this.api.obtenerLote(unidad.loteId).subscribe({
            next: (lote) => this.lote.set(lote),
            error: (err: unknown) => this.errorBusqueda.set(mensajeApi(err)),
          });
        },
        error: (err: unknown) => this.errorBusqueda.set(mensajeApi(err)),
      });
  }

  dispensar(): void {
    const unidad = this.unidad();
    const farmaciaId = this.session.organizacion()?.id;
    if (!unidad || !farmaciaId || this.enviando() || this.form.invalid) return;

    this.enviando.set(true);
    this.errorEnvio.set(null);

    const dniLimpio = normalizarDni(this.form.value.dniPaciente);
    const receta = this.form.value.recetaNumero?.trim();

    this.api
      .crear({
        unidadTrazableId: unidad.id,
        farmaciaId,
        ...(dniLimpio ? { dniPaciente: dniLimpio } : {}),
        ...(receta ? { recetaNumero: receta } : {}),
      })
      .pipe(
        finalize(() => {
          this.enviando.set(false);
          // El DNI no se conserva nunca, haya éxito o error.
          this.form.controls.dniPaciente.setValue('');
        }),
      )
      .subscribe({
        next: (respuesta) => {
          this.confirmacion.set(respuesta);
          this.unidad.set({ ...unidad, estado: 'DISPENSADA' });
          this.form.reset();
        },
        error: (err: unknown) => this.errorEnvio.set(mensajeApi(err)),
      });
  }

  nuevaConsulta(): void {
    this.codigoQr = '';
    this.unidad.set(null);
    this.lote.set(null);
    this.confirmacion.set(null);
    this.errorBusqueda.set(null);
    this.errorEnvio.set(null);
    this.form.reset();
  }
}
