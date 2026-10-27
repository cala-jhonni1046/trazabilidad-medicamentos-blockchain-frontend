import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { DespachosApiService } from './despachos-api.service';
import { DespachoLogistico, EventoCustodia } from './despachos.models';
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
  selector: 'app-despacho-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './despacho-detalle.component.html',
  styleUrls: ['./despacho-detalle.component.scss'],
})
export class DespachoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(DespachosApiService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);

  // El ID viene de la ruta una sola vez en ngOnInit: no es estado asíncrono repetido.
  despachoId!: number;

  // App zoneless: lo que se modifica en subscribe/next/error y se lee en la plantilla
  // debe ser signal; un campo común no repinta la vista.
  readonly despacho = signal<DespachoLogistico | null>(null);
  readonly eventos = signal<EventoCustodia[]>([]);

  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionEnCurso = signal(false);
  readonly errorAccion = signal<string | null>(null);

  readonly puedeVerTextosInternos = computed(() => {
    const rol = this.session.rol();
    if (rol === 'ANMAT' || rol === 'SUPERADMIN') return true;
    const despacho = this.despacho();
    if (rol === 'LABORATORIO' && despacho?.laboratorioId) {
      return this.session.organizacion()?.id === despacho.laboratorioId;
    }
    return false;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.despachoId = Number(idParam);
    if (this.despachoId) {
      this.cargarDetalle();
    } else {
      this.errorCarga.set('ID de despacho inválido.');
    }
  }

  cargarDetalle(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      despacho: this.api.getDespachoPorId(this.despachoId),
      eventos: this.api.getEventos(this.despachoId),
    }).subscribe({
      next: ({ despacho, eventos }) => {
        this.despacho.set(despacho);
        this.eventos.set([...eventos].sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento)));
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  iniciar(): void {
    const despachoActual = this.despacho();
    if (!despachoActual) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Iniciar traslado',
        message: `¿Deseas iniciar el traslado para el remito ${despachoActual.numeroRemito}?`,
        confirmText: 'Iniciar traslado',
        cancelText: 'Cancelar',
        isDanger: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCurso.set(true);
      this.errorAccion.set(null);

      this.api.iniciarDespacho(this.despachoId, { observaciones: 'Iniciado desde el detalle' }).subscribe({
        next: (actualizado) => {
          this.despacho.set(actualizado);
          this.accionEnCurso.set(false);
          // Recargar eventos para ver el evento generado
          this.api.getEventos(this.despachoId).subscribe((evts) => {
            this.eventos.set([...evts].sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento)));
          });
        },
        error: (err) => {
          this.errorAccion.set(mensajeApi(err));
          this.accionEnCurso.set(false);
        },
      });
    });
  }

  cancelar(): void {
    const despachoActual = this.despacho();
    if (!despachoActual) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar despacho',
        message: `¿Estás seguro de cancelar este despacho (${despachoActual.numeroRemito})?`,
        confirmText: 'Sí, cancelar',
        cancelText: 'Volver',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCurso.set(true);
      this.errorAccion.set(null);

      this.api.cancelarDespacho(this.despachoId, { observaciones: 'Cancelado desde el detalle' }).subscribe({
        next: (actualizado) => {
          this.despacho.set(actualizado);
          this.accionEnCurso.set(false);
          this.api.getEventos(this.despachoId).subscribe((evts) => {
            this.eventos.set([...evts].sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento)));
          });
        },
        error: (err) => {
          this.errorAccion.set(mensajeApi(err));
          this.accionEnCurso.set(false);
        },
      });
    });
  }
}
