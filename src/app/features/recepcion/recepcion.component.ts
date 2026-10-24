import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { RecepcionApiService } from './recepcion-api.service';
import { RecepcionFarmaciaRequest, RecepcionFarmaciaResponse, EstadoConformidad } from './recepcion.models';
import { DespachoLogistico, EventoCustodia } from '../despachos/despachos.models';
import { TelemetriaTemperatura } from '../telemetria/telemetria.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { mensajeApi, extraerFieldErrors } from '../../core/http/api-error';

@Component({
  selector: 'app-recepcion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './recepcion.component.html',
  styleUrls: ['./recepcion.component.scss'],
})
export class RecepcionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RecepcionApiService);
  readonly session = inject(SessionService);

  form!: FormGroup;
  despachos: DespachoLogistico[] = [];
  despachoSeleccionado?: DespachoLogistico;
  eventosCustodia: EventoCustodia[] = [];
  temperaturas: TelemetriaTemperatura[] = [];
  ultimaTemperatura: TelemetriaTemperatura | null = null;
  huboExcursionTermica = false;

  recepcionesHistorial: RecepcionFarmaciaResponse[] = [];

  cargando = false;
  cargandoFicha = false;
  enviando = false;
  errorCarga: string | null = null;
  errorFicha: string | null = null;
  errorEnvio: string | null = null;
  fieldErrors: Record<string, string> = {};
  recepcionExitosa: RecepcionFarmaciaResponse | null = null;

  filtroBusqueda = '';

  readonly displayedColumnsHistorial: string[] = [
    'numeroComprobante',
    'remito',
    'fechaHora',
    'estadoConformidad',
    'cadenaFrio',
    'farmaceutico',
    'observaciones',
  ];

  ngOnInit(): void {
    this.iniciarFormulario();
    this.cargarDatos();
  }

  private iniciarFormulario(): void {
    const fechaActual = new Date().toISOString().slice(0, 16);
    this.form = this.fb.group({
      despachoId: [null, [Validators.required]],
      numeroComprobante: ['', [Validators.required, Validators.maxLength(50)]],
      fechaHoraRecepcion: [fechaActual],
      farmaceuticoResponsable: [this.session.usuario()?.email || '', [Validators.maxLength(100)]],
      cadenaFrioIntacta: [true, [Validators.required]],
      estadoConformidad: ['CONFORME', [Validators.required]],
      observaciones: ['', [Validators.maxLength(500)]],
    });

    // Monitorear cambio de cadenaFrioIntacta
    this.form.get('cadenaFrioIntacta')?.valueChanges.subscribe((intacta: boolean) => {
      if (!intacta && this.form.get('estadoConformidad')?.value === 'CONFORME') {
        this.form.patchValue({ estadoConformidad: 'OBSERVADA' });
      }
    });
  }

  cargarDatos(): void {
    const farmaciaId = this.session.organizacion()?.id;
    if (!farmaciaId) {
      this.errorCarga = 'No se ha detectado una organización farmacia en la sesión.';
      return;
    }

    this.cargando = true;
    this.errorCarga = null;

    forkJoin({
      despachos: this.api.getDespachosEnTransito(farmaciaId),
      historial: this.api.getRecepciones(farmaciaId),
    }).subscribe({
      next: ({ despachos, historial }) => {
        this.despachos = despachos;
        this.recepcionesHistorial = historial.sort((a, b) =>
          (b.fechaHoraRecepcion || '').localeCompare(a.fechaHoraRecepcion || ''),
        );
        this.cargando = false;

        if (this.despachos.length > 0) {
          this.seleccionarDespacho(this.despachos[0].id);
        }
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargando = false;
      },
    });
  }

  get despachosFiltrados(): DespachoLogistico[] {
    const term = this.filtroBusqueda.trim().toLowerCase();
    if (!term) return this.despachos;
    return this.despachos.filter(
      (d) =>
        (d.numeroRemito && d.numeroRemito.toLowerCase().includes(term)) ||
        (d.codigoLote && d.codigoLote.toLowerCase().includes(term)) ||
        (d.medicamentoNombre && d.medicamentoNombre.toLowerCase().includes(term)),
    );
  }

  seleccionarDespacho(id: number): void {
    this.despachoSeleccionado = this.despachos.find((d) => d.id === id);
    this.form.patchValue({ despachoId: id });
    this.recepcionExitosa = null;
    this.errorEnvio = null;

    if (this.despachoSeleccionado) {
      this.cargarAuditoriaDespacho(id);
    }
  }

  cargarAuditoriaDespacho(despachoId: number): void {
    this.cargandoFicha = true;
    this.errorFicha = null;

    forkJoin({
      eventos: this.api.getEventos(despachoId),
      temps: this.api.getTemperaturas(despachoId),
    }).subscribe({
      next: ({ eventos, temps }) => {
        this.eventosCustodia = eventos.sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento));
        this.temperaturas = temps.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

        this.ultimaTemperatura = this.temperaturas.length > 0 ? this.temperaturas[this.temperaturas.length - 1] : null;
        this.huboExcursionTermica = this.temperaturas.some((t) => t.alertaExcursion === true);

        // Si hubo excursión, preseleccionar cadena de frío no intacta y cambiar CONFORME a OBSERVADA
        if (this.huboExcursionTermica) {
          this.form.patchValue({
            cadenaFrioIntacta: false,
            estadoConformidad: 'OBSERVADA',
          });
        } else {
          this.form.patchValue({
            cadenaFrioIntacta: true,
            estadoConformidad: 'CONFORME',
          });
        }

        this.cargandoFicha = false;
      },
      error: (err) => {
        this.errorFicha = mensajeApi(err);
        this.cargandoFicha = false;
      },
    });
  }

  get puedeMarcarConforme(): boolean {
    const intacta = this.form.get('cadenaFrioIntacta')?.value === true;
    return intacta && !this.huboExcursionTermica;
  }

  guardarRecepcion(): void {
    if (this.form.invalid || !this.despachoSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }

    const farmaciaId = this.session.organizacion()?.id;
    if (!farmaciaId) return;

    this.enviando = true;
    this.errorEnvio = null;
    this.fieldErrors = {};
    this.recepcionExitosa = null;

    const val = this.form.value;
    const request: RecepcionFarmaciaRequest = {
      numeroComprobante: String(val.numeroComprobante).trim(),
      fechaHoraRecepcion: val.fechaHoraRecepcion ? new Date(val.fechaHoraRecepcion).toISOString() : new Date().toISOString(),
      farmaciaId,
      farmaceuticoResponsable: val.farmaceuticoResponsable ? String(val.farmaceuticoResponsable).trim() : null,
      despachoLogisticoId: this.despachoSeleccionado.id,
      estadoConformidad: val.estadoConformidad as EstadoConformidad,
      cadenaFrioIntacta: !!val.cadenaFrioIntacta,
      observaciones: val.observaciones ? String(val.observaciones).trim() : null,
    };

    this.api.crearRecepcion(request).subscribe({
      next: (res) => {
        this.enviando = false;
        this.recepcionExitosa = res;
        this.cargarDatos();
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio = mensajeApi(err);
        this.fieldErrors = extraerFieldErrors(err);
      },
    });
  }
}
