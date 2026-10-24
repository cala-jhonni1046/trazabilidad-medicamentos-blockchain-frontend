import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { LotesApiService } from './lotes-api.service';
import { EstadoLote, Lote } from './lotes.models';

@Component({
  selector: 'app-lotes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './lotes-list.component.html',
  styleUrl: './lotes-list.component.scss',
})
export class LotesListComponent implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly session = inject(SessionService);

  readonly esLaboratorio = computed(() => this.session.rol() === 'LABORATORIO');
  readonly labId = computed(() => this.session.organizacion()?.id);

  readonly lotes = signal<Lote[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEstado = signal<EstadoLote | ''>('');

  readonly columnas = [
    'codigoLote',
    'medicamento',
    'laboratorio',
    'rango',
    'fabricacion',
    'estado',
    'acciones',
  ];

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();

    return this.lotes().filter((l) => {
      if (estado && l.estado !== estado) return false;
      if (!q) return true;
      return (
        l.codigoLote.toLowerCase().includes(q) ||
        (l.medicamentoNombre && l.medicamentoNombre.toLowerCase().includes(q)) ||
        (l.laboratorioNombre && l.laboratorioNombre.toLowerCase().includes(q))
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const labId = this.esLaboratorio() ? this.labId() : undefined;
    this.api.listar(labId).subscribe({
      next: (data) => {
        // Asegurar que si el rol es LABORATORIO, solo se muestren lotes de su organización
        let lista = data;
        if (this.esLaboratorio() && labId) {
          lista = data.filter((l) => l.laboratorioId === labId);
        }
        this.lotes.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  formatoRango(lote: Lote): string {
    if (lote.tempMin != null && lote.tempMax != null) {
      return `${lote.tempMin}°C a ${lote.tempMax}°C`;
    }
    if (lote.tempMin != null) return `Min ${lote.tempMin}°C`;
    if (lote.tempMax != null) return `Max ${lote.tempMax}°C`;
    return 'Sin rango especificado';
  }
}

export { LotesListComponent as LotesListPage };
