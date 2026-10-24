import { MenuItem } from '../../core/navigation/menu.registry';
import { reportesPendientesCount } from './reportes.state';

export const REPORTES_MENU: MenuItem[] = [
  {
    path: '/reportes',
    title: 'Reportes ciudadanos',
    icon: 'report_problem',
    roles: ['ANMAT', 'SUPERADMIN'],
    badgeFn: () => reportesPendientesCount(),
  },
];
