import { MenuItem } from '../../core/navigation/menu.registry';

export const CADENAS_MENU: MenuItem[] = [
  {
    path: '/cadenas',
    title: 'Auditoría de cadenas',
    icon: 'link',
    roles: ['SUPERADMIN', 'ANMAT'],
  },
  {
    path: '/cadenas/lote',
    title: 'Comprobar lote',
    icon: 'fact_check',
    roles: ['SUPERADMIN', 'ANMAT'],
  },
];
