import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { formatearCuit } from '../../shared/utils/cuit';
import { EnlacesApiService } from './enlaces-api.service';
import { EnlaceDto, urlSegura } from './enlaces.models';
import { PendientesEnlacesService } from './pendientes.store';
import {
  AccionEnlace,
  ResolverEnlaceDialogComponent,
  ResolverEnlaceDialogData,
  ResolverEnlaceDialogResult,
} from './resolver-enlace-dialog.component';

/** ANMAT: bandeja de solicitudes de enlace PENDIENTE para aprobar o rechazar. */
@Component({
  selector: 'app-pendientes-enlaces',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './pendientes-enlaces.component.html',
  styleUrl: './pendientes-enlaces.component.scss',
})
export class PendientesEnlacesComponent implements OnInit {
  private readonly api = inject(EnlacesApiService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly badge = inject(PendientesEnlacesService);

  readonly formatearCuit = formatearCuit;
  readonly urlSegura = urlSegura;

  readonly pendientes = signal<EnlaceDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly procesando = signal<ReadonlySet<number>>(new Set());

  /** El inspector sale de la sesión; sin inspector habilitado no se puede resolver. */
  readonly puedeResolver = this.session.puedeResolver;
  readonly motivoBloqueo = computed(() => {
    if (this.puedeResolver()) return '';
    return this.session.inspector()
      ? 'Tu perfil de inspector está suspendido: solo podés consultar.'
      : 'Tu sesión no tiene un perfil de inspector habilitado: solo podés consultar.';
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.listar({ estado: 'PENDIENTE' }).subscribe({
      next: (lista) => {
        // Un backend que ignorara el filtro devolvería todos: se vuelve a filtrar.
        const pendientes = lista.filter((e) => e.estado === 'PENDIENTE');
        this.pendientes.set(pendientes);
        this.badge.fijar(pendientes.length);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  estaProcesando(id: number): boolean {
    return this.procesando().has(id);
  }

  resolver(enlace: EnlaceDto, accion: AccionEnlace): void {
    const inspector = this.session.inspector();
    if (!this.puedeResolver() || !inspector || this.estaProcesando(enlace.id)) return;

    const data: ResolverEnlaceDialogData = { enlace, accion };
    this.dialog
      .open<ResolverEnlaceDialogComponent, ResolverEnlaceDialogData, ResolverEnlaceDialogResult>(
        ResolverEnlaceDialogComponent,
        { data },
      )
      .afterClosed()
      .subscribe((resultado) => {
        if (!resultado) return;
        const body = {
          inspectorId: inspector.id,
          numeroDisposicionANMAT: resultado.numeroDisposicionANMAT || null,
          documentoCertificadoUrl: resultado.documentoCertificadoUrl || null,
        };
        this.marcarProcesando(enlace.id, true);
        const llamada =
          accion === 'aprobar' ? this.api.aprobar(enlace.id, body) : this.api.rechazar(enlace.id, body);
        llamada.subscribe({
          next: () => {
            this.marcarProcesando(enlace.id, false);
            this.pendientes.update((l) => l.filter((e) => e.id !== enlace.id));
            this.badge.fijar(this.pendientes().length);
            this.snack.open(
              accion === 'aprobar' ? 'Solicitud aprobada: el enlace quedó ACTIVO.' : 'Solicitud rechazada.',
              'Cerrar',
              { duration: 4000 },
            );
          },
          error: (err) => {
            this.marcarProcesando(enlace.id, false);
            this.manejarError(err);
          },
        });
      });
  }

  private manejarError(err: unknown): void {
    // 409 (ya resuelto o inspector suspendido) y 404: se muestra el mensaje y se refresca la lista.
    if (err instanceof HttpErrorResponse && (err.status === 409 || err.status === 404)) {
      this.snack.open(mensajeApi(err), 'Cerrar', { duration: 8000 });
      this.cargar();
      return;
    }
    this.snack.open(mensajeApi(err), 'Cerrar', { duration: 8000 });
  }

  private marcarProcesando(id: number, activo: boolean): void {
    this.procesando.update((actual) => {
      const copia = new Set(actual);
      if (activo) copia.add(id);
      else copia.delete(id);
      return copia;
    });
  }
}
