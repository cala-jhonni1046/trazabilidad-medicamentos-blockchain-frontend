import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DistribucionApiService } from './distribucion-api.service';
import { DespachoLogistico } from './distribucion.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { mensajeApi } from '../../core/http/api-error';

@Component({
  selector: 'app-distribucion-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './distribucion-dashboard.component.html',
  styleUrls: ['./distribucion-dashboard.component.scss'],
})
export class DistribucionDashboardComponent implements OnInit {
  private readonly api = inject(DistribucionApiService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);

  cargas: DespachoLogistico[] = [];
  cargando = false;
  errorCarga: string | null = null;
  accionEnCursoId: number | null = null;
  errorAccion: string | null = null;

  readonly displayedColumns: string[] = [
    'numeroRemito',
    'loteMedicamento',
    'vehiculoPatente',
    'rangoFrio',
    'farmaciaDestino',
    'estado',
    'acciones',
  ];

  ngOnInit(): void {
    this.cargarCargasAsignadas();
  }

  cargarCargasAsignadas(): void {
    const org = this.session.organizacion();
    if (!org) {
      this.errorCarga = 'No se ha detectado una organización distribuidora en la sesión.';
      return;
    }

    this.cargando = true;
    this.errorCarga = null;

    this.api.getDespachosDistribuidor(org.id).subscribe({
      next: (data) => {
        this.cargas = data;
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargando = false;
      },
    });
  }

  asumirCustodia(despacho: DespachoLogistico): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Asumir custodia e iniciar traslado',
        message: `¿Confirmas que el vehículo ha cargado el lote del remito ${despacho.numeroRemito}? El estado pasará a EN_TRANSITO.`,
        confirmText: 'Asumir custodia',
        cancelText: 'Cancelar',
        isDanger: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCursoId = despacho.id;
      this.errorAccion = null;

      this.api
        .iniciarDespacho(despacho.id, {
          observaciones: `Custodia asumida por distribuidor ${this.session.organizacion()?.nombre || ''}`,
        })
        .subscribe({
          next: (actualizado) => {
            despacho.estado = actualizado.estado;
            this.accionEnCursoId = null;
          },
          error: (err) => {
            this.accionEnCursoId = null;
            this.errorAccion = mensajeApi(err);
          },
        });
    });
  }
}
