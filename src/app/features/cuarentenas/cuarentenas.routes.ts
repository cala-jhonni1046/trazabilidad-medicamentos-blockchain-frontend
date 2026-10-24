import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const CUARENTENAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Control de Cuarentenas · MediChain',
    canActivate: [roleGuard(['ANMAT'])],
    loadComponent: () =>
      import('./cuarentenas-dashboard.component').then((m) => m.CuarentenasDashboardComponent),
  },
];
