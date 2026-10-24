import { MenuItem } from '../../core/navigation/menu.registry';

export const INSPECTORES_MENU: MenuItem[] = [
  { path: '/inspectores', title: 'Inspectores ANMAT', icon: 'verified_user', roles: ['SUPERADMIN'] },
  {
    path: '/inspectores/auditoria',
    title: 'Auditar por DNI',
    icon: 'manage_search',
    roles: ['SUPERADMIN'],
  },
];
