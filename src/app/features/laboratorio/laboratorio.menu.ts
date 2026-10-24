import { MenuItem } from '../../core/navigation/menu.registry';

export const LABORATORIO_MENU: MenuItem[] = [
  {
    path: '/laboratorio',
    title: 'Dashboard',
    icon: 'dashboard',
    roles: ['LABORATORIO'],
  },
  {
    path: '/telemetria/mapa',
    title: 'Monitoreo GPS',
    icon: 'location_on',
    roles: ['LABORATORIO'],
  },
];
