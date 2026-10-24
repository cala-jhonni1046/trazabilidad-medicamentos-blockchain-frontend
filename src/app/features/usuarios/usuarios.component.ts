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
import { Router } from '@angular/router';

import { extraerFieldErrors, mensajeApi } from '../../core/http/api-error';
import { RolUsuario, SessionService } from '../../core/session/session.service';
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
import { UsuariosApiService } from './usuarios-api.service';
import { ROL_LABELS, ROLES_CREABLES, TODOS_LOS_ROLES, UsuarioDto } from './usuarios.models';

@Component({
  selector: 'app-usuarios',
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
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  private readonly api = inject(UsuariosApiService);
  private readonly session = inject(SessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  readonly rolesCreables = ROLES_CREABLES;
  readonly rolesFiltro = TODOS_LOS_ROLES;
  readonly columnas = ['email', 'rol', 'estado', 'fecha', 'acciones'];

  readonly usuarios = signal<UsuarioDto[]>([]);
  readonly cargando = signal(false);
  readonly errorLista = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorForm = signal<string | null>(null);
  /** IDs con una acción en curso (activar, desactivar o eliminar). */
  readonly procesando = signal<ReadonlySet<number>>(new Set());
  /** Último usuario ANMAT creado, para ofrecer el alta de su perfil de inspector. */
  readonly ultimoAnmat = signal<UsuarioDto | null>(null);

  readonly filtroRol = signal<RolUsuario | ''>('');
  readonly busqueda = signal('');

  readonly filtrados = computed(() => {
    const rol = this.filtroRol();
    const q = this.busqueda().trim().toLowerCase();
    return this.usuarios().filter(
      (u) => (!rol || u.rol === rol) && (!q || u.email.toLowerCase().includes(q)),
    );
  });

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(180)],
    }),
    rol: new FormControl<RolUsuario | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.cargar();
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  getRolLabel(rol: RolUsuario): string {
    return ROL_LABELS[rol] ?? rol;
  }

  cargar(): void {
    this.cargando.set(true);
    this.errorLista.set(null);
    this.api.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorLista.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  crear(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, rol } = this.form.getRawValue();
    this.enviando.set(true);
    this.errorForm.set(null);
    this.ultimoAnmat.set(null);

    this.api.crear({ email: email.trim(), rol: rol as RolUsuario, activo: true }).subscribe({
      next: (creado) => {
        this.enviando.set(false);
        this.usuarios.update((lista) => [...lista, creado]);
        // resetForm limpia también el estado 'enviado', para que no queden errores en rojo.
        this.formDir?.resetForm({ email: '', rol: null });
        if (creado.rol === 'ANMAT') {
          this.ultimoAnmat.set(creado);
        }
        this.snack.open(`Usuario ${creado.email} creado.`, 'Cerrar', { duration: 4000 });
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarErrorDeAlta(err);
      },
    });
  }

  alternarEstado(u: UsuarioDto): void {
    if (this.accionBloqueada(u)) return;
    const llamada = u.activo ? this.api.desactivar(u.id) : this.api.activar(u.id);
    this.marcarProcesando(u.id, true);
    llamada.subscribe({
      next: (actualizado) => {
        this.marcarProcesando(u.id, false);
        this.usuarios.update((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
      },
      error: (err) => {
        this.marcarProcesando(u.id, false);
        this.manejarErrorDeAccion(err);
      },
    });
  }

  eliminar(u: UsuarioDto): void {
    if (this.accionBloqueada(u)) return;
    const data: ConfirmDialogData = {
      title: 'Eliminar usuario',
      message: `¿Eliminar a ${u.email}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      isDanger: true,
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado !== true) return;
        this.marcarProcesando(u.id, true);
        this.api.eliminar(u.id).subscribe({
          next: () => {
            this.marcarProcesando(u.id, false);
            this.usuarios.update((lista) => lista.filter((x) => x.id !== u.id));
            if (this.ultimoAnmat()?.id === u.id) this.ultimoAnmat.set(null);
            this.snack.open('Usuario eliminado.', 'Cerrar', { duration: 4000 });
          },
          error: (err) => {
            this.marcarProcesando(u.id, false);
            this.manejarErrorDeAccion(err);
          },
        });
      });
  }

  crearPerfilInspector(u: UsuarioDto): void {
    this.router.navigate(['/inspectores'], { queryParams: { usuarioId: u.id } });
  }

  /** No se puede desactivar ni eliminar al usuario de la sesión ni a un SUPERADMIN. */
  accionBloqueada(u: UsuarioDto): boolean {
    return u.rol === 'SUPERADMIN' || u.id === this.session.usuario()?.id || this.estaProcesando(u.id);
  }

  motivoBloqueo(u: UsuarioDto): string {
    if (u.id === this.session.usuario()?.id) return 'No podés modificar tu propio usuario.';
    if (u.rol === 'SUPERADMIN') return 'El usuario SUPERADMIN no se modifica desde esta pantalla.';
    return '';
  }

  estaProcesando(id: number): boolean {
    return this.procesando().has(id);
  }

  private marcarProcesando(id: number, activo: boolean): void {
    this.procesando.update((actual) => {
      const copia = new Set(actual);
      if (activo) copia.add(id);
      else copia.delete(id);
      return copia;
    });
  }

  private mostrarErrorDeAlta(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 409) {
      // Email repetido: el mensaje del backend va junto al campo email.
      this.form.controls.email.setErrors({ servidor: mensajeApi(err) });
      this.form.controls.email.markAsTouched();
      return;
    }
    const campos = extraerFieldErrors(err);
    let hayCampo = false;
    for (const [campo, mensaje] of Object.entries(campos)) {
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

  private manejarErrorDeAccion(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.snack.open('El usuario ya no existe. Actualizamos la lista.', 'Cerrar', { duration: 5000 });
      this.cargar();
      return;
    }
    this.snack.open(mensajeApi(err), 'Cerrar', { duration: 7000 });
  }
}
