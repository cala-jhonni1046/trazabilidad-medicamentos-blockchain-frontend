import { MenuItem } from '../../core/navigation/menu.registry';
import { cantidadPendientes } from './pendientes.store';

export const ENLACES_MENU: MenuItem[] = [
  {
    path: '/enlaces/pendientes',
    title: 'Solicitudes pendientes',
    icon: 'pending_actions',
    roles: ['ANMAT'],
    badgeFn: () => cantidadPendientes(),
  },
  {
    path: '/enlaces',
    title: 'Licencias y CUITs',
    icon: 'verified',
    roles: ['ANMAT', 'SUPERADMIN'],
  },
  {
    path: '/enlaces/nuevo',
    title: 'Crear cadena trazable',
    icon: 'add_link',
    roles: ['SUPERADMIN'],
  },
  {
    path: '/enlaces/solicitud',
    title: 'Cargar licencia y CUITs',
    icon: 'assignment',
    roles: ['LABORATORIO'],
  },
];
