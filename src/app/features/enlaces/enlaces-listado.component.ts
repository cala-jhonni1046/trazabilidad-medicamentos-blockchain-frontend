import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { formatearCuit, normalizarCuit } from '../../shared/utils/cuit';
import { EnlacesApiService } from './enlaces-api.service';
import { ESTADOS_ENLACE, EnlaceDto, EstadoEnlace, urlSegura } from './enlaces.models';

/** "Licencias y CUITs": listado completo de enlaces. ANMAT y SUPERADMIN, solo lectura. */
@Component({
  selector: 'app-enlaces-listado',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './enlaces-listado.component.html',
  styleUrl: './enlaces-listado.component.scss',
})
export class EnlacesListadoComponent implements OnInit {
  private readonly api = inject(EnlacesApiService);
  private readonly session = inject(SessionService);

  readonly columnas = ['cadena', 'disposicion', 'estado', 'solicitada', 'resolucion', 'certificado'];
  readonly estados = ESTADOS_ENLACE;
  readonly formatearCuit = formatearCuit;
  readonly urlSegura = urlSegura;

  readonly esAnmat = computed(() => this.session.rol() === 'ANMAT');

  readonly enlaces = signal<EnlaceDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtroEstado = signal<EstadoEnlace | ''>('');
  readonly busqueda = signal('');

  readonly filtrados = computed(() => {
    const estado = this.filtroEstado();
    const q = this.busqueda().trim().toLowerCase();
    const digitos = normalizarCuit(q);
    return this.enlaces()
      .filter((e) => !estado || e.estado === estado)
      .filter((e) => {
        if (!q) return true;
        const nombres = [e.laboratorioNombre, e.distribuidorNombre, e.farmaciaNombre]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const cuits = [e.laboratorioCuit, e.distribuidorCuit, e.farmaciaCuit].join(' ');
        return nombres.includes(q) || (digitos.length > 0 && cuits.includes(digitos));
      })
      .sort((a, b) => (b.fechaSolicitud ?? '').localeCompare(a.fechaSolicitud ?? ''));
  });

  readonly hayRechazados = computed(() => this.filtrados().some((e) => e.estado === 'RECHAZADO'));

  ngOnInit(): void {
    this.cargar();
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listar().subscribe({
      next: (lista) => {
        this.enlaces.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }
}
