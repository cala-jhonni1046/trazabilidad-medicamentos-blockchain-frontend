import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

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
  organizacionId?: number | null;
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
  token?: string | null;
  usuario: UsuarioSession;
  organizacion?: OrganizacionSession | null;
  inspector?: InspectorSession | null;
}

const STORAGE_KEY = 'medichain_session';
/** Clave de la sesión simulada anterior: se elimina para no dejar sesiones sin token. */
const STORAGE_KEY_ANTERIOR = 'medichain_session_simulada';

/** Respuesta de POST /api/auth/login y GET /api/auth/me. */
export interface AuthResponse {
  token?: string | null;
  tipo?: string;
  expiraEnSegundos?: number;
  usuario: UsuarioSession;
  organizacion?: OrganizacionSession | null;
  inspector?: InspectorSession | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly _session = signal<SessionData | null>(this.recuperarDeStorage());

  readonly session = this._session.asReadonly();
  readonly token = computed(() => this._session()?.token ?? null);
  /** Aviso para mostrar en el login (por ejemplo, "Tu sesión venció"). */
  readonly aviso = signal<string | null>(null);
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
    token?: string | null,
  ): void {
    const data: SessionData = {
      token: token ?? null,
      usuario,
      organizacion: organizacion ?? null,
      inspector: inspector ?? null,
    };
    this._session.set(data);
    this.guardarEnStorage(data);
  }

  /** Inicia sesión con la respuesta del backend (login). */
  iniciarDesdeRespuesta(r: AuthResponse): void {
    this.aviso.set(null);
    this.iniciarSesion(r.usuario, r.organizacion ?? null, r.inspector ?? null, r.token ?? null);
  }

  cerrarSesion(aviso?: string): void {
    this._session.set(null);
    this.limpiarStorage();
    this.aviso.set(aviso ?? null);
  }

  /**
   * Valida la sesión guardada contra GET /api/auth/me y refresca usuario, organización e inspector.
   * Si el backend responde 4xx (token vencido o usuario desactivado) cierra la sesión.
   * Si el backend no responde (caída de red o 5xx) conserva la sesión: el próximo pedido decide.
   */
  validarConBackend(): Observable<boolean> {
    const actual = this._session();
    if (!actual?.token) {
      if (actual) this.cerrarSesion();
      return of(false);
    }
    return this.http.get<AuthResponse>('/api/auth/me').pipe(
      tap((r) => {
        const data: SessionData = {
          token: actual.token,
          usuario: r.usuario,
          organizacion: r.organizacion ?? null,
          inspector: r.inspector ?? null,
        };
        this._session.set(data);
        this.guardarEnStorage(data);
      }),
      map(() => true),
      catchError((err) => {
        const status = (err as { status?: number })?.status ?? 0;
        if (status >= 400 && status < 500) {
          this.cerrarSesion('Tu sesión venció. Ingresá de nuevo.');
          return of(false);
        }
        return of(true);
      }),
    );
  }

  private recuperarDeStorage(): SessionData | null {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      window.sessionStorage.removeItem(STORAGE_KEY_ANTERIOR);
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SessionData;
      // Una sesión sin token no sirve contra el backend real
      return data?.usuario && data.token ? data : null;
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
        window.sessionStorage.removeItem(STORAGE_KEY_ANTERIOR);
      }
    } catch {
      // Ignorar fallos de storage
    }
  }
}
