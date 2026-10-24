import { RolUsuario } from '../session/session.service';

// ─── Tipo de ítem de menú ───────────────────────────────────────────────────
export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  roles: RolUsuario[];
  /** Señal o función que devuelve un número para el badge del menú */
  badgeFn?: () => number | null;
}

// ─── Sección de menú (separador con título) ─────────────────────────────────
export interface MenuSection {
  sectionTitle?: string;
  items: MenuItem[];
}

// ─── Importaciones de cada feature ─────────────────────────────────────────
// Las features completan sus propios arrays; aquí solo los importamos.
import { USUARIOS_MENU } from '../../features/usuarios/usuarios.menu';
import { INSPECTORES_MENU } from '../../features/inspectores/inspectores.menu';
import { ORGANIZACIONES_MENU } from '../../features/organizaciones/organizaciones.menu';
import { ENLACES_MENU } from '../../features/enlaces/enlaces.menu';
import { MEDICAMENTOS_MENU } from '../../features/medicamentos/medicamentos.menu';
import { LOTES_MENU } from '../../features/lotes/lotes.menu';
import { LABORATORIO_MENU } from '../../features/laboratorio/laboratorio.menu';
import { UNIDADES_MENU } from '../../features/unidades/unidades.menu';
import { DESPACHOS_MENU } from '../../features/despachos/despachos.menu';
import { DISTRIBUCION_MENU } from '../../features/distribucion/distribucion.menu';
import { TELEMETRIA_MENU } from '../../features/telemetria/telemetria.menu';
import { CUARENTENAS_MENU } from '../../features/cuarentenas/cuarentenas.menu';
import { RECEPCION_MENU } from '../../features/recepcion/recepcion.menu';
import { FARMACIA_MENU } from '../../features/farmacia/farmacia.menu';
import { DISPENSACION_MENU } from '../../features/dispensacion/dispensacion.menu';
import { REPORTES_MENU } from '../../features/reportes/reportes.menu';
import { CADENAS_MENU } from '../../features/cadenas/cadenas.menu';
import { PORTAL_MENU } from '../../features/portal/portal.menu';

// ─── Registro global ────────────────────────────────────────────────────────
export const MENU_REGISTRY: MenuItem[] = [
  ...USUARIOS_MENU,
  ...INSPECTORES_MENU,
  ...ORGANIZACIONES_MENU,
  ...ENLACES_MENU,
  ...MEDICAMENTOS_MENU,
  ...LOTES_MENU,
  ...LABORATORIO_MENU,
  ...UNIDADES_MENU,
  ...DESPACHOS_MENU,
  ...DISTRIBUCION_MENU,
  ...TELEMETRIA_MENU,
  ...CUARENTENAS_MENU,
  ...RECEPCION_MENU,
  ...FARMACIA_MENU,
  ...DISPENSACION_MENU,
  ...REPORTES_MENU,
  ...CADENAS_MENU,
  ...PORTAL_MENU,
];

/**
 * Filtra los ítems del registro para el rol dado.
 */
export function getMenuForRole(rol: RolUsuario | null | undefined): MenuItem[] {
  if (!rol) return [];
  return MENU_REGISTRY.filter((item) => item.roles.includes(rol));
}
