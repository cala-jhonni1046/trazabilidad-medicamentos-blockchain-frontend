import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const DISPENSACION_ROUTES: Routes = [
  {
    path: '',
    title: 'Dispensar · MediChain',
    canActivate: [roleGuard(['FARMACIA'])],
    loadComponent: () => import('./dispensacion.component').then((m) => m.DispensacionComponent),
  },
];
