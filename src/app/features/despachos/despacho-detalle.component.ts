import { Component, OnInit, inject } from '@angular/core';
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

  despachoId!: number;
  despacho?: DespachoLogistico;
  eventos: EventoCustodia[] = [];

  cargando = false;
  errorCarga: string | null = null;
  accionEnCurso = false;
  errorAccion: string | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.despachoId = Number(idParam);
    if (this.despachoId) {
      this.cargarDetalle();
    } else {
      this.errorCarga = 'ID de despacho inválido.';
    }
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.errorCarga = null;

    forkJoin({
      despacho: this.api.getDespachoPorId(this.despachoId),
      eventos: this.api.getEventos(this.despachoId),
    }).subscribe({
      next: ({ despacho, eventos }) => {
        this.despacho = despacho;
        this.eventos = eventos.sort((a, b) =>
          a.fechaHoraEvento.localeCompare(b.fechaHoraEvento),
        );
        this.cargando = false;
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargando = false;
      },
    });
  }

  get puedeVerTextosInternos(): boolean {
    const rol = this.session.rol();
    if (rol === 'ANMAT' || rol === 'SUPERADMIN') return true;
    if (rol === 'LABORATORIO' && this.despacho?.laboratorioId) {
      return this.session.organizacion()?.id === this.despacho.laboratorioId;
    }
    return false;
  }

  iniciar(): void {
    if (!this.despacho) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Iniciar traslado',
        message: `¿Deseas iniciar el traslado para el remito ${this.despacho.numeroRemito}?`,
        confirmText: 'Iniciar traslado',
        cancelText: 'Cancelar',
        isDanger: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCurso = true;
      this.errorAccion = null;

      this.api.iniciarDespacho(this.despachoId, { observaciones: 'Iniciado desde el detalle' }).subscribe({
        next: (actualizado) => {
          this.despacho = actualizado;
          this.accionEnCurso = false;
          // Recargar eventos para ver el evento generado
          this.api.getEventos(this.despachoId).subscribe((evts) => {
            this.eventos = evts.sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento));
          });
        },
        error: (err) => {
          this.errorAccion = mensajeApi(err);
          this.accionEnCurso = false;
        },
      });
    });
  }

  cancelar(): void {
    if (!this.despacho) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar despacho',
        message: `¿Estás seguro de cancelar este despacho (${this.despacho.numeroRemito})?`,
        confirmText: 'Sí, cancelar',
        cancelText: 'Volver',
        isDanger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.accionEnCurso = true;
      this.errorAccion = null;

      this.api.cancelarDespacho(this.despachoId, { observaciones: 'Cancelado desde el detalle' }).subscribe({
        next: (actualizado) => {
          this.despacho = actualizado;
          this.accionEnCurso = false;
          this.api.getEventos(this.despachoId).subscribe((evts) => {
            this.eventos = evts.sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento));
          });
        },
        error: (err) => {
          this.errorAccion = mensajeApi(err);
          this.accionEnCurso = false;
        },
      });
    });
  }
}
