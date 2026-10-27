import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CuarentenasApiService } from './cuarentenas-api.service';
import { CuarentenaDTO, LoteConTelemetria } from './cuarentenas.models';
import { cuarentenasAbiertasCount } from './cuarentenas.state';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { AbrirCuarentenaDialogComponent } from './abrir-cuarentena-dialog.component';
import { ResolverCuarentenaDialogComponent } from './resolver-cuarentena-dialog.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { mensajeApi } from '../../core/http/api-error';

@Component({
  selector: 'app-cuarentenas-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTabsModule,
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
    FechaArPipe,
  ],
  templateUrl: './cuarentenas-dashboard.component.html',
  styleUrls: ['./cuarentenas-dashboard.component.scss'],
})
export class CuarentenasDashboardComponent implements OnInit {
  private readonly api = inject(CuarentenasApiService);
  private readonly dialog = inject(MatDialog);
  readonly session = inject(SessionService);

  // App zoneless: lo que se modifica en subscribe/next/error y se lee en la plantilla
  // debe ser signal; un campo común no repinta la vista.
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly accionEnCurso = signal(false);
  readonly errorAccion = signal<string | null>(null);

  // Métricas superiores
  readonly cadenasActivasCount = signal(0);
  readonly lotesEnCuarentenaCount = signal(0);
  readonly reportesPendientesCount = signal(0);

  // Listas de datos
  readonly lotesConTelemetria = signal<LoteConTelemetria[]>([]);
  readonly historialCuarentenas = signal<CuarentenaDTO[]>([]);

  readonly puedeOperar = computed(() => this.session.puedeResolver());

  readonly displayedColumnsLotes: string[] = [
    'codigoLote',
    'trinomio',
    'temperatura',
    'estado',
    'acciones',
  ];

  readonly displayedColumnsHistorial: string[] = [
    'codigoCuarentena',
    'lote',
    'fechaInicio',
    'motivo',
    'estado',
    'inspector',
    'resolucionFinal',
  ];

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      lotes: this.api.getLotes().pipe(catchError(() => of([]))),
      cuarentenas: this.api.getCuarentenas().pipe(catchError(() => of([]))),
      despachos: this.api.getDespachos().pipe(catchError(() => of([]))),
      temperaturas: this.api.getTemperaturas().pipe(catchError(() => of([]))),
      enlaces: this.api.getEnlacesActivos().pipe(catchError(() => of([]))),
      reportes: this.api.getReportesPendientes().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ lotes, cuarentenas, despachos, temperaturas, enlaces, reportes }) => {
        this.historialCuarentenas.set([...cuarentenas].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)));

        const cuarentenasAbiertas = cuarentenas.filter((c) => c.estado === 'ABIERTA');
        this.lotesEnCuarentenaCount.set(cuarentenasAbiertas.length);
        cuarentenasAbiertasCount.set(cuarentenasAbiertas.length);
        this.cadenasActivasCount.set(enlaces.length);
        this.reportesPendientesCount.set(reportes.length);

        // Combinar datos por lote
        this.lotesConTelemetria.set(
          lotes.map((lote) => {
            // Despacho más reciente del lote
            const despachosLote = despachos.filter((d) => d.loteId === lote.id);
            const ultimoDespacho = despachosLote.length > 0 ? despachosLote[despachosLote.length - 1] : undefined;

            // Última lectura térmica del despacho
            let ultimaTemp: number | null = null;
            let alertaExcursion: boolean | null = null;

            if (ultimoDespacho) {
              const tempsDespacho = temperaturas
                .filter((t) => t.despachoLogisticoId === ultimoDespacho.id)
                .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

              if (tempsDespacho.length > 0) {
                const ult = tempsDespacho[tempsDespacho.length - 1];
                ultimaTemp = ult.temperatura;
                alertaExcursion = ult.alertaExcursion ?? null;
              }
            }

            // Enlace CUIT asociado al laboratorio
            const enlaceLote = enlaces.find((e) => e.laboratorioId === lote.laboratorioId);

            // Cuarentena abierta del lote si existe
            const cuaAbierta = cuarentenasAbiertas.find((c) => c.loteId === lote.id) || null;

            return {
              id: lote.id,
              codigoLote: lote.codigoLote,
              medicamentoNombre: lote.medicamentoNombre || 'Medicamento',
              laboratorioNombre: lote.laboratorioNombre || 'Laboratorio',
              laboratorioCuit: lote.laboratorioCuit || '—',
              estado: cuaAbierta ? 'EN_CUARENTENA' : (lote.estado || 'CREADO'),
              distribuidorNombre: enlaceLote?.distribuidorNombre,
              distribuidorCuit: enlaceLote?.distribuidorCuit,
              farmaciaNombre: enlaceLote?.farmaciaNombre,
              farmaciaCuit: enlaceLote?.farmaciaCuit,
              ultimaTemperatura: ultimaTemp,
              alertaExcursion: alertaExcursion,
              despachoId: ultimoDespacho?.id,
              cuarentenaAbierta: cuaAbierta,
            };
          }),
        );

        this.cargando.set(false);
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  abrirCuarentena(lote: LoteConTelemetria): void {
    const dialogRef = this.dialog.open(AbrirCuarentenaDialogComponent, {
      width: '560px',
      data: {
        loteId: lote.id,
        codigoLote: lote.codigoLote,
        medicamentoNombre: lote.medicamentoNombre,
        alertaExcursion: !!lote.alertaExcursion,
      },
    });

    dialogRef.afterClosed().subscribe((request) => {
      if (!request) return;

      this.accionEnCurso.set(true);
      this.errorAccion.set(null);

      this.api.abrirCuarentena(request).subscribe({
        next: () => {
          this.accionEnCurso.set(false);
          this.cargarDashboard();
        },
        error: (err) => {
          this.accionEnCurso.set(false);
          this.errorAccion.set(mensajeApi(err));
        },
      });
    });
  }

  resolverCuarentena(cuarentena: CuarentenaDTO, accion: 'LIBERAR' | 'MANTENER', codigoLote?: string): void {
    const dialogRef = this.dialog.open(ResolverCuarentenaDialogComponent, {
      width: '560px',
      data: {
        cuarentenaId: cuarentena.id,
        codigoCuarentena: cuarentena.codigoCuarentena,
        codigoLote: codigoLote || cuarentena.codigoLote,
        accion,
      },
    });

    dialogRef.afterClosed().subscribe((request) => {
      if (!request) return;

      this.accionEnCurso.set(true);
      this.errorAccion.set(null);

      const call =
        accion === 'LIBERAR'
          ? this.api.liberarCuarentena(cuarentena.id, request)
          : this.api.mantenerCuarentena(cuarentena.id, request);

      call.subscribe({
        next: () => {
          this.accionEnCurso.set(false);
          this.cargarDashboard();
        },
        error: (err) => {
          this.accionEnCurso.set(false);
          this.errorAccion.set(mensajeApi(err));
        },
      });
    });
  }
}
