import { Component, OnInit, inject } from '@angular/core';
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
  lotes: LoteSimple[] = [];
  enlaces: EnlaceCuitSimple[] = [];
  enlaceSeleccionado?: EnlaceCuitSimple;

  cargandoDatos = false;
  guardando = false;
  errorCarga: string | null = null;
  errorEnvio: string | null = null;
  fieldErrors: Record<string, string> = {};

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
    this.cargandoDatos = true;
    this.errorCarga = null;

    forkJoin({
      lotes: this.api.getLotes(),
      enlaces: this.api.getEnlacesActivos(),
    }).subscribe({
      next: ({ lotes, enlaces }) => {
        const orgId = this.session.organizacion()?.id;

        // Filtrar lotes del laboratorio del usuario
        this.lotes = lotes.filter((l) => !orgId || l.laboratorioId === orgId);

        // Filtrar enlaces ACTIVO cuyo laboratorio sea el del usuario
        this.enlaces = enlaces.filter((e) => !orgId || e.laboratorioId === orgId);

        this.cargandoDatos = false;
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargandoDatos = false;
      },
    });
  }

  onLoteChange(loteId: number): void {
    const lote = this.lotes.find((l) => l.id === loteId);
    if (lote) {
      this.form.patchValue({
        temperaturaMinimaPermitida: lote.tempMin ?? null,
        temperaturaMaximaPermitida: lote.tempMax ?? null,
      });
    }
  }

  onEnlaceChange(enlaceId: number): void {
    this.enlaceSeleccionado = this.enlaces.find((e) => e.id === enlaceId);
  }

  guardar(): void {
    if (this.form.invalid || !this.enlaceSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorEnvio = null;
    this.fieldErrors = {};

    const formVal = this.form.value;
    const request: DespachoLogisticoRequest = {
      loteId: Number(formVal.loteId),
      enlaceCuitId: Number(formVal.enlaceCuitId),
      distribuidorId: this.enlaceSeleccionado.distribuidorId,
      farmaciaDestinoId: this.enlaceSeleccionado.farmaciaId || null,
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
        this.guardando = false;
        void this.router.navigate(['/despachos', despacho.id]);
      },
      error: (err) => {
        this.guardando = false;
        this.errorEnvio = mensajeApi(err);
        this.fieldErrors = extraerFieldErrors(err);
      },
    });
  }
}
