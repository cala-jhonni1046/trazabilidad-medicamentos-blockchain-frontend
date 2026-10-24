import { MenuItem } from '../../core/navigation/menu.registry';

export const ORGANIZACIONES_MENU: MenuItem[] = [
  { path: '/organizaciones', title: 'Organizaciones', icon: 'business', roles: ['SUPERADMIN', 'ANMAT'] },
];
