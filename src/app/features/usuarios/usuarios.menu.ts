import { MenuItem } from '../../core/navigation/menu.registry';

export const USUARIOS_MENU: MenuItem[] = [
  { path: '/usuarios', title: 'Usuarios y roles', icon: 'manage_accounts', roles: ['SUPERADMIN'] },
];
