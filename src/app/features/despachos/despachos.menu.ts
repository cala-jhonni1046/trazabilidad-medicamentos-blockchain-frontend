import { MenuItem } from '../../core/navigation/menu.registry';

export const DESPACHOS_MENU: MenuItem[] = [
  {
    path: '/despachos',
    title: 'Despachos',
    icon: 'local_shipping',
    roles: ['LABORATORIO', 'ANMAT', 'SUPERADMIN'],
  },
];
