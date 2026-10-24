import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const UNIDADES_ROUTES: Routes = [
  {
    path: 'auditoria',
    canActivate: [roleGuard(['ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./unidad-auditoria.component').then((m) => m.UnidadAuditoriaComponent),
  },
  {
    path: '',
    canActivate: [roleGuard(['ANMAT', 'LABORATORIO', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./unidades-list.component').then((m) => m.UnidadesListComponent),
  },
];
