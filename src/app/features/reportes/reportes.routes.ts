import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    title: 'Reportes ciudadanos · MediChain',
    canActivate: [roleGuard(['ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./reportes-bandeja.component').then((m) => m.ReportesBandejaComponent),
  },
];
