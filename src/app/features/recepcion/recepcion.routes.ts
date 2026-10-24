import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const RECEPCION_ROUTES: Routes = [
  {
    path: '',
    title: 'Recepción de Carga · MediChain',
    canActivate: [roleGuard(['FARMACIA'])],
    loadComponent: () =>
      import('./recepcion.component').then((m) => m.RecepcionComponent),
  },
];
