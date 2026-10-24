import { Component, OnInit, inject } from '@angular/core';
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
import { DespachoLogistico, EstadoDespacho } from './despachos.models';
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

  despachos: DespachoLogistico[] = [];
  cargando = false;
  errorCarga: string | null = null;
  accionEnCursoId: number | null = null;
  errorAccion: string | null = null;

  filtroEstado: string = 'TODOS';
  filtroBusqueda: string = '';

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

  ngOnInit(): void {
    this.cargarDespachos();
  }

  cargarDespachos(): void {
    this.cargando = true;
    this.errorCarga = null;

    this.api.getDespachos().subscribe({
      next: (data) => {
        const orgId = this.session.organizacion()?.id;
        const rol = this.session.rol();

        // Si es LABORATORIO, filtrar por su laboratorio
        if (rol === 'LABORATORIO' && orgId) {
          this.despachos = data.filter((d) => d.laboratorioId === orgId);
        } else {
          this.despachos = data;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargando = false;
      },
    });
  }

  get despachosFiltrados(): DespachoLogistico[] {
    return this.despachos.filter((d) => {
      const cumpleEstado =
        this.filtroEstado === 'TODOS' || d.estado === this.filtroEstado;

      const termino = this.filtroBusqueda.trim().toLowerCase();
      const cumpleBusqueda =
        !termino ||
        (d.numeroRemito && d.numeroRemito.toLowerCase().includes(termino)) ||
        (d.codigoLote && d.codigoLote.toLowerCase().includes(termino)) ||
        (d.medicamentoNombre && d.medicamentoNombre.toLowerCase().includes(termino)) ||
        (d.distribuidorNombre && d.distribuidorNombre.toLowerCase().includes(termino)) ||
        (d.vehiculoPatente && d.vehiculoPatente.toLowerCase().includes(termino));

      return cumpleEstado && cumpleBusqueda;
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

      this.accionEnCursoId = despacho.id;
      this.errorAccion = null;

      this.api.iniciarDespacho(despacho.id, { observaciones: 'Despacho iniciado desde el panel' }).subscribe({
        next: (actualizado) => {
          despacho.estado = actualizado.estado;
          this.accionEnCursoId = null;
        },
        error: (err) => {
          this.errorAccion = mensajeApi(err);
          this.accionEnCursoId = null;
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

      this.accionEnCursoId = despacho.id;
      this.errorAccion = null;

      this.api.cancelarDespacho(despacho.id, { observaciones: 'Cancelado por el usuario' }).subscribe({
        next: (actualizado) => {
          despacho.estado = actualizado.estado;
          this.accionEnCursoId = null;
        },
        error: (err) => {
          this.errorAccion = mensajeApi(err);
          this.accionEnCursoId = null;
        },
      });
    });
  }
}
