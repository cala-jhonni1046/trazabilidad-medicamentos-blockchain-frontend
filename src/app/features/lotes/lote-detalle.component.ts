import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { LotesApiService } from './lotes-api.service';
import { Lote, UnidadResumen } from './lotes.models';

@Component({
  selector: 'app-lote-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './lote-detalle.component.html',
  styleUrl: './lote-detalle.component.scss',
})
export class LoteDetalleComponent implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly loteId = signal<number | null>(null);
  readonly lote = signal<Lote | null>(null);
  readonly unidades = signal<UnidadResumen[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly errorGeneracion = signal<boolean>(false);
  readonly generando = signal(false);
  readonly eliminando = signal(false);

  readonly busquedaQr = signal('');

  readonly puedeEliminar = computed(() => {
    const rol = this.session.rol();
    return rol === 'LABORATORIO' || rol === 'SUPERADMIN';
  });

  readonly columnasUnidades = ['codigoQr', 'estado', 'fechaCreacion', 'acciones'];

  readonly unidadesFiltradas = computed(() => {
    const q = this.busquedaQr().trim().toLowerCase();
    if (!q) return this.unidades();
    return this.unidades().filter((u) => u.codigoQr.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const errParam = this.route.snapshot.queryParamMap.get('errorGeneracion');
    if (errParam === '1' || errParam === 'true') {
      this.errorGeneracion.set(true);
    }

    if (idParam) {
      const id = Number(idParam);
      this.loteId.set(id);
      this.cargar(id);
    } else {
      this.error.set('No se proporcionó un ID de lote válido.');
      this.cargando.set(false);
    }
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.api.obtenerPorId(id).subscribe({
      next: (lote) => {
        this.lote.set(lote);
        this.cargarUnidades(id);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  cargarUnidades(id: number): void {
    this.api.obtenerUnidadesPorLote(id).subscribe({
      next: (units) => {
        this.unidades.set(units);
        this.cargando.set(false);
      },
      error: (err) => {
        this.snack.open(`Error al cargar unidades: ${mensajeApi(err)}`, 'Cerrar', {
          duration: 4000,
        });
        this.cargando.set(false);
      },
    });
  }

  onBusquedaQr(event: Event): void {
    this.busquedaQr.set((event.target as HTMLInputElement).value);
  }

  generarUnidades(cantidad = 50): void {
    const id = this.loteId();
    if (!id || this.generando()) return;

    this.generando.set(true);
    this.api.generarUnidades(id, cantidad).subscribe({
      next: (res) => {
        this.generando.set(false);
        this.errorGeneracion.set(false);
        const msg =
          res.advertencia ||
          `Se generaron ${res.unidades.length} unidades QR para este lote.`;
        this.snack.open(msg, 'Cerrar', { duration: 5000 });
        this.cargarUnidades(id);
      },
      error: (err) => {
        this.generando.set(false);
        this.snack.open(
          `No se pudieron generar las unidades: ${mensajeApi(err)}`,
          'Cerrar',
          { duration: 8000 },
        );
      },
    });
  }

  eliminarLote(): void {
    const current = this.lote();
    if (!current || !this.puedeEliminar() || this.eliminando()) return;

    const data: ConfirmDialogData = {
      title: 'Eliminar lote',
      message: `¿Eliminar el lote "${current.codigoLote}"? Esta acción cancelará las unidades asociadas y no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((ok) => {
        if (ok !== true) return;
        this.eliminando.set(true);
        this.api.eliminar(current.id).subscribe({
          next: () => {
            this.eliminando.set(false);
            this.snack.open(`Lote "${current.codigoLote}" eliminado.`, 'Cerrar', {
              duration: 4000,
            });
            this.router.navigate(['/lotes']);
          },
          error: (err: unknown) => {
            this.eliminando.set(false);
            this.snack.open(mensajeApi(err), 'Cerrar', { duration: 8000 });
          },
        });
      });
  }

  formatoRango(l: Lote): string {
    if (l.tempMin != null && l.tempMax != null) {
      return `${l.tempMin}°C a ${l.tempMax}°C`;
    }
    if (l.tempMin != null) return `Min ${l.tempMin}°C`;
    if (l.tempMax != null) return `Max ${l.tempMax}°C`;
    return 'Temperatura ambiente (sin rango)';
  }
}

export { LoteDetalleComponent as LoteDetallePage };
