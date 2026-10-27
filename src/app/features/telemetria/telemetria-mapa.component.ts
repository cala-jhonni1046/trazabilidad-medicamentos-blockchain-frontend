import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { TelemetriaApiService } from './telemetria-api.service';
import { TelemetriaGPS, TelemetriaTemperatura } from './telemetria.models';
import { DespachoLogistico } from '../despachos/despachos.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { GpsMapComponent } from './gps-map.component';
import { TemperaturaChartComponent } from './temperatura-chart.component';
import { SimuladorSensorComponent } from './simulador-sensor.component';
import { mensajeApi } from '../../core/http/api-error';

@Component({
  selector: 'app-telemetria-mapa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    GpsMapComponent,
    TemperaturaChartComponent,
    SimuladorSensorComponent,
  ],
  templateUrl: './telemetria-mapa.component.html',
  styleUrls: ['./telemetria-mapa.component.scss'],
})
export class TelemetriaMapaComponent implements OnInit {
  private readonly api = inject(TelemetriaApiService);
  readonly session = inject(SessionService);

  // App zoneless: todo estado que se lee en la plantilla y se modifica dentro de un
  // subscribe/next/error/finalize debe ser signal; un campo común no repinta la vista.
  readonly despachos = signal<DespachoLogistico[]>([]);
  readonly despachoSeleccionadoId = signal<number | null>(null);
  readonly despachoSeleccionado = signal<DespachoLogistico | null>(null);

  readonly lecturasGps = signal<TelemetriaGPS[]>([]);
  readonly lecturasTemp = signal<TelemetriaTemperatura[]>([]);

  readonly cargandoDespachos = signal(false);
  readonly cargandoLecturas = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly errorLecturas = signal<string | null>(null);

  readonly esAnmatOSuperadmin = computed(() => {
    const rol = this.session.rol();
    return rol === 'ANMAT' || rol === 'SUPERADMIN';
  });

  readonly ultimaPosicion = computed<TelemetriaGPS | null>(() => {
    const lecturas = this.lecturasGps();
    return lecturas.length > 0 ? lecturas[lecturas.length - 1] : null;
  });

  readonly ultimaTemperatura = computed<TelemetriaTemperatura | null>(() => {
    const lecturas = this.lecturasTemp();
    return lecturas.length > 0 ? lecturas[lecturas.length - 1] : null;
  });

  ngOnInit(): void {
    this.cargarDespachosEnTransito();
  }

  cargarDespachosEnTransito(): void {
    this.cargandoDespachos.set(true);
    this.errorCarga.set(null);

    this.api.getDespachosEnTransito().subscribe({
      next: (data) => {
        const orgId = this.session.organizacion()?.id;
        const rol = this.session.rol();

        const despachos = rol === 'LABORATORIO' && orgId ? data.filter((d) => d.laboratorioId === orgId) : data;
        this.despachos.set(despachos);
        this.cargandoDespachos.set(false);

        if (despachos.length > 0) {
          this.seleccionarDespacho(despachos[0].id);
        }
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargandoDespachos.set(false);
      },
    });
  }

  seleccionarDespacho(id: number): void {
    this.despachoSeleccionadoId.set(id);
    const seleccionado = this.despachos().find((d) => d.id === id) ?? null;
    this.despachoSeleccionado.set(seleccionado);
    if (seleccionado) {
      this.cargarLecturas(id);
    }
  }

  cargarLecturas(despachoId: number): void {
    this.cargandoLecturas.set(true);
    this.errorLecturas.set(null);

    forkJoin({
      gps: this.api.getLecturasGps(despachoId),
      temp: this.api.getLecturasTemperatura(despachoId),
    }).subscribe({
      next: ({ gps, temp }) => {
        this.lecturasGps.set([...gps].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)));
        this.lecturasTemp.set([...temp].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)));
        this.cargandoLecturas.set(false);
      },
      error: (err) => {
        this.errorLecturas.set(mensajeApi(err));
        this.cargandoLecturas.set(false);
      },
    });
  }

  recargarLecturas(): void {
    const id = this.despachoSeleccionadoId();
    if (id) {
      this.cargarLecturas(id);
    }
  }
}
