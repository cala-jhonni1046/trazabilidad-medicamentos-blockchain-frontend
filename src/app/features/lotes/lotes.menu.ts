import { MenuItem } from '../../core/navigation/menu.registry';

export const LOTES_MENU: MenuItem[] = [
  {
    path: '/lotes',
    title: 'Lotes de producción',
    icon: 'inventory_2',
    roles: ['LABORATORIO', 'ANMAT', 'SUPERADMIN'],
  },
];
