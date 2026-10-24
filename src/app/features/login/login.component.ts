import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { SessionService, RolUsuario } from '../../core/session/session.service';
import { getRoleHome } from '../../core/navigation/role-home';
import { mensajeApi } from '../../core/http/api-error';
import {
  LoginApiService,
  UsuarioApi,
  OrganizacionApi,
  InspectorApi,
} from './login-api.service';

const ROL_LABELS: Record<RolUsuario, string> = {
  SUPERADMIN: 'Sede Central (SUPERADMIN)',
  ANMAT: 'Inspector ANMAT',
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidor',
  FARMACIA: 'Farmacia',
  PACIENTE: 'Paciente',
};

const ROL_ICONS: Record<RolUsuario, string> = {
  SUPERADMIN: 'admin_panel_settings',
  ANMAT: 'verified_user',
  LABORATORIO: 'science',
  DISTRIBUIDOR: 'local_shipping',
  FARMACIA: 'local_pharmacy',
  PACIENTE: 'person',
};

const ROLES_CON_ORGANIZACION: RolUsuario[] = ['LABORATORIO', 'DISTRIBUIDOR', 'FARMACIA'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly api = inject(LoginApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly cargandoOrg = signal(false);
  readonly cargandoInspector = signal(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly errorOrg = signal<string | null>(null);
  readonly errorInspector = signal<string | null>(null);

  readonly usuarios = signal<UsuarioApi[]>([]);
  readonly organizaciones = signal<OrganizacionApi[]>([]);
  readonly inspectorResuelto = signal<InspectorApi | null>(null);
  readonly inspectorSuspendido = signal(false);

  readonly usuarioSeleccionado = signal<UsuarioApi | null>(null);
  readonly organizacionSeleccionada = signal<OrganizacionApi | null>(null);

  readonly rolLabels = ROL_LABELS;
  readonly rolIcons = ROL_ICONS;

  readonly usuariosActivos = computed(() => this.usuarios().filter((u) => u.activo));

  readonly organizacionesFiltradas = computed(() => {
    const rol = this.usuarioSeleccionado()?.rol;
    if (!rol || !ROLES_CON_ORGANIZACION.includes(rol)) return [];
    return this.organizaciones().filter((o) => o.tipo === rol);
  });

  readonly necesitaOrganizacion = computed(() => {
    const rol = this.usuarioSeleccionado()?.rol;
    return !!rol && ROLES_CON_ORGANIZACION.includes(rol);
  });

  readonly puedeIngresar = computed(() => {
    if (!this.usuarioSeleccionado()) return false;
    if (this.necesitaOrganizacion() && !this.organizacionSeleccionada()) return false;
    if (this.cargandoInspector()) return false;
    return true;
  });

  ngOnInit(): void {
    // Si ya hay sesión, redirigir al inicio del rol
    if (this.session.isAuthenticated()) {
      this.router.navigate([getRoleHome(this.session.rol())]);
      return;
    }
    this.cargarUsuarios();
    this.cargarOrganizaciones();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);
    this.api.getUsuarios().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorGeneral.set(mensajeApi(err));
        this.cargando.set(false);
      },
    });
  }

  cargarOrganizaciones(): void {
    this.api.getOrganizaciones().subscribe({
      next: (lista) => this.organizaciones.set(lista),
      error: () => {
        // No bloqueamos el flujo si las organizaciones fallan al inicio
        this.organizaciones.set([]);
      },
    });
  }

  onUsuarioChange(usuario: UsuarioApi | null): void {
    this.usuarioSeleccionado.set(usuario);
    this.organizacionSeleccionada.set(null);
    this.inspectorResuelto.set(null);
    this.inspectorSuspendido.set(false);
    this.errorOrg.set(null);
    this.errorInspector.set(null);

    if (usuario?.rol === 'ANMAT') {
      this.resolverInspector(usuario.id);
    }
  }

  onOrganizacionChange(org: OrganizacionApi | null): void {
    this.organizacionSeleccionada.set(org);
    this.errorOrg.set(null);
  }

  private resolverInspector(usuarioId: number): void {
    this.cargandoInspector.set(true);
    this.errorInspector.set(null);
    this.api.getInspectorPorUsuario(usuarioId).subscribe({
      next: (inspector) => {
        this.inspectorResuelto.set(inspector);
        this.inspectorSuspendido.set(inspector.estado === 'SUSPENDIDO');
        this.cargandoInspector.set(false);
      },
      error: (err) => {
        const msg = mensajeApi(err);
        if (msg.toLowerCase().includes('404') || msg.toLowerCase().includes('no encontr')) {
          this.errorInspector.set(
            'Este usuario no tiene perfil de inspector. Pedí a Sede Central que lo registre.',
          );
        } else {
          this.errorInspector.set(msg);
        }
        this.inspectorResuelto.set(null);
        this.cargandoInspector.set(false);
      },
    });
  }

  ingresar(): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario || !this.puedeIngresar()) return;

    const org = this.organizacionSeleccionada();
    const inspector = this.inspectorResuelto();

    // Verificar que si necesita organización, esté seleccionada
    if (this.necesitaOrganizacion() && !org) {
      this.errorOrg.set('Debés seleccionar una organización para ingresar.');
      return;
    }

    this.session.iniciarSesion(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, activo: usuario.activo },
      org ? { id: org.id, cuit: org.cuit, nombre: org.nombre, tipo: org.tipo } : null,
      inspector ? inspector : null,
    );

    this.router.navigate([getRoleHome(usuario.rol)]);
  }

  getRolLabel(rol: RolUsuario): string {
    return ROL_LABELS[rol] ?? rol;
  }

  getRolIcon(rol: RolUsuario): string {
    return ROL_ICONS[rol] ?? 'person';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparar(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}