import { RolUsuario } from '../../core/session/session.service';

/** Refleja UsuarioResponseDTO del backend. */
export interface UsuarioDto {
  id: number;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  organizacionId?: number | null;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

/** Refleja UsuarioRequestDTO del backend. */
export interface UsuarioRequest {
  email: string;
  rol: RolUsuario;
  activo?: boolean;
  /** Mínimo 8 caracteres. Obligatoria al crear; al editar, solo si se cambia. */
  password?: string;
  /** Obligatoria para LABORATORIO, DISTRIBUIDOR y FARMACIA; no se envía para ANMAT ni SUPERADMIN. */
  organizacionId?: number | null;
}

export const PASSWORD_MIN = 8;

/** Roles que operan en nombre de una organización y por eso exigen elegirla. */
export const ROLES_CON_ORGANIZACION: RolUsuario[] = ['LABORATORIO', 'DISTRIBUIDOR', 'FARMACIA'];

export const ROL_LABELS: Record<RolUsuario, string> = {
  SUPERADMIN: 'Sede Central (SUPERADMIN)',
  ANMAT: 'Inspector ANMAT',
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidor',
  FARMACIA: 'Farmacia',
  PACIENTE: 'Paciente',
};

/** SUPERADMIN solo lo crea el seed; PACIENTE no necesita cuenta (portal público). */
export const ROLES_CREABLES: RolUsuario[] = ['ANMAT', 'LABORATORIO', 'DISTRIBUIDOR', 'FARMACIA'];

export const TODOS_LOS_ROLES: RolUsuario[] = [
  'SUPERADMIN',
  'ANMAT',
  'LABORATORIO',
  'DISTRIBUIDOR',
  'FARMACIA',
  'PACIENTE',
];
