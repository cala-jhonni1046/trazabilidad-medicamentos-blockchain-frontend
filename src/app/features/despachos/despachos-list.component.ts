import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DespachosApiService } from './despachos-api.service';
import { DespachoLogistico } from './despachos.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { mensajeApi } from '../../core/http/api-error';

@Component({
  selector: 'app-despachos-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './despachos-list.component.html',
  styleUrls: ['./despachos-list.component.scss'],
})
export class DespachosListComponent implements OnInit {
  private readonly api = inject(DespachosApiService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);

  // App zoneless: todo lo que se modifica en subscribe/next/error y se lee en la
  // plantilla debe ser signal; un campo común no repinta la vista.
  readonly despachos = signal<DespachoLogistico[]>([]);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionEnCursoId = signal<number | null>(null);
  readonly errorAccion = signal<string | null>(null);

  readonly filtroEstado = signal<string>('TODOS');
  readonly filtroBusqueda = signal<string>('');

  readonly displayedColumns: string[] = [
    'numeroRemito',
    'lote',
    'distribuidor',
    'farmacia',
    'vehiculoPatente',
    'estado',
    'fechaSalida',
    'acciones',
  ];

  readonly despachosFiltrados = computed(() => {
    const estado = this.filtroEstado();
    const termino = this.filtroBusqueda().trim().toLowerCase();

    return this.despachos().filter((d) => {
      const cumpleEstado = estado === 'TODOS' || d.estado === estado;

      const cumpleBusqueda =
        !termino ||
        (d.numeroRemito && d.numeroRemito.toLowerCase().includes(termino)) ||
        (d.codigoLote && d.codigoLote.toLowerCase().includes(termino)) ||
        (d.medicamentoNombre && d.medicamentoNombre.toLowerCase().includes(termino)) ||
        (d.distribuidorNombre && d.distribuidorNombre.toLowerCase().includes(termino)) ||
        (d.vehiculoPatente && d.vehiculoPatente.toLowerCase().includes(termino));

      return cumpleEstado && cumpleBusqueda;
    });
  });

  ngOnInit(): void {
    this.cargarDespachos();
  }

  cargarDespachos(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.api.getDespachos().subscribe({
      next: (data) => {
        const orgId = this.session.organizacion()?.id;
        const rol = this.session.rol();

        // Si es LABORATORIO, filtrar por su laboratorio
        const despachos = rol === 'LABORATORIO' && orgId ? data.filter((d) => d.laboratorioId === orgId) : data;
        this.despachos.set(despachos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  iniciar(despacho: DespachoLogistico): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Iniciar despacho logístico',
        message: `¿Confirmas el inicio del traslado para el remito ${despacho.numeroRemito}? El despacho pasará a EN_TRANSITO.`,
        confirmText: 'Iniciar despacho',
        cancelText: 'Volver',
        isDanger: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCursoId.set(despacho.id);
      this.errorAccion.set(null);

      this.api.iniciarDespacho(despacho.id, { observaciones: 'Despacho iniciado desde el panel' }).subscribe({
        next: (actualizado) => {
          this.reemplazarDespacho(despacho.id, actualizado.estado);
          this.accionEnCursoId.set(null);
        },
        error: (err) => {
          this.errorAccion.set(mensajeApi(err));
          this.accionEnCursoId.set(null);
        },
      });
    });
  }

  cancelar(despacho: DespachoLogistico): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar despacho logístico',
        message: `¿Estás seguro de cancelar el remito ${despacho.numeroRemito}? Esta acción no se puede deshacer.`,
        confirmText: 'Sí, cancelar despacho',
        cancelText: 'Volver',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCursoId.set(despacho.id);
      this.errorAccion.set(null);

      this.api.cancelarDespacho(despacho.id, { observaciones: 'Cancelado por el usuario' }).subscribe({
        next: (actualizado) => {
          this.reemplazarDespacho(despacho.id, actualizado.estado);
          this.accionEnCursoId.set(null);
        },
        error: (err) => {
          this.errorAccion.set(mensajeApi(err));
          this.accionEnCursoId.set(null);
        },
      });
    });
  }

  /** Reemplaza el despacho por uno nuevo con el estado actualizado (no se muta el objeto en el array). */
  private reemplazarDespacho(id: number, estado: DespachoLogistico['estado']): void {
    this.despachos.update((lista) => lista.map((d) => (d.id === id ? { ...d, estado } : d)));
  }
}
