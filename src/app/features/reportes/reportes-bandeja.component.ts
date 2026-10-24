import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { ReporteDetalleDialogComponent } from './reporte-detalle-dialog.component';
import { ReportesApiService } from './reportes-api.service';
import { ESTADOS_REPORTE, EstadoReporte, ReporteCiudadanoDto } from './reportes.models';
import { reportesPendientesCount } from './reportes.state';

@Component({
  selector: 'app-reportes-bandeja',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  templateUrl: './reportes-bandeja.component.html',
  styleUrl: './reportes-bandeja.component.scss',
})
export class ReportesBandejaComponent implements OnInit {
  private readonly api = inject(ReportesApiService);
  readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly columnas = ['qr', 'motivo', 'fecha', 'estado', 'inspector', 'acciones'];
  readonly estadosDisponibles = ESTADOS_REPORTE;

  readonly reportes = signal<ReporteCiudadanoDto[]>([]);
  readonly cargando = signal(false);
  readonly errorLista = signal<string | null>(null);
  /** IDs de reportes con una transición en curso: deshabilita sus botones mientras dura. */
  readonly procesando = signal<ReadonlySet<number>>(new Set());

  readonly filtros = new FormGroup({
    estado: new FormControl<EstadoReporte | ''>(''),
    inspectorId: new FormControl<number | null>(null),
  });

  /** Solo ANMAT con inspector habilitado puede resolver; SUPERADMIN siempre es lectura. */
  readonly puedeActuar = computed(
    () => this.session.rol() === 'ANMAT' && this.session.puedeResolver(),
  );

  readonly reportesFiltrados = computed(() => {
    // Defensa en el cliente: docs/api.md advierte que el backend puede ignorar
    // inspectorId si se combina con otros filtros.
    const insp = this.filtros.controls.inspectorId.value;
    if (insp == null) return this.reportes();
    return this.reportes().filter((r) => r.inspectorAsignadoId === insp);
  });

  ngOnInit(): void {
    this.cargar();
    this.actualizarContadorPendientes();
  }

  cargar(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.errorLista.set(null);
    const estado = this.filtros.controls.estado.value || undefined;
    const inspectorId = this.filtros.controls.inspectorId.value ?? undefined;
    this.api.listar({ estado, inspectorId }).subscribe({
      next: (reportes) => {
        this.reportes.set(reportes);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.errorLista.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  /** El badge del menú muestra siempre el total de PENDIENTES, sin importar el filtro activo. */
  private actualizarContadorPendientes(): void {
    this.api.listar({ estado: 'PENDIENTE' }).subscribe({
      next: (lista) => reportesPendientesCount.set(lista.length),
      error: () => reportesPendientesCount.set(null),
    });
  }

  verDetalle(reporte: ReporteCiudadanoDto): void {
    this.dialog.open(ReporteDetalleDialogComponent, {
      data: { reporte },
      width: '540px',
      maxWidth: '92vw',
    });
  }

  iniciarRevision(reporte: ReporteCiudadanoDto): void {
    this.transicionar(reporte, (id, body) => this.api.iniciarRevision(id, body), 'Revisión iniciada.');
  }

  resolver(reporte: ReporteCiudadanoDto): void {
    this.transicionar(reporte, (id, body) => this.api.resolver(id, body), 'Reporte resuelto.');
  }

  private transicionar(
    reporte: ReporteCiudadanoDto,
    accion: (id: number, body: { inspectorAsignadoId?: number }) => Observable<ReporteCiudadanoDto>,
    mensajeExito: string,
  ): void {
    if (this.procesando().has(reporte.id)) return;
    this.marcarProcesando(reporte.id, true);

    const inspectorId = this.session.inspector()?.id;
    accion(reporte.id, inspectorId ? { inspectorAsignadoId: inspectorId } : {}).subscribe({
      next: (actualizado) => {
        this.marcarProcesando(reporte.id, false);
        this.reportes.set(this.reportes().map((r) => (r.id === actualizado.id ? actualizado : r)));
        this.actualizarContadorPendientes();
        this.snack.open(mensajeExito, 'Cerrar', { duration: 3000 });
      },
      error: (err: unknown) => {
        this.marcarProcesando(reporte.id, false);
        // 409 de transición inválida (ej. otro inspector ya la resolvió): se muestra tal cual.
        this.snack.open(mensajeApi(err), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private marcarProcesando(id: number, activo: boolean): void {
    const actual = new Set(this.procesando());
    if (activo) actual.add(id);
    else actual.delete(id);
    this.procesando.set(actual);
  }
}
