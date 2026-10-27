import { Component, OnInit, inject, signal } from '@angular/core';
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

  // App zoneless: lo que se modifica en subscribe/next/error y se lee en la plantilla
  // debe ser signal; un campo común no repinta la vista.
  readonly cargas = signal<DespachoLogistico[]>([]);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionEnCursoId = signal<number | null>(null);
  readonly errorAccion = signal<string | null>(null);

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
      this.errorCarga.set('No se ha detectado una organización distribuidora en la sesión.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set(null);

    this.api.getDespachosDistribuidor(org.id).subscribe({
      next: (data) => {
        this.cargas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargando.set(false);
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

      this.accionEnCursoId.set(despacho.id);
      this.errorAccion.set(null);

      this.api
        .iniciarDespacho(despacho.id, {
          observaciones: `Custodia asumida por distribuidor ${this.session.organizacion()?.nombre || ''}`,
        })
        .subscribe({
          next: (actualizado) => {
            this.cargas.update((lista) =>
              lista.map((d) => (d.id === despacho.id ? { ...d, estado: actualizado.estado } : d)),
            );
            this.accionEnCursoId.set(null);
          },
          error: (err) => {
            this.accionEnCursoId.set(null);
            this.errorAccion.set(mensajeApi(err));
          },
        });
    });
  }
}
