import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import { mensajeApi } from '../../core/http/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { CadenasApiService } from './cadenas-api.service';
import { CadenaResumen, DespachoDto, LoteDto } from './cadenas.models';

/**
 * F33 — "Auditoría Global de Cadenas". No existe la entidad "cadena" en el backend:
 * aquí una cadena = un enlace CUIT ACTIVO + los despachos que lo usan (enlaceCuitId)
 * + los lotes de esos despachos (loteId). Ambas asociaciones se hacen en el cliente.
 */
@Component({
  selector: 'app-cadenas',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './cadenas.component.html',
  styleUrl: './cadenas.component.scss',
})
export class CadenasComponent implements OnInit {
  private readonly api = inject(CadenasApiService);

  readonly cadenas = signal<CadenaResumen[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin({
      enlaces: this.api.listarEnlacesActivos(),
      lotes: this.api.listarLotes(),
      despachos: this.api.listarDespachos(),
    }).subscribe({
      next: ({ enlaces, lotes, despachos }) => {
        const lotesPorId = new Map<number, LoteDto>(lotes.map((l) => [l.id, l]));
        this.cadenas.set(
          enlaces.map((enlace) => {
            const despachosDelEnlace: DespachoDto[] = despachos.filter(
              (d) => d.enlaceCuitId === enlace.id,
            );
            const loteIds = [...new Set(despachosDelEnlace.map((d) => d.loteId))];
            const lotesDelEnlace = loteIds
              .map((id) => lotesPorId.get(id))
              .filter((l): l is LoteDto => !!l);
            return { enlace, lotes: lotesDelEnlace, despachos: despachosDelEnlace };
          }),
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
