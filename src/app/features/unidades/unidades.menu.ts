import { MenuItem } from '../../core/navigation/menu.registry';

export const UNIDADES_MENU: MenuItem[] = [
  {
    path: '/unidades/auditoria',
    title: 'Auditoría QR',
    icon: 'qr_code_scanner',
    roles: ['ANMAT', 'SUPERADMIN'],
  },
  {
    path: '/unidades',
    title: 'Unidades trazables',
    icon: 'qr_code_2',
    roles: ['ANMAT', 'LABORATORIO', 'SUPERADMIN'],
  },
];
