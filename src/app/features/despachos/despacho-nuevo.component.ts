import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { DespachosApiService } from './despachos-api.service';
import { LoteSimple, EnlaceCuitSimple, DespachoLogisticoRequest } from './despachos.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { mensajeApi, extraerFieldErrors } from '../../core/http/api-error';

@Component({
  selector: 'app-despacho-nuevo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './despacho-nuevo.component.html',
  styleUrls: ['./despacho-nuevo.component.scss'],
})
export class DespachoNuevoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly api = inject(DespachosApiService);
  readonly session = inject(SessionService);

  form!: FormGroup;

  // App zoneless: lo que se modifica en subscribe/next/error y se lee en la plantilla
  // debe ser signal; un campo común no repinta la vista.
  readonly lotes = signal<LoteSimple[]>([]);
  readonly enlaces = signal<EnlaceCuitSimple[]>([]);
  readonly enlaceSeleccionado = signal<EnlaceCuitSimple | null>(null);

  readonly cargandoDatos = signal(false);
  readonly guardando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly errorEnvio = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.form = this.fb.group({
      loteId: [null, [Validators.required]],
      enlaceCuitId: [null, [Validators.required]],
      numeroRemito: ['', [Validators.required, Validators.maxLength(50)]],
      vehiculoPatente: ['', [Validators.maxLength(20)]],
      fechaSalida: [''],
      fechaEstimadaEntrega: [''],
      temperaturaMinimaPermitida: [null],
      temperaturaMaximaPermitida: [null],
      observaciones: ['', [Validators.maxLength(500)]],
    });

    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargandoDatos.set(true);
    this.errorCarga.set(null);

    forkJoin({
      lotes: this.api.getLotes(),
      enlaces: this.api.getEnlacesActivos(),
    }).subscribe({
      next: ({ lotes, enlaces }) => {
        const orgId = this.session.organizacion()?.id;

        // Filtrar lotes del laboratorio del usuario
        this.lotes.set(lotes.filter((l) => !orgId || l.laboratorioId === orgId));

        // Filtrar enlaces ACTIVO cuyo laboratorio sea el del usuario
        this.enlaces.set(enlaces.filter((e) => !orgId || e.laboratorioId === orgId));

        this.cargandoDatos.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargandoDatos.set(false);
      },
    });
  }

  onLoteChange(loteId: number): void {
    const lote = this.lotes().find((l) => l.id === loteId);
    if (lote) {
      this.form.patchValue({
        temperaturaMinimaPermitida: lote.tempMin ?? null,
        temperaturaMaximaPermitida: lote.tempMax ?? null,
      });
    }
  }

  onEnlaceChange(enlaceId: number): void {
    this.enlaceSeleccionado.set(this.enlaces().find((e) => e.id === enlaceId) ?? null);
  }

  guardar(): void {
    const enlaceSeleccionado = this.enlaceSeleccionado();
    if (this.form.invalid || !enlaceSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorEnvio.set(null);
    this.fieldErrors.set({});

    const formVal = this.form.value;
    const request: DespachoLogisticoRequest = {
      loteId: Number(formVal.loteId),
      enlaceCuitId: Number(formVal.enlaceCuitId),
      distribuidorId: enlaceSeleccionado.distribuidorId,
      farmaciaDestinoId: enlaceSeleccionado.farmaciaId || null,
      numeroRemito: String(formVal.numeroRemito).trim(),
      vehiculoPatente: formVal.vehiculoPatente ? String(formVal.vehiculoPatente).trim().toUpperCase() : null,
      fechaSalida: formVal.fechaSalida || null,
      fechaEstimadaEntrega: formVal.fechaEstimadaEntrega || null,
      temperaturaMinimaPermitida: formVal.temperaturaMinimaPermitida !== null ? Number(formVal.temperaturaMinimaPermitida) : null,
      temperaturaMaximaPermitida: formVal.temperaturaMaximaPermitida !== null ? Number(formVal.temperaturaMaximaPermitida) : null,
      observaciones: formVal.observaciones ? String(formVal.observaciones).trim() : null,
    };

    this.api.crearDespacho(request).subscribe({
      next: (despacho) => {
        this.guardando.set(false);
        void this.router.navigate(['/despachos', despacho.id]);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorEnvio.set(mensajeApi(err));
        this.fieldErrors.set(extraerFieldErrors(err));
      },
    });
  }
}
