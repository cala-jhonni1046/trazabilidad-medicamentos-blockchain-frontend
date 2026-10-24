import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EnlaceDto } from '../enlaces/enlaces.models';
import { Lote } from '../lotes/lotes.models';
import { LaboratorioApiService } from './laboratorio-api.service';
import {
  CuarentenaAbierta,
  DespachoLaboratorio,
  MetricaLaboratorio,
  MonitoreoLoteFila,
} from './laboratorio.models';

@Component({
  selector: 'app-laboratorio-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './laboratorio-dashboard.component.html',
  styleUrl: './laboratorio-dashboard.component.scss',
})
export class LaboratorioDashboardComponent implements OnInit {
  private readonly api = inject(LaboratorioApiService);
  private readonly session = inject(SessionService);

  readonly lab = computed(() => this.session.organizacion());
  readonly labId = computed(() => this.session.organizacion()?.id);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly metricas = signal<MetricaLaboratorio[]>([]);
  readonly filas = signal<MonitoreoLoteFila[]>([]);

  readonly columnas = [
    'codigo',
    'medicamento',
    'rango',
    'patente',
    'transportista',
    'farmaciaDestino',
    'estado',
    'inspectorAprobador',
    'acciones',
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    const labId = this.labId();
    const fallos: string[] = [];

    const tolerar = <T>(nombre: string, obs$: Observable<T[]>): Observable<T[] | null> =>
      obs$.pipe(
        catchError((err: unknown) => {
          fallos.push(`${nombre}: ${mensajeApi(err)}`);
          return of(null);
        }),
      );

    forkJoin({
      lotes: tolerar('Lotes', this.api.getLotes(labId)),
      despachos: tolerar('Despachos', this.api.getDespachos(labId)),
      enlaces: tolerar('Enlaces CUIT', this.api.getEnlaces(labId)),
      cuarentenas: tolerar('Cuarentenas', this.api.getCuarentenasAbiertas()),
    }).subscribe({
      next: ({ lotes, despachos, enlaces, cuarentenas }) => {
        // Filtrar por laboratorio de la sesión
        const lotesLab = (lotes ?? []).filter((l) => !labId || l.laboratorioId === labId);
        const despachosLab = (despachos ?? []).filter((d) => {
          if (!labId) return true;
          return lotesLab.some((l) => l.id === d.loteId);
        });
        const enlacesLab = (enlaces ?? []).filter((e) => !labId || e.laboratorioId === labId);
        const cuarentenasLab = (cuarentenas ?? []).filter((c) =>
          lotesLab.some((l) => l.id === c.loteId),
        );

        // Construir métricas
        this.metricas.set([
          {
            titulo: 'Lotes registrados',
            valor: lotes !== null ? lotesLab.length : null,
            detalle: 'Total producidos por el laboratorio',
            icono: 'inventory_2',
          },
          {
            titulo: 'Lotes en tránsito',
            valor:
              lotes !== null
                ? lotesLab.filter((l) => l.estado === 'EN_TRANSITO').length
                : null,
            detalle: 'En ruta hacia destino',
            icono: 'local_shipping',
          },
          {
            titulo: 'En cuarentena',
            valor:
              lotes !== null || cuarentenas !== null
                ? lotesLab.filter(
                    (l) =>
                      l.estado === 'EN_CUARENTENA' ||
                      cuarentenasLab.some((c) => c.loteId === l.id && c.estado === 'ABIERTA'),
                  ).length
                : null,
            detalle: 'Retenidos preventivamente',
            icono: 'warning',
          },
          {
            titulo: 'Enlaces CUIT activos',
            valor:
              enlaces !== null
                ? enlacesLab.filter((e) => e.estado === 'ACTIVO').length
                : null,
            detalle: 'Red habilitada por ANMAT',
            icono: 'link',
          },
        ]);

        // Construir filas de monitoreo unificadas
        const despachosMap = new Map<number, DespachoLaboratorio>();
        for (const d of despachosLab) {
          despachosMap.set(d.loteId, d);
        }

        const cuarentenasMap = new Map<number, CuarentenaAbierta>();
        for (const c of cuarentenasLab) {
          if (c.estado === 'ABIERTA') {
            cuarentenasMap.set(c.loteId, c);
          }
        }

        // Asociar primer enlace activo disponible
        const primerEnlace = enlacesLab.find((e) => e.estado === 'ACTIVO') ?? null;

        const filasConstruidas: MonitoreoLoteFila[] = lotesLab.map((lote) => {
          const desp = despachosMap.get(lote.id) ?? null;
          const quar = cuarentenasMap.get(lote.id) ?? null;
          return {
            lote,
            cantidadUnidades: null,
            despacho: desp,
            enlace: primerEnlace,
            cuarentenaAbierta: quar,
          };
        });

        this.filas.set(filasConstruidas);
        if (fallos.length > 0) {
          this.error.set(`Consultas parciales no disponibles: ${fallos.join(' · ')}`);
        }
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  formatoRango(l: Lote): string {
    if (l.tempMin != null && l.tempMax != null) {
      return `${l.tempMin}°C - ${l.tempMax}°C`;
    }
    return 'Ambiente';
  }
}

export { LaboratorioDashboardComponent as LaboratorioDashboardPage };
