import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SessionService, RolUsuario } from '../../core/session/session.service';
import { getRoleHome } from '../../core/navigation/role-home';
import { mensajeApi } from '../../core/http/api-error';
import {
  InspectorApi,
  LoginApiService,
  OrganizacionApi,
  UsuarioApi,
} from './login-api.service';

export interface LoginRequestDTO {
  email: string;
  password: string;
  organizacionId: number | null;
}

export interface LoginResponseDTO {
  token?: string;
  usuario?: UsuarioApi;
  organizacion?: OrganizacionApi | null;
  inspector?: InspectorApi | null;
  id?: number;
  email?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export interface LoginFormControls {
  email: FormControl<string>;
  password: FormControl<string>;
  organizacionId: FormControl<number | null>;
}

const ROL_LABELS: Record<RolUsuario, string> = {
  SUPERADMIN: 'Sede Central (SUPERADMIN)',
  ANMAT: 'Inspector ANMAT',
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidor',
  FARMACIA: 'Farmacia',
  PACIENTE: 'Paciente',
};

const ROLES_CON_ORGANIZACION: RolUsuario[] = ['LABORATORIO', 'DISTRIBUIDOR', 'FARMACIA'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly api = inject(LoginApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);

  private readonly loginEndpoint = '/api/auth/login';

  readonly isDarkMode = signal(false);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly errorLogin = signal<string | null>(null);

  readonly usuarios = signal<UsuarioApi[]>([]);
  readonly organizaciones = signal<OrganizacionApi[]>([]);
  readonly emailActual = signal('');

  readonly loginForm: FormGroup<LoginFormControls> = this.fb.group({
    email: this.fb.nonNullable.control('', [Validators.required]),
    password: this.fb.nonNullable.control(''),
    organizacionId: this.fb.control<number | null>(null),
  });

  readonly usuariosActivos = computed(() => this.usuarios().filter((u) => u.activo));

  readonly usuarioDetectado = computed<UsuarioApi | null>(() => {
    const raw = this.emailActual().trim().toLowerCase();
    if (!raw) return null;
    const todos = this.usuarios();
    return (
      todos.find((u) => u.email.toLowerCase() === raw) ??
      todos.find((u) => u.email.toLowerCase().startsWith(raw)) ??
      null
    );
  });

  readonly necesitaOrganizacion = computed(() => {
    const rol = this.usuarioDetectado()?.rol;
    return !!rol && ROLES_CON_ORGANIZACION.includes(rol);
  });

  readonly organizacionesDisponibles = computed<OrganizacionApi[]>(() => {
    const rol = this.usuarioDetectado()?.rol;
    if (rol && ROLES_CON_ORGANIZACION.includes(rol)) {
      return this.organizaciones().filter((o) => o.tipo === rol);
    }
    if (rol && !ROLES_CON_ORGANIZACION.includes(rol)) {
      return [];
    }
    return this.organizaciones();
  });

  ngOnInit(): void {
    if (this.session.isAuthenticated()) {
      this.router.navigate([getRoleHome(this.session.rol())]);
      return;
    }

    this.loginForm.controls.email.valueChanges.subscribe((val) => {
      this.emailActual.set(val ?? '');
      this.errorLogin.set(null);
      const usuario = this.usuarioDetectado();
      if (usuario && ROLES_CON_ORGANIZACION.includes(usuario.rol)) {
        const orgsRol = this.organizaciones().filter((o) => o.tipo === usuario.rol);
        const actualId = this.loginForm.controls.organizacionId.value;
        if (!orgsRol.some((o) => o.id === actualId)) {
          this.loginForm.controls.organizacionId.setValue(orgsRol[0]?.id ?? null, {
            emitEvent: false,
          });
        }
      } else if (usuario) {
        this.loginForm.controls.organizacionId.setValue(null, { emitEvent: false });
      }
    });

    this.cargarDatosBackend();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('dark-theme');
  }

  getRolLabel(rol: RolUsuario): string {
    return ROL_LABELS[rol] ?? rol;
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.document.body.classList.toggle('dark-theme', next);
  }

  cargarDatosBackend(): void {
    this.cargando.set(true);
    forkJoin({
      usuarios: this.api.getUsuarios(),
      organizaciones: this.api.getOrganizaciones().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ usuarios, organizaciones }) => {
        this.usuarios.set(usuarios);
        this.organizaciones.set(organizaciones);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorLogin.set(mensajeApi(err));
      },
    });
  }

  validateForm(): boolean {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (!this.validateForm() || this.enviando()) {
      this.errorLogin.set('Seleccioná un usuario para ingresar.');
      return;
    }

    const raw = this.loginForm.getRawValue();
    const payload: LoginRequestDTO = {
      email: raw.email.trim(),
      password: raw.password,
      organizacionId: raw.organizacionId,
    };

    this.errorLogin.set(null);
    this.enviando.set(true);

    this.http
      .post<LoginResponseDTO>(this.loginEndpoint, payload)
      .pipe(catchError(() => of(null)))
      .subscribe((authResponse) => {
        if (authResponse?.usuario) {
          this.resolverContextoYEntrar(authResponse.usuario, payload.organizacionId);
          return;
        }
        if (authResponse?.id && authResponse?.email && authResponse?.rol) {
          this.resolverContextoYEntrar(
            {
              id: authResponse.id,
              email: authResponse.email,
              rol: authResponse.rol,
              activo: authResponse.activo ?? true,
            },
            payload.organizacionId,
          );
          return;
        }
        this.autenticarConUsuariosBackend(payload.email, payload.organizacionId);
      });
  }

  private autenticarConUsuariosBackend(
    emailInput: string,
    organizacionId: number | null,
  ): void {
    if (this.usuarios().length === 0) {
      forkJoin({
        usuarios: this.api.getUsuarios(),
        organizaciones: this.api.getOrganizaciones().pipe(catchError(() => of([]))),
      }).subscribe({
        next: ({ usuarios, organizaciones }) => {
          this.usuarios.set(usuarios);
          this.organizaciones.set(organizaciones);
          this.buscarUsuarioYEntrar(emailInput, organizacionId);
        },
        error: (err) => {
          this.enviando.set(false);
          this.errorLogin.set(mensajeApi(err));
        },
      });
      return;
    }

    this.buscarUsuarioYEntrar(emailInput, organizacionId ?? this.loginForm.controls.organizacionId.value);
  }

  private buscarUsuarioYEntrar(emailInput: string, organizacionId: number | null): void {
    const normalizado = emailInput.trim().toLowerCase();
    const activos = this.usuariosActivos();

    const usuario =
      activos.find((u) => u.email.toLowerCase() === normalizado) ??
      activos.find((u) => u.email.toLowerCase().startsWith(normalizado)) ??
      null;

    if (!usuario) {
      this.enviando.set(false);
      this.errorLogin.set('Seleccioná un usuario activo de la lista para ingresar.');
      return;
    }

    this.resolverContextoYEntrar(usuario, organizacionId);
  }

  private resolverContextoYEntrar(
    usuario: UsuarioApi,
    organizacionId: number | null,
  ): void {
    let orgSeleccionada: OrganizacionApi | null = null;
    if (ROLES_CON_ORGANIZACION.includes(usuario.rol)) {
      const orgsRol = this.organizaciones().filter((o) => o.tipo === usuario.rol);
      orgSeleccionada =
        orgsRol.find((o) => o.id === organizacionId) ?? orgsRol[0] ?? null;

      if (!orgSeleccionada) {
        this.enviando.set(false);
        this.errorLogin.set(
          `No hay organizaciones registradas del tipo ${usuario.rol}. Pedí a Sede Central que la registre.`,
        );
        return;
      }
    }

    if (usuario.rol === 'ANMAT') {
      this.api.getInspectorPorUsuario(usuario.id).subscribe({
        next: (inspector: InspectorApi) => {
          this.finalizarSesion(usuario, null, inspector);
        },
        error: (err) => {
          this.enviando.set(false);
          const msg = mensajeApi(err);
          if (msg.toLowerCase().includes('404') || msg.toLowerCase().includes('no encontr')) {
            this.errorLogin.set(
              'Este usuario no tiene perfil de inspector. Pedí a Sede Central que lo registre.',
            );
          } else {
            this.errorLogin.set(msg);
          }
        },
      });
      return;
    }

    this.finalizarSesion(usuario, orgSeleccionada, null);
  }

  private finalizarSesion(
    usuario: UsuarioApi,
    org: OrganizacionApi | null,
    inspector: InspectorApi | null,
  ): void {
    this.session.iniciarSesion(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, activo: usuario.activo },
      org ? { id: org.id, cuit: org.cuit, nombre: org.nombre, tipo: org.tipo } : null,
      inspector ?? null,
    );
    this.enviando.set(false);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl !== '/login') {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate([getRoleHome(usuario.rol)]);
    }
  }
}
