import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FarmaciaApiService } from './farmacia-api.service';
import { ItemInventario } from './farmacia.models';

/**
 * F32 — "Dashboard de Control en Farmacia": tarjetas de resumen + tabla de inventario.
 * No existe endpoint directo de inventario: se deriva de recepciones → despachos → lotes → unidades.
 */
@Component({
  selector: 'app-farmacia-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './farmacia-dashboard.component.html',
  styleUrl: './farmacia-dashboard.component.scss',
})
export class FarmaciaDashboardComponent implements OnInit {
  private readonly api = inject(FarmaciaApiService);
  readonly session = inject(SessionService);

  readonly columnas = ['qr', 'lote', 'medicamento', 'estado'];

  readonly inventario = signal<ItemInventario[]>([]);
  readonly lotesRecibidosCount = signal(0);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly disponibles = computed(() => this.inventario().filter((i) => i.estado === 'DISPONIBLE').length);
  readonly dispensadas = computed(() => this.inventario().filter((i) => i.estado === 'DISPENSADA').length);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const farmaciaId = this.session.organizacion()?.id;
    if (!farmaciaId) {
      this.error.set('No hay una farmacia asociada a esta sesión.');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      inventario: this.api.inventario(farmaciaId),
      recepciones: this.api.listarRecepciones(farmaciaId),
    }).subscribe({
      next: ({ inventario, recepciones }) => {
        this.inventario.set(inventario);
        this.lotesRecibidosCount.set(
          new Set(inventario.map((i) => i.loteId)).size || new Set(recepciones.map((r) => r.despachoLogisticoId)).size,
        );
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }
}
