import { MenuItem } from '../../core/navigation/menu.registry';

export const DISTRIBUCION_MENU: MenuItem[] = [
  {
    path: '/distribucion',
    title: 'Operaciones de distribución',
    icon: 'local_shipping',
    roles: ['DISTRIBUIDOR'],
  },
  {
    path: '/distribucion/verificar',
    title: 'Verificar bulto (QR)',
    icon: 'qr_code_scanner',
    roles: ['DISTRIBUIDOR'],
  },
];
