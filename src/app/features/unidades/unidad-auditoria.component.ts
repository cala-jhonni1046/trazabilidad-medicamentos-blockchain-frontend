import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { mensajeApi } from '../../core/http/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { UnidadesApiService } from './unidades-api.service';
import { HistorialPaso, HistorialUnidad } from './unidades.models';

@Component({
  selector: 'app-unidad-auditoria',
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
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './unidad-auditoria.component.html',
  styleUrl: './unidad-auditoria.component.scss',
})
export class UnidadAuditoriaComponent implements OnInit {
  private readonly api = inject(UnidadesApiService);
  private readonly route = inject(ActivatedRoute);

  readonly qrControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly historial = signal<HistorialUnidad | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly qrNoEncontrado = signal<string | null>(null);

  ngOnInit(): void {
    const qrParam = this.route.snapshot.queryParamMap.get('qr');
    if (qrParam && qrParam.trim()) {
      this.qrControl.setValue(qrParam.trim());
      this.buscarQr(qrParam.trim());
    }
  }

  buscar(): void {
    const qr = this.qrControl.value.trim();
    if (!qr) return;
    this.buscarQr(qr);
  }

  buscarQr(codigoQr: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.qrNoEncontrado.set(null);
    this.historial.set(null);

    this.api.construirHistorial(codigoQr).subscribe({
      next: (data) => {
        this.historial.set(data);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.qrNoEncontrado.set(codigoQr);
        } else {
          this.error.set(mensajeApi(err));
        }
      },
    });
  }

  iconoPaso(paso: HistorialPaso): string {
    switch (paso.tipo) {
      case 'FABRICACION':
        return 'science';
      case 'DESPACHO':
        return 'local_shipping';
      case 'CUSTODIA':
        return 'security';
      case 'CUARENTENA':
        return 'warning';
      case 'RECEPCION':
        return 'done_all';
      case 'DISPENSACION':
        return 'local_pharmacy';
      default:
        return 'radio_button_checked';
    }
  }

  tienePaso(tipo: string): boolean {
    return this.historial()?.pasos.some((p) => p.tipo === tipo) ?? false;
  }
}

export { UnidadAuditoriaComponent as UnidadAuditoriaPage };
