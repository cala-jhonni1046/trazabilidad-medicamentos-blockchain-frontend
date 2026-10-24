import { MenuItem } from '../../core/navigation/menu.registry';

export const ENLACES_MENU: MenuItem[] = [
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
