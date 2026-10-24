import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { mensajeApi } from '../../core/http/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { UnidadesApiService } from './unidades-api.service';
import { UnidadTrazableDto } from './unidades.models';

@Component({
  selector: 'app-unidades-list',
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
  templateUrl: './unidades-list.component.html',
  styleUrl: './unidades-list.component.scss',
})
export class UnidadesListComponent implements OnInit {
  private readonly api = inject(UnidadesApiService);
  private readonly route = inject(ActivatedRoute);

  readonly unidades = signal<UnidadTrazableDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtroLoteId = signal<number | null>(null);
  readonly filtroEstado = signal<string>('TODOS');
  readonly busqueda = signal('');

  readonly columnas = ['codigoQr', 'loteId', 'estado', 'fechaCreacion', 'acciones'];

  readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const est = this.filtroEstado();

    return this.unidades().filter((u) => {
      if (est !== 'TODOS' && u.estado !== est) return false;
      if (!q) return true;
      return (
        u.codigoQr.toLowerCase().includes(q) ||
        String(u.loteId).includes(q)
      );
    });
  });

  ngOnInit(): void {
    const loteParam = this.route.snapshot.queryParamMap.get('loteId');
    if (loteParam) {
      this.filtroLoteId.set(Number(loteParam));
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const loteId = this.filtroLoteId() ?? undefined;
    const estado = this.filtroEstado() !== 'TODOS' ? this.filtroEstado() : undefined;

    this.api.listar(loteId, estado).subscribe({
      next: (list) => {
        this.unidades.set(list);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  onLoteInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.filtroLoteId.set(val ? Number(val) : null);
    this.cargar();
  }
}

export { UnidadesListComponent as UnidadesListPage };
