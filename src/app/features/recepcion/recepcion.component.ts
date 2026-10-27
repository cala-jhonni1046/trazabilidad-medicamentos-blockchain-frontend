import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

  // App zoneless: lo que se modifica en subscribe/next/error y se lee en la plantilla
  // debe ser signal; un campo común no repinta la vista.
  readonly despachos = signal<DespachoLogistico[]>([]);
  readonly despachoSeleccionado = signal<DespachoLogistico | null>(null);
  readonly eventosCustodia = signal<EventoCustodia[]>([]);
  readonly temperaturas = signal<TelemetriaTemperatura[]>([]);
  readonly huboExcursionTermica = signal(false);

  readonly recepcionesHistorial = signal<RecepcionFarmaciaResponse[]>([]);

  readonly cargando = signal(false);
  readonly cargandoFicha = signal(false);
  readonly enviando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly errorFicha = signal<string | null>(null);
  readonly errorEnvio = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly recepcionExitosa = signal<RecepcionFarmaciaResponse | null>(null);

  readonly filtroBusqueda = signal('');

  readonly ultimaTemperatura = computed<TelemetriaTemperatura | null>(() => {
    const lecturas = this.temperaturas();
    return lecturas.length > 0 ? lecturas[lecturas.length - 1] : null;
  });

  readonly despachosFiltrados = computed(() => {
    const term = this.filtroBusqueda().trim().toLowerCase();
    const despachos = this.despachos();
    if (!term) return despachos;
    return despachos.filter(
      (d) =>
        (d.numeroRemito && d.numeroRemito.toLowerCase().includes(term)) ||
        (d.codigoLote && d.codigoLote.toLowerCase().includes(term)) ||
        (d.medicamentoNombre && d.medicamentoNombre.toLowerCase().includes(term)),
    );
  });

  /** Depende del FormGroup (reactividad propia de Reactive Forms) y de huboExcursionTermica. */
  get puedeMarcarConforme(): boolean {
    const intacta = this.form.get('cadenaFrioIntacta')?.value === true;
    return intacta && !this.huboExcursionTermica();
  }

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
      this.errorCarga.set('No se ha detectado una organización farmacia en la sesión.');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set(null);

    forkJoin({
      despachos: this.api.getDespachosEnTransito(farmaciaId),
      historial: this.api.getRecepciones(farmaciaId),
    }).subscribe({
      next: ({ despachos, historial }) => {
        this.despachos.set(despachos);
        this.recepcionesHistorial.set(
          [...historial].sort((a, b) => (b.fechaHoraRecepcion || '').localeCompare(a.fechaHoraRecepcion || '')),
        );
        this.cargando.set(false);

        if (despachos.length > 0) {
          this.seleccionarDespacho(despachos[0].id);
        }
      },
      error: (err) => {
        this.errorCarga.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  seleccionarDespacho(id: number): void {
    const seleccionado = this.despachos().find((d) => d.id === id) ?? null;
    this.despachoSeleccionado.set(seleccionado);
    this.form.patchValue({ despachoId: id });
    this.recepcionExitosa.set(null);
    this.errorEnvio.set(null);

    if (seleccionado) {
      this.cargarAuditoriaDespacho(id);
    }
  }

  cargarAuditoriaDespacho(despachoId: number): void {
    this.cargandoFicha.set(true);
    this.errorFicha.set(null);

    forkJoin({
      eventos: this.api.getEventos(despachoId),
      temps: this.api.getTemperaturas(despachoId),
    }).subscribe({
      next: ({ eventos, temps }) => {
        this.eventosCustodia.set([...eventos].sort((a, b) => a.fechaHoraEvento.localeCompare(b.fechaHoraEvento)));
        const temperaturas = [...temps].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));
        this.temperaturas.set(temperaturas);

        const huboExcursion = temperaturas.some((t) => t.alertaExcursion === true);
        this.huboExcursionTermica.set(huboExcursion);

        // Si hubo excursión, preseleccionar cadena de frío no intacta y cambiar CONFORME a OBSERVADA
        if (huboExcursion) {
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

        this.cargandoFicha.set(false);
      },
      error: (err) => {
        this.errorFicha.set(mensajeApi(err));
        this.cargandoFicha.set(false);
      },
    });
  }

  guardarRecepcion(): void {
    const despachoSeleccionado = this.despachoSeleccionado();
    if (this.form.invalid || !despachoSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }

    const farmaciaId = this.session.organizacion()?.id;
    if (!farmaciaId) return;

    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.fieldErrors.set({});
    this.recepcionExitosa.set(null);

    const val = this.form.value;
    const request: RecepcionFarmaciaRequest = {
      numeroComprobante: String(val.numeroComprobante).trim(),
      fechaHoraRecepcion: val.fechaHoraRecepcion ? new Date(val.fechaHoraRecepcion).toISOString() : new Date().toISOString(),
      farmaciaId,
      farmaceuticoResponsable: val.farmaceuticoResponsable ? String(val.farmaceuticoResponsable).trim() : null,
      despachoLogisticoId: despachoSeleccionado.id,
      estadoConformidad: val.estadoConformidad as EstadoConformidad,
      cadenaFrioIntacta: !!val.cadenaFrioIntacta,
      observaciones: val.observaciones ? String(val.observaciones).trim() : null,
    };

    this.api.crearRecepcion(request).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.recepcionExitosa.set(res);
        this.cargarDatos();
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorEnvio.set(mensajeApi(err));
        this.fieldErrors.set(extraerFieldErrors(err));
      },
    });
  }
}
