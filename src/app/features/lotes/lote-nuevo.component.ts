import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { extraerFieldErrors, mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MedicamentosApiService } from '../medicamentos/medicamentos-api.service';
import { MedicamentoDto } from '../medicamentos/medicamentos.models';
import { LotesApiService } from './lotes-api.service';
import { LoteRequest } from './lotes.models';

@Component({
  selector: 'app-lote-nuevo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './lote-nuevo.component.html',
  styleUrl: './lote-nuevo.component.scss',
})
export class LoteNuevoComponent implements OnInit {
  private readonly lotesApi = inject(LotesApiService);
  private readonly medApi = inject(MedicamentosApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly lab = computed(() => this.session.organizacion());
  readonly medicamentos = signal<MedicamentoDto[]>([]);
  readonly cargandoMedicamentos = signal(false);
  readonly enviando = signal(false);
  readonly errorGeneral = signal<string | null>(null);

  readonly medicamentoSeleccionado = computed(() => {
    const id = this.form.controls.medicamentoId.value;
    return this.medicamentos().find((m) => m.id === id) ?? null;
  });

  readonly form = new FormGroup({
    codigoLote: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    medicamentoId: new FormControl<number | null>(null, [Validators.required]),
    cantidadUnidades: new FormControl<number>(100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(1000)],
    }),
    tempMin: new FormControl<number | null>(2.0),
    tempMax: new FormControl<number | null>(8.0),
    fechaHoraFabricacion: new FormControl<string>(this.obtenerFechaActual(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.cargarMedicamentos();
  }

  cargarMedicamentos(): void {
    this.cargandoMedicamentos.set(true);
    this.medApi.listar().subscribe({
      next: (lista) => {
        this.medicamentos.set(lista);
        this.cargandoMedicamentos.set(false);
      },
      error: (err) => {
        this.errorGeneral.set(`Error al cargar el catálogo de medicamentos: ${mensajeApi(err)}`);
        this.cargandoMedicamentos.set(false);
      },
    });
  }

  guardar(): void {
    if (this.enviando()) return;
    this.errorGeneral.set(null);

    const lab = this.lab();
    if (!lab?.id) {
      this.errorGeneral.set(
        'No se identificó la organización de laboratorio en la sesión actual. Seleccioná un laboratorio válido en el inicio.',
      );
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { codigoLote, medicamentoId, cantidadUnidades, tempMin, tempMax, fechaHoraFabricacion } =
      this.form.getRawValue();

    if (tempMin != null && tempMax != null && Number(tempMin) >= Number(tempMax)) {
      this.form.controls.tempMin.setErrors({ rangoInvalido: 'La temperatura mínima debe ser menor a la máxima.' });
      return;
    }

    const med = this.medicamentoSeleccionado();
    if (med?.requiereCadenaFrio && (tempMin == null || tempMax == null)) {
      this.form.controls.tempMin.setErrors({ requiereFrio: 'El fármaco requiere cadena de frío: definí el rango térmico.' });
      return;
    }

    const request: LoteRequest = {
      codigoLote: codigoLote.trim(),
      medicamentoId: Number(medicamentoId),
      laboratorioId: lab.id,
      tempMin: tempMin != null ? Number(tempMin) : null,
      tempMax: tempMax != null ? Number(tempMax) : null,
      fechaHoraFabricacion: fechaHoraFabricacion || null,
    };

    this.enviando.set(true);

    this.lotesApi.crear(request).subscribe({
      next: (loteCreado) => {
        // Lote creado exitosamente. Ahora generamos las unidades QR.
        this.lotesApi.generarUnidades(loteCreado.id, Number(cantidadUnidades)).subscribe({
          next: (res) => {
            this.enviando.set(false);
            const msg = res.advertencia ||
              `Lote ${loteCreado.codigoLote} creado con ${res.unidades.length} unidades QR.`;
            this.snack.open(msg, 'Cerrar', { duration: 5000 });
            this.router.navigate(['/lotes', loteCreado.id]);
          },
          error: (errUnidades) => {
            // No perder el lote: ir al detalle con advertencia y permitir reintentar
            this.enviando.set(false);
            this.snack.open(
              `Lote creado pero falló la generación de unidades: ${mensajeApi(errUnidades)}. Podés reintentar en el detalle.`,
              'Cerrar',
              { duration: 8000 },
            );
            this.router.navigate(['/lotes', loteCreado.id], {
              queryParams: { errorGeneracion: '1' },
            });
          },
        });
      },
      error: (err) => {
        this.enviando.set(false);
        this.manejarErrorLote(err);
      },
    });
  }

  private manejarErrorLote(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      this.form.controls.codigoLote.setErrors({ duplicado: mensajeApi(err) });
      this.form.controls.codigoLote.markAsTouched();
      return;
    }

    let hayCampo = false;
    for (const [campo, mensaje] of Object.entries(extraerFieldErrors(err))) {
      const control = this.form.get(campo);
      if (control) {
        control.setErrors({ servidor: mensaje });
        control.markAsTouched();
        hayCampo = true;
      }
    }

    if (!hayCampo) {
      this.errorGeneral.set(mensajeApi(err));
    }
  }

  private obtenerFechaActual(): string {
    const ahora = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(
      ahora.getHours(),
    )}:${pad(ahora.getMinutes())}`;
  }
}

export { LoteNuevoComponent as LoteNuevoPage };
