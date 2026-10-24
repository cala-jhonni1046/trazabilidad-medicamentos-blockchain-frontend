import { MenuItem } from '../../core/navigation/menu.registry';
import { cuarentenasAbiertasCount } from './cuarentenas.state';

export const CUARENTENAS_MENU: MenuItem[] = [
  {
    path: '/cuarentenas',
    title: 'Control de cuarentenas',
    icon: 'security',
    roles: ['ANMAT'],
    badgeFn: () => cuarentenasAbiertasCount(),
  },
];
