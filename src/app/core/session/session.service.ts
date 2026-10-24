import { Injectable, computed, signal } from '@angular/core';

export type RolUsuario =
  | 'SUPERADMIN'
  | 'ANMAT'
  | 'LABORATORIO'
  | 'DISTRIBUIDOR'
  | 'FARMACIA'
  | 'PACIENTE';

export interface UsuarioSession {
  id: number;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion?: string;
}

export interface OrganizacionSession {
  id: number;
  cuit: string;
  nombre: string;
  tipo: 'LABORATORIO' | 'DISTRIBUIDOR' | 'FARMACIA';
}

export interface InspectorSession {
  id: number;
  usuarioId: number;
  nombreCompleto: string;
  dni?: string;
  legajoOficial?: string;
  emailInstitucional?: string;
  fechaHoraAlta?: string;
  jefeAutorizador?: string;
  estado: 'HABILITADO' | 'SUSPENDIDO';
}

export interface SessionData {
  usuario: UsuarioSession;
  organizacion?: OrganizacionSession | null;
  inspector?: InspectorSession | null;
}

const STORAGE_KEY = 'medichain_session_simulada';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _session = signal<SessionData | null>(this.recuperarDeStorage());

  readonly session = this._session.asReadonly();
  readonly usuario = computed(() => this._session()?.usuario ?? null);
  readonly organizacion = computed(() => this._session()?.organizacion ?? null);
  readonly inspector = computed(() => this._session()?.inspector ?? null);
  readonly rol = computed(() => this._session()?.usuario?.rol ?? null);
  readonly isAuthenticated = computed(() => !!this._session()?.usuario);

  readonly puedeResolver = computed(() => {
    const insp = this._session()?.inspector;
    return !!insp && insp.estado !== 'SUSPENDIDO';
  });

  iniciarSesion(
    usuario: UsuarioSession,
    organizacion?: OrganizacionSession | null,
    inspector?: InspectorSession | null,
  ): void {
    const data: SessionData = {
      usuario,
      organizacion: organizacion ?? null,
      inspector: inspector ?? null,
    };
    this._session.set(data);
    this.guardarEnStorage(data);
  }

  cerrarSesion(): void {
    this._session.set(null);
    this.limpiarStorage();
  }

  private recuperarDeStorage(): SessionData | null {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SessionData;
    } catch {
      return null;
    }
  }

  private guardarEnStorage(data: SessionData): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // Si sessionStorage falla o está deshabilitado, la sesión sigue en memoria
    }
  }

  private limpiarStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignorar fallos de storage
    }
  }
}
