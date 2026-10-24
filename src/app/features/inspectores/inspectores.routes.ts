import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const INSPECTORES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPERADMIN'])],
    loadComponent: () => import('./inspectores.component').then((m) => m.InspectoresComponent),
  },
  {
    path: 'auditoria',
    canActivate: [roleGuard(['SUPERADMIN'])],
    loadComponent: () =>
      import('./auditoria-inspector.component').then((m) => m.AuditoriaInspectorComponent),
  },
];
