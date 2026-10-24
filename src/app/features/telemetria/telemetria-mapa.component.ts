import { Component, OnInit, inject } from '@angular/core';
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

  despachos: DespachoLogistico[] = [];
  despachoSeleccionadoId: number | null = null;
  despachoSeleccionado?: DespachoLogistico;

  lecturasGps: TelemetriaGPS[] = [];
  lecturasTemp: TelemetriaTemperatura[] = [];

  cargandoDespachos = false;
  cargandoLecturas = false;
  errorCarga: string | null = null;
  errorLecturas: string | null = null;

  ngOnInit(): void {
    this.cargarDespachosEnTransito();
  }

  get esAnmatOSuperadmin(): boolean {
    const rol = this.session.rol();
    return rol === 'ANMAT' || rol === 'SUPERADMIN';
  }

  cargarDespachosEnTransito(): void {
    this.cargandoDespachos = true;
    this.errorCarga = null;

    this.api.getDespachosEnTransito().subscribe({
      next: (data) => {
        const orgId = this.session.organizacion()?.id;
        const rol = this.session.rol();

        if (rol === 'LABORATORIO' && orgId) {
          this.despachos = data.filter((d) => d.laboratorioId === orgId);
        } else {
          this.despachos = data;
        }

        this.cargandoDespachos = false;

        if (this.despachos.length > 0) {
          this.seleccionarDespacho(this.despachos[0].id);
        }
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargandoDespachos = false;
      },
    });
  }

  seleccionarDespacho(id: number): void {
    this.despachoSeleccionadoId = id;
    this.despachoSeleccionado = this.despachos.find((d) => d.id === id);
    if (this.despachoSeleccionado) {
      this.cargarLecturas(id);
    }
  }

  cargarLecturas(despachoId: number): void {
    this.cargandoLecturas = true;
    this.errorLecturas = null;

    forkJoin({
      gps: this.api.getLecturasGps(despachoId),
      temp: this.api.getLecturasTemperatura(despachoId),
    }).subscribe({
      next: ({ gps, temp }) => {
        this.lecturasGps = gps.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
        this.lecturasTemp = temp.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
        this.cargandoLecturas = false;
      },
      error: (err) => {
        this.errorLecturas = mensajeApi(err);
        this.cargandoLecturas = false;
      },
    });
  }

  recargarLecturas(): void {
    if (this.despachoSeleccionadoId) {
      this.cargarLecturas(this.despachoSeleccionadoId);
    }
  }

  get ultimaPosicion(): TelemetriaGPS | null {
    return this.lecturasGps.length > 0 ? this.lecturasGps[this.lecturasGps.length - 1] : null;
  }

  get ultimaTemperatura(): TelemetriaTemperatura | null {
    return this.lecturasTemp.length > 0 ? this.lecturasTemp[this.lecturasTemp.length - 1] : null;
  }
}
