import { RolUsuario } from '../../core/session/session.service';

/** Refleja UsuarioResponseDTO del backend. */
export interface UsuarioDto {
  id: number;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

/** Refleja UsuarioRequestDTO del backend (la organización NO forma parte del usuario). */
export interface UsuarioRequest {
  email: string;
  rol: RolUsuario;
  activo?: boolean;
}

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
