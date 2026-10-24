import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const ORGANIZACIONES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPERADMIN', 'ANMAT'])],
    loadComponent: () =>
      import('./organizaciones.component').then((m) => m.OrganizacionesComponent),
  },
];
