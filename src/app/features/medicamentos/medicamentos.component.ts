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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
import { MedicamentosApiService } from './medicamentos-api.service';
import { MedicamentoDto, MedicamentoRequest } from './medicamentos.models';

export type FiltroFrio = 'TODOS' | 'CON_FRIO' | 'SIN_FRIO';

@Component({
  selector: 'app-medicamentos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './medicamentos.component.html',
  styleUrl: './medicamentos.component.scss',
})
export class MedicamentosComponent implements OnInit {
  private readonly api = inject(MedicamentosApiService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  /** LABORATORIO y SUPERADMIN pueden editar; ANMAT solo consulta */
  readonly puedeEditar = computed(() => {
    const rol = this.session.rol();
    return rol === 'LABORATORIO' || rol === 'SUPERADMIN';
  });

  readonly columnas = computed(() =>
    this.puedeEditar()
      ? ['nombre', 'principioActivo', 'requiereCadenaFrio', 'acciones']
      : ['nombre', 'principioActivo', 'requiereCadenaFrio'],
  );

  readonly medicamentos = signal<MedicamentoDto[]>([]);
  readonly cargando = signal(false);
  readonly errorLista = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly editando = signal<MedicamentoDto | null>(null);
  readonly procesando = signal<ReadonlySet<number>>(new Set());

  readonly busqueda = signal('');
  readonly filtroFrio = signal<FiltroFrio>('TODOS');

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const frio = this.filtroFrio();

    return this.medicamentos().filter((m) => {
      if (frio === 'CON_FRIO' && !m.requiereCadenaFrio) return false;
      if (frio === 'SIN_FRIO' && m.requiereCadenaFrio) return false;

      if (!q) return true;
      return (
        m.nombre.toLowerCase().includes(q) ||
        m.principioActivo.toLowerCase().includes(q)
      );
    });
  });

  readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    principioActivo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    requiereCadenaFrio: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorLista.set(null);
    this.api.listar().subscribe({
      next: (lista) => {
        this.medicamentos.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorLista.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  editar(m: MedicamentoDto): void {
    if (!this.puedeEditar()) return;
    this.editando.set(m);
    this.errorForm.set(null);
    this.form.reset({
      nombre: m.nombre,
      principioActivo: m.principioActivo,
      requiereCadenaFrio: m.requiereCadenaFrio,
    });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.errorForm.set(null);
    this.formDir?.resetForm({
      nombre: '',
      principioActivo: '',
      requiereCadenaFrio: false,
    });
  }

  guardar(): void {
    if (!this.puedeEditar() || this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, principioActivo, requiereCadenaFrio } = this.form.getRawValue();
    const body: MedicamentoRequest = {
      nombre: nombre.trim(),
      principioActivo: principioActivo.trim(),
      requiereCadenaFrio,
    };
    const actual = this.editando();

    this.enviando.set(true);
    this.errorForm.set(null);

    const call$ = actual
      ? this.api.actualizar(actual.id, body)
      : this.api.crear(body);

    call$.subscribe({
      next: (guardado) => {
        this.enviando.set(false);
        this.medicamentos.update((lista) =>
          actual
            ? lista.map((item) => (item.id === guardado.id ? guardado : item))
            : [...lista, guardado],
        );
        this.editando.set(null);
        this.formDir?.resetForm({
          nombre: '',
          principioActivo: '',
          requiereCadenaFrio: false,
        });
        this.snack.open(
          actual
            ? 'Medicamento actualizado.'
            : `Medicamento "${guardado.nombre}" registrado con éxito.`,
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

  eliminar(m: MedicamentoDto): void {
    if (!this.puedeEditar() || this.estaProcesando(m.id)) return;

    const data: ConfirmDialogData = {
      title: 'Eliminar medicamento',
      message: `¿Eliminar "${m.nombre}" (${m.principioActivo}) del catálogo? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    };

    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((ok) => {
        if (ok !== true) return;
        this.marcarProcesando(m.id, true);
        this.api.eliminar(m.id).subscribe({
          next: () => {
            this.marcarProcesando(m.id, false);
            this.medicamentos.update((lista) => lista.filter((item) => item.id !== m.id));
            if (this.editando()?.id === m.id) {
              this.cancelarEdicion();
            }
            this.snack.open('Medicamento eliminado del catálogo.', 'Cerrar', {
              duration: 4000,
            });
          },
          error: (err) => {
            this.marcarProcesando(m.id, false);
            this.manejarErrorDeBaja(err);
          },
        });
      });
  }

  estaProcesando(id: number): boolean {
    return this.procesando().has(id);
  }

  private mostrarErrorDeGuardado(err: unknown, actual: MedicamentoDto | null): void {
    if (err instanceof HttpErrorResponse && err.status === 404 && actual) {
      this.snack.open('El medicamento ya no existe. Actualizamos la lista.', 'Cerrar', {
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
    if (!hayCampo) {
      this.errorForm.set(mensajeApi(err));
    }
  }

  private manejarErrorDeBaja(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.snack.open('El medicamento ya no existe. Actualizamos la lista.', 'Cerrar', {
        duration: 5000,
      });
      this.cargar();
      return;
    }
    // 409: tiene lotes asociados; mensaje del backend
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

export { MedicamentosComponent as MedicamentosPage };
