import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

/** F32: ROLE_HOME de FARMACIA. */
export const FARMACIA_ROUTES: Routes = [
  {
    path: '',
    title: 'Mi farmacia · MediChain',
    canActivate: [roleGuard(['FARMACIA'])],
    loadComponent: () =>
      import('./farmacia-dashboard.component').then((m) => m.FarmaciaDashboardComponent),
  },
];
