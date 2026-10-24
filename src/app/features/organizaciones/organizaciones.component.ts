import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { extraerFieldErrors, mensajeApi } from '../../core/http/api-error';
import { SessionService } from '../../core/session/session.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { cuitValidator, formatearCuit, normalizarCuit } from '../../shared/utils/cuit';
import { OrganizacionesApiService } from './organizaciones-api.service';
import {
  OrganizacionDto,
  TIPO_ICONS,
  TIPO_LABELS,
  TIPOS_ORGANIZACION,
  TipoOrganizacion,
} from './organizaciones.models';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
    FechaArPipe,
  ],
  templateUrl: './organizaciones.component.html',
  styleUrl: './organizaciones.component.scss',
})
export class OrganizacionesComponent implements OnInit {
  private readonly api = inject(OrganizacionesApiService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  readonly tipos = TIPOS_ORGANIZACION;
  readonly formatearCuit = formatearCuit;

  /** Solo el SUPERADMIN modifica; ANMAT consulta. */
  readonly puedeEditar = computed(() => this.session.rol() === 'SUPERADMIN');
  readonly columnas = computed(() =>
    this.puedeEditar()
      ? ['cuit', 'nombre', 'tipo', 'fecha', 'acciones']
      : ['cuit', 'nombre', 'tipo', 'fecha'],
  );

  readonly organizaciones = signal<OrganizacionDto[]>([]);
  readonly cargando = signal(false);
  readonly errorLista = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly editando = signal<OrganizacionDto | null>(null);
  readonly procesando = signal<ReadonlySet<number>>(new Set());

  readonly filtroTipo = signal<TipoOrganizacion | ''>('');
  readonly busqueda = signal('');

  readonly filtradas = computed(() => {
    const tipo = this.filtroTipo();
    const q = this.busqueda().trim().toLowerCase();
    const digitos = normalizarCuit(q);
    return this.organizaciones().filter((o) => {
      if (tipo && o.tipo !== tipo) return false;
      if (!q) return true;
      return o.nombre.toLowerCase().includes(q) || (digitos.length > 0 && o.cuit.includes(digitos));
    });
  });

  readonly form = new FormGroup({
    cuit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    tipo: new FormControl<TipoOrganizacion | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.cargar();
  }

  tipoLabel(tipo: TipoOrganizacion): string {
    return TIPO_LABELS[tipo] ?? tipo;
  }

  tipoIcon(tipo: TipoOrganizacion): string {
    return TIPO_ICONS[tipo] ?? 'business';
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorLista.set(null);
    this.api.listar().subscribe({
      next: (lista) => {
        this.organizaciones.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorLista.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  editar(o: OrganizacionDto): void {
    if (!this.puedeEditar()) return;
    this.editando.set(o);
    this.errorForm.set(null);
    this.form.reset({ cuit: formatearCuit(o.cuit), nombre: o.nombre, tipo: o.tipo });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.errorForm.set(null);
    this.formDir?.resetForm({ cuit: '', nombre: '', tipo: null });
  }

  guardar(): void {
    if (!this.puedeEditar() || this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { cuit, nombre, tipo } = this.form.getRawValue();
    // El CUIT se envía tal como lo escribió el usuario (solo sin espacios en los bordes);
    // el backend lo normaliza.
    const body = { cuit: cuit.trim(), nombre: nombre.trim(), tipo: tipo as TipoOrganizacion };
    const actual = this.editando();

    if (actual && actual.tipo !== body.tipo) {
      const data: ConfirmDialogData = {
        title: 'Cambiar el tipo de organización',
        message:
          'Esta organización puede participar en enlaces, lotes o despachos. ' +
          'Cambiar su tipo puede dejar esos datos inconsistentes. ¿Querés continuar?',
        confirmText: 'Cambiar tipo',
        cancelText: 'Cancelar',
        isDanger: true,
      };
      this.dialog
        .open(ConfirmDialogComponent, { data })
        .afterClosed()
        .subscribe((ok) => {
          if (ok === true) this.enviar(body, actual);
        });
      return;
    }
    this.enviar(body, actual);
  }

  eliminar(o: OrganizacionDto): void {
    if (!this.puedeEditar() || this.estaProcesando(o.id)) return;
    const data: ConfirmDialogData = {
      title: 'Eliminar organización',
      message: `¿Eliminar a ${o.nombre} (${formatearCuit(o.cuit)})? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((ok) => {
        if (ok !== true) return;
        this.marcarProcesando(o.id, true);
        this.api.eliminar(o.id).subscribe({
          next: () => {
            this.marcarProcesando(o.id, false);
            this.organizaciones.update((l) => l.filter((x) => x.id !== o.id));
            if (this.editando()?.id === o.id) this.cancelarEdicion();
            this.snack.open('Organización eliminada.', 'Cerrar', { duration: 4000 });
          },
          error: (err) => {
            this.marcarProcesando(o.id, false);
            this.manejarErrorDeAccion(err);
          },
        });
      });
  }

  estaProcesando(id: number): boolean {
    return this.procesando().has(id);
  }

  private enviar(
    body: { cuit: string; nombre: string; tipo: TipoOrganizacion },
    actual: OrganizacionDto | null,
  ): void {
    this.enviando.set(true);
    this.errorForm.set(null);
    const llamada = actual ? this.api.actualizar(actual.id, body) : this.api.crear(body);
    llamada.subscribe({
      next: (guardada) => {
        this.enviando.set(false);
        this.organizaciones.update((lista) =>
          actual ? lista.map((x) => (x.id === guardada.id ? guardada : x)) : [...lista, guardada],
        );
        this.editando.set(null);
        // resetForm limpia también el estado 'enviado', para que no queden errores en rojo.
        this.formDir?.resetForm({ cuit: '', nombre: '', tipo: null });
        this.snack.open(
          actual ? 'Organización actualizada.' : `Organización ${guardada.nombre} creada.`,
          'Cerrar',
          { duration: 4000 },
        );
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarErrorDeGuardado(err, actual);
      },
    });
  }

  private mostrarErrorDeGuardado(err: unknown, actual: OrganizacionDto | null): void {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      // CUIT duplicado: el mensaje del backend va junto al campo CUIT.
      this.form.controls.cuit.setErrors({ servidor: mensajeApi(err) });
      this.form.controls.cuit.markAsTouched();
      return;
    }
    if (err instanceof HttpErrorResponse && err.status === 404 && actual) {
      this.snack.open('La organización ya no existe. Actualizamos la lista.', 'Cerrar', {
        duration: 5000,
      });
      this.cancelarEdicion();
      this.cargar();
      return;
    }
    let hayCampo = false;
    for (const [campo, mensaje] of Object.entries(extraerFieldErrors(err))) {
      const control = this.form.get(campo);
      if (control) {
        control.setErrors({ servidor: mensaje });
        control.markAsTouched();
        hayCampo = true;
      }
    }
    if (!hayCampo) this.errorForm.set(mensajeApi(err));
  }

  private manejarErrorDeAccion(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.snack.open('La organización ya no existe. Actualizamos la lista.', 'Cerrar', {
        duration: 5000,
      });
      this.cargar();
      return;
    }
    // 409: tiene enlaces u otros registros asociados; se muestra el mensaje del backend.
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
