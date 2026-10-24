import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const ENLACES_ROUTES: Routes = [
  {
    path: 'nuevo',
    canActivate: [roleGuard(['SUPERADMIN'])],
    loadComponent: () => import('./nuevo-enlace.component').then((m) => m.NuevoEnlaceComponent),
  },
  {
    path: 'solicitud',
    canActivate: [roleGuard(['LABORATORIO'])],
    loadComponent: () =>
      import('./solicitud-laboratorio.component').then((m) => m.SolicitudLaboratorioComponent),
  },
];
