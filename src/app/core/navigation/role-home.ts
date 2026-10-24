import { RolUsuario } from '../session/session.service';

export const ROLE_HOME: Record<RolUsuario, string> = {
  SUPERADMIN: '/inspectores',
  ANMAT: '/cuarentenas',
  LABORATORIO: '/laboratorio',
  DISTRIBUIDOR: '/distribucion',
  FARMACIA: '/farmacia',
  PACIENTE: '/portal',
};

export function getRoleHome(rol: RolUsuario | null | undefined): string {
  if (!rol) return '/login';
  return ROLE_HOME[rol] ?? '/login';
}
