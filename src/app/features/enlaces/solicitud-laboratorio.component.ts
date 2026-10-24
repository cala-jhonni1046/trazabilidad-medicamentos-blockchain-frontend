import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { formatearCuit } from '../../shared/utils/cuit';
import { EnlaceSolicitudFormComponent } from './enlace-solicitud-form.component';
import { EnlacesApiService } from './enlaces-api.service';
import { EnlaceDto, EstadoEnlace, OrganizacionLite } from './enlaces.models';

/** LABORATORIO: presentar licencia y CUITs, y seguir "Mis solicitudes". */
@Component({
  selector: 'app-solicitud-laboratorio',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
    EnlaceSolicitudFormComponent,
  ],
  templateUrl: './solicitud-laboratorio.component.html',
  styleUrl: './solicitud-laboratorio.component.scss',
})
export class SolicitudLaboratorioComponent implements OnInit {
  private readonly api = inject(EnlacesApiService);
  private readonly session = inject(SessionService);

  readonly columnas = ['distribuidor', 'farmacia', 'disposicion', 'estado', 'solicitada', 'resolucion'];
  readonly formatearCuit = formatearCuit;

  /** Organización con la que opera la sesión (se elige al ingresar). */
  readonly miLaboratorio = computed<OrganizacionLite | null>(() => {
    const org = this.session.organizacion();
    return org && org.tipo === 'LABORATORIO' ? org : null;
  });

  readonly enlaces = signal<EnlaceDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtroEstado = signal<EstadoEnlace | ''>('');
  readonly ultimaCreada = signal<EnlaceDto | null>(null);

  /** Mis solicitudes: se filtra por laboratorio también en el cliente y se ordena por fecha. */
  readonly misSolicitudes = computed(() => {
    const lab = this.miLaboratorio();
    const estado = this.filtroEstado();
    return this.enlaces()
      .filter((e) => lab !== null && e.laboratorioId === lab.id)
      .filter((e) => !estado || e.estado === estado)
      .sort((a, b) => (b.fechaSolicitud ?? '').localeCompare(a.fechaSolicitud ?? ''));
  });

  readonly totalPropias = computed(() => {
    const lab = this.miLaboratorio();
    return this.enlaces().filter((e) => lab !== null && e.laboratorioId === lab.id).length;
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const lab = this.miLaboratorio();
    if (!lab) return;
    this.cargando.set(true);
    this.error.set(null);
    this.api.listar({ laboratorioId: lab.id }).subscribe({
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

  onCreada(enlace: EnlaceDto): void {
    this.ultimaCreada.set(enlace);
    this.filtroEstado.set('');
    this.cargar();
  }
}
