import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const ENLACES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./enlaces-listado.component').then((m) => m.EnlacesListadoComponent),
  },
  {
    path: 'pendientes',
    canActivate: [roleGuard(['ANMAT'])],
    loadComponent: () =>
      import('./pendientes-enlaces.component').then((m) => m.PendientesEnlacesComponent),
  },
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
