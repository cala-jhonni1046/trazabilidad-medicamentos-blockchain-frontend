import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { extraerFieldErrors, mensajeApi } from '../../core/http/api-error';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { cuitValidator, formatearCuit } from '../../shared/utils/cuit';
import { EnlacesApiService } from './enlaces-api.service';
import {
  EnlaceDto,
  EnlaceRequest,
  OrganizacionLite,
  Resolucion,
  SLOTS,
  SlotConfig,
  SlotKey,
  TIPO_LABELS,
} from './enlaces.models';

const URL_HTTP = /^https?:\/\/\S+$/i;

/**
 * Formulario único para pedir un enlace CUIT (laboratorio, distribuidor y farmacia).
 * Lo usan /enlaces/nuevo (SUPERADMIN, laboratorio editable) y /enlaces/solicitud
 * (LABORATORIO, laboratorio fijo con la organización de la sesión).
 */
@Component({
  selector: 'app-enlace-solicitud-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ErrorAlertComponent,
  ],
  templateUrl: './enlace-solicitud-form.component.html',
  styleUrl: './enlace-solicitud-form.component.scss',
})
export class EnlaceSolicitudFormComponent implements OnInit {
  private readonly api = inject(EnlacesApiService);

  /** Si viene, el laboratorio queda fijo (no se busca ni se edita). */
  readonly laboratorioFijo = input<OrganizacionLite | null>(null);
  readonly creada = output<EnlaceDto>();

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  readonly slots = SLOTS;
  readonly tipoLabels = TIPO_LABELS;
  readonly formatearCuit = formatearCuit;

  readonly resoluciones = signal<Record<SlotKey, Resolucion>>({
    laboratorio: { estado: 'vacio' },
    distribuidor: { estado: 'vacio' },
    farmacia: { estado: 'vacio' },
  });
  readonly enviando = signal(false);
  readonly errorEnvio = signal<string | null>(null);

  readonly todosResueltos = computed(() =>
    SLOTS.every((s) => this.resoluciones()[s.key].estado === 'ok'),
  );

  readonly form = new FormGroup({
    laboratorio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
    distribuidor: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
    farmacia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
    numeroDisposicionANMAT: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    documentoCertificadoUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500), Validators.pattern(URL_HTTP)],
    }),
  });

  ngOnInit(): void {
    this.aplicarLaboratorioFijo();
  }

  esFijo(slot: SlotConfig): boolean {
    return slot.key === 'laboratorio' && this.laboratorioFijo() !== null;
  }

  /** Al editar un CUIT se descarta la búsqueda previa de ese campo. */
  alEditar(slot: SlotConfig): void {
    this.setResolucion(slot.key, { estado: 'vacio' });
  }

  /**
   * Busca la organización del CUIT. Al salir del campo solo busca si todavía no hay búsqueda;
   * el botón "Buscar" (forzar) también reintenta después de un error.
   */
  buscar(slot: SlotConfig, forzar = false): void {
    if (this.esFijo(slot)) return;
    const actual = this.resoluciones()[slot.key].estado;
    if (actual === 'buscando' || actual === 'ok' || (actual === 'error' && !forzar)) return;
    const control = this.form.controls[slot.key];
    if (control.invalid) {
      control.markAsTouched();
      return;
    }
    const cuit = control.value.trim();
    this.setResolucion(slot.key, { estado: 'buscando' });
    this.api.buscarOrganizacionPorCuit(cuit).subscribe({
      next: (org) => {
        if (org.tipo !== slot.tipo) {
          this.setResolucion(slot.key, {
            estado: 'error',
            mensaje: `Ese CUIT corresponde a ${TIPO_LABELS[org.tipo].toLowerCase()} (${org.nombre}), pero acá se necesita un ${slot.tipoLabel}.`,
          });
          return;
        }
        this.setResolucion(slot.key, { estado: 'ok', org });
      },
      error: (err) => {
        const noExiste = err instanceof HttpErrorResponse && err.status === 404;
        this.setResolucion(slot.key, {
          estado: 'error',
          mensaje: noExiste
            ? 'Ese CUIT no está registrado; pedí a Sede Central que lo registre.'
            : mensajeApi(err),
        });
      },
    });
  }

  enviar(): void {
    if (this.enviando()) return;
    if (this.form.invalid || !this.todosResueltos()) {
      this.form.markAllAsTouched();
      return;
    }
    const r = this.resoluciones();
    const v = this.form.getRawValue();
    // Solo se envían los IDs y los datos del certificado. Nunca estado, inspector ni fechas.
    const body: EnlaceRequest = {
      laboratorioId: r.laboratorio.org!.id,
      distribuidorId: r.distribuidor.org!.id,
      farmaciaId: r.farmacia.org!.id,
      numeroDisposicionANMAT: v.numeroDisposicionANMAT.trim() || null,
      documentoCertificadoUrl: v.documentoCertificadoUrl.trim() || null,
    };
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.api.crear(body).subscribe({
      next: (enlace) => {
        this.enviando.set(false);
        this.limpiar();
        this.creada.emit(enlace);
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarErrorDeEnvio(err);
      },
    });
  }

  private limpiar(): void {
    this.formDir?.resetForm({
      laboratorio: '',
      distribuidor: '',
      farmacia: '',
      numeroDisposicionANMAT: '',
      documentoCertificadoUrl: '',
    });
    this.resoluciones.set({
      laboratorio: { estado: 'vacio' },
      distribuidor: { estado: 'vacio' },
      farmacia: { estado: 'vacio' },
    });
    this.aplicarLaboratorioFijo();
  }

  private aplicarLaboratorioFijo(): void {
    const lab = this.laboratorioFijo();
    if (!lab) {
      this.form.controls.laboratorio.enable();
      return;
    }
    this.form.controls.laboratorio.setValue(formatearCuit(lab.cuit));
    this.form.controls.laboratorio.disable();
    this.setResolucion('laboratorio', { estado: 'ok', org: lab });
  }

  private setResolucion(key: SlotKey, valor: Resolucion): void {
    this.resoluciones.update((actual) => ({ ...actual, [key]: valor }));
  }

  private mostrarErrorDeEnvio(err: unknown): void {
    let hayCampo = false;
    for (const [campo, mensaje] of Object.entries(extraerFieldErrors(err))) {
      const control = this.form.get(campo);
      if (control) {
        control.setErrors({ servidor: mensaje });
        control.markAsTouched();
        hayCampo = true;
      }
    }
    // 404, 400 de tipo incorrecto y 409 muestran el mensaje del backend.
    if (!hayCampo || (err instanceof HttpErrorResponse && err.status !== 400)) {
      this.errorEnvio.set(mensajeApi(err));
    }
  }
}
