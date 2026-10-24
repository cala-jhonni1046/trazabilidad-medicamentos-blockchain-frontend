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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

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
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { InspectoresApiService, UsuarioLite } from './inspectores-api.service';
import {
  EstadoInspector,
  InspectorDto,
  InspectorRequest,
  dniValidator,
  normalizarDni,
} from './inspectores.models';

@Component({
  selector: 'app-inspectores',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
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
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './inspectores.component.html',
  styleUrl: './inspectores.component.scss',
})
export class InspectoresComponent implements OnInit {
  private readonly api = inject(InspectoresApiService);
  private readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  readonly columnas = ['inspector', 'legajo', 'dni', 'alta', 'estado', 'acciones'];

  readonly inspectores = signal<InspectorDto[]>([]);
  readonly usuarios = signal<UsuarioLite[]>([]);
  readonly cargando = signal(false);
  readonly errorLista = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  readonly procesando = signal<ReadonlySet<number>>(new Set());

  /** Modo del alta: elegir un usuario ANMAT existente o crearlo en el mismo paso. */
  readonly modoNuevoUsuario = signal(false);
  /** Usuario ANMAT creado en este paso cuyo perfil de inspector falló y falta reintentar. */
  readonly usuarioSinPerfil = signal<UsuarioLite | null>(null);

  // Tarjetas de métricas
  readonly cadenasActivas = signal<number | null>(null);
  readonly organizacionesTotal = signal<number | null>(null);
  readonly errorMetricas = signal(false);

  readonly habilitados = computed(
    () => this.inspectores().filter((i) => i.estado === 'HABILITADO').length,
  );

  readonly candidatos = computed(() => {
    const conPerfil = new Set(this.inspectores().map((i) => i.usuarioId));
    return this.usuarios().filter((u) => u.rol === 'ANMAT' && !conPerfil.has(u.id));
  });

  readonly form = new FormGroup({
    usuarioId: new FormControl<number | null>(null, [Validators.required]),
    emailNuevo: new FormControl('', { nonNullable: true }),
    nombreCompleto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    legajoOficial: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    dni: new FormControl('', { nonNullable: true, validators: [dniValidator()] }),
    emailInstitucional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(180)],
    }),
    jefeAutorizador: new FormControl(this.jefeSugerido(), {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarMetricas();
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorLista.set(null);
    forkJoin({ inspectores: this.api.listar(), usuarios: this.api.listarUsuarios() }).subscribe({
      next: ({ inspectores, usuarios }) => {
        this.inspectores.set(inspectores);
        this.usuarios.set(usuarios);
        this.cargando.set(false);
        this.preseleccionarUsuario();
      },
      error: (err) => {
        this.errorLista.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  cargarMetricas(): void {
    this.errorMetricas.set(false);
    forkJoin({
      enlaces: this.api.listarEnlacesActivos(),
      organizaciones: this.api.listarOrganizaciones(),
    }).subscribe({
      next: ({ enlaces, organizaciones }) => {
        this.cadenasActivas.set(enlaces.length);
        this.organizacionesTotal.set(organizaciones.length);
      },
      error: () => this.errorMetricas.set(true),
    });
  }

  cambiarModo(nuevoUsuario: boolean): void {
    this.modoNuevoUsuario.set(nuevoUsuario);
    const { usuarioId, emailNuevo } = this.form.controls;
    if (nuevoUsuario) {
      usuarioId.clearValidators();
      usuarioId.setValue(null);
      emailNuevo.setValidators([Validators.required, Validators.email, Validators.maxLength(180)]);
    } else {
      emailNuevo.clearValidators();
      emailNuevo.setValue('');
      usuarioId.setValidators([Validators.required]);
    }
    usuarioId.updateValueAndValidity();
    emailNuevo.updateValueAndValidity();
  }

  guardar(): void {
    if (this.enviando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorForm.set(null);

    if (this.modoNuevoUsuario()) {
      this.enviando.set(true);
      const email = this.form.controls.emailNuevo.value.trim();
      this.api.crearUsuario({ email, rol: 'ANMAT', activo: true }).subscribe({
        next: (usuario) => {
          this.usuarios.update((l) => [...l, usuario]);
          this.crearPerfil(usuario, true);
        },
        error: (err) => {
          this.enviando.set(false);
          this.mostrarError(err, 'emailNuevo');
        },
      });
      return;
    }

    const usuario = this.usuarios().find((u) => u.id === this.form.controls.usuarioId.value);
    if (!usuario) {
      this.form.controls.usuarioId.setErrors({ servidor: 'Elegí un usuario ANMAT de la lista.' });
      return;
    }
    this.enviando.set(true);
    this.crearPerfil(usuario, false);
  }

  alternarEstado(i: InspectorDto): void {
    if (this.estaProcesando(i.id)) return;
    const nuevo: EstadoInspector = i.estado === 'HABILITADO' ? 'SUSPENDIDO' : 'HABILITADO';
    if (nuevo === 'SUSPENDIDO') {
      const data: ConfirmDialogData = {
        title: 'Suspender inspector',
        message: `¿Suspender a ${i.nombreCompleto}? No podrá aprobar enlaces ni resolver cuarentenas hasta que lo habilites de nuevo.`,
        confirmText: 'Suspender',
        cancelText: 'Cancelar',
        isDanger: true,
      };
      this.dialog
        .open(ConfirmDialogComponent, { data })
        .afterClosed()
        .subscribe((ok) => {
          if (ok === true) this.cambiarEstado(i, nuevo);
        });
      return;
    }
    this.cambiarEstado(i, nuevo);
  }

  eliminar(i: InspectorDto): void {
    if (this.estaProcesando(i.id)) return;
    const data: ConfirmDialogData = {
      title: 'Eliminar inspector',
      message: `¿Eliminar el perfil de ${i.nombreCompleto}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((ok) => {
        if (ok !== true) return;
        this.marcarProcesando(i.id, true);
        this.api.eliminar(i.id).subscribe({
          next: () => {
            this.marcarProcesando(i.id, false);
            this.inspectores.update((l) => l.filter((x) => x.id !== i.id));
            this.snack.open('Perfil de inspector eliminado.', 'Cerrar', { duration: 4000 });
          },
          error: (err) => {
            this.marcarProcesando(i.id, false);
            this.manejarErrorDeAccion(err);
          },
        });
      });
  }

  estaProcesando(id: number): boolean {
    return this.procesando().has(id);
  }

  private crearPerfil(usuario: UsuarioLite, usuarioRecienCreado: boolean): void {
    const v = this.form.getRawValue();
    const dni = normalizarDni(v.dni);
    const body: InspectorRequest = {
      usuarioId: usuario.id,
      nombreCompleto: v.nombreCompleto.trim(),
      legajoOficial: v.legajoOficial.trim(),
      dni: dni || null,
      emailInstitucional: v.emailInstitucional.trim() || null,
      jefeAutorizador: v.jefeAutorizador.trim(),
      estado: 'HABILITADO',
    };
    this.api.crear(body).subscribe({
      next: (creado) => {
        this.enviando.set(false);
        this.usuarioSinPerfil.set(null);
        this.inspectores.update((l) => [...l, creado]);
        this.cambiarModo(false);
        this.formDir?.resetForm({
          usuarioId: null,
          emailNuevo: '',
          nombreCompleto: '',
          legajoOficial: '',
          dni: '',
          emailInstitucional: '',
          jefeAutorizador: this.jefeSugerido(),
        });
        this.snack.open(`Inspector ${creado.nombreCompleto} dado de alta.`, 'Cerrar', {
          duration: 4000,
        });
      },
      error: (err) => {
        this.enviando.set(false);
        if (usuarioRecienCreado) {
          // El usuario quedó creado: no se pierde. Se pasa al modo "usuario existente" con
          // ese usuario preseleccionado para reintentar solo el perfil.
          this.usuarioSinPerfil.set(usuario);
          this.cambiarModo(false);
          this.form.controls.usuarioId.setValue(usuario.id);
        }
        this.mostrarError(err, 'usuarioId');
      },
    });
  }

  private cambiarEstado(i: InspectorDto, estado: EstadoInspector): void {
    this.marcarProcesando(i.id, true);
    const body: InspectorRequest = {
      usuarioId: i.usuarioId,
      nombreCompleto: i.nombreCompleto,
      legajoOficial: i.legajoOficial ?? null,
      dni: i.dni ?? null,
      emailInstitucional: i.emailInstitucional ?? null,
      jefeAutorizador: i.jefeAutorizador ?? null,
      estado,
    };
    this.api.actualizar(i.id, body).subscribe({
      next: (actualizado) => {
        this.marcarProcesando(i.id, false);
        this.inspectores.update((l) => l.map((x) => (x.id === actualizado.id ? actualizado : x)));
      },
      error: (err) => {
        this.marcarProcesando(i.id, false);
        this.manejarErrorDeAccion(err);
      },
    });
  }

  private mostrarError(err: unknown, campoUsuario: 'usuarioId' | 'emailNuevo'): void {
    if (err instanceof HttpErrorResponse && (err.status === 409 || err.status === 404)) {
      const mensaje = mensajeApi(err);
      // El legajo duplicado va junto al campo legajo; el resto (usuario) junto al selector.
      const control = mensaje.toLowerCase().includes('legajo')
        ? this.form.controls.legajoOficial
        : this.form.controls[campoUsuario];
      control.setErrors({ servidor: mensaje });
      control.markAsTouched();
      if (err.status === 404) this.cargar();
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
      this.snack.open('El inspector ya no existe. Actualizamos la lista.', 'Cerrar', {
        duration: 5000,
      });
      this.cargar();
      return;
    }
    // 409: tiene enlaces o cuarentenas asociadas; se muestra el mensaje del backend.
    this.snack.open(mensajeApi(err), 'Cerrar', { duration: 8000 });
  }

  /** Si F01 mandó ?usuarioId=, lo deja elegido cuando está disponible. */
  private preseleccionarUsuario(): void {
    const param = this.route.snapshot.queryParamMap.get('usuarioId');
    if (!param) return;
    const id = Number(param);
    if (this.candidatos().some((u) => u.id === id)) {
      this.form.controls.usuarioId.setValue(id);
    } else {
      this.snack.open(
        'El usuario indicado no está disponible: ya tiene perfil de inspector o no es ANMAT.',
        'Cerrar',
        { duration: 6000 },
      );
    }
  }

  private jefeSugerido(): string {
    return this.session.usuario()?.email ?? '';
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
