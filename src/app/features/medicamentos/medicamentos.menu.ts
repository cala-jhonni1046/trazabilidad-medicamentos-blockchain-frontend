import { MenuItem } from '../../core/navigation/menu.registry';

export const MEDICAMENTOS_MENU: MenuItem[] = [
  {
    path: '/medicamentos',
    title: 'Medicamentos',
    icon: 'medication',
    roles: ['LABORATORIO', 'SUPERADMIN', 'ANMAT'],
  },
];
