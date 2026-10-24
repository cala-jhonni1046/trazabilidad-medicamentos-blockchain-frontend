import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const LABORATORIO_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['LABORATORIO'])],
    loadComponent: () =>
      import('./laboratorio-dashboard.component').then(
        (m) => m.LaboratorioDashboardComponent,
      ),
  },
];
