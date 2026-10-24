import { MenuItem } from '../../core/navigation/menu.registry';

export const TELEMETRIA_MENU: MenuItem[] = [
  {
    path: '/telemetria/mapa',
    title: 'Telemetría y GPS',
    icon: 'satellite_alt',
    roles: ['ANMAT', 'LABORATORIO', 'SUPERADMIN'],
  },
];
