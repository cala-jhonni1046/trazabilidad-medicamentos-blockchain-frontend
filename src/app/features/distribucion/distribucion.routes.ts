import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const DISTRIBUCION_ROUTES: Routes = [
  {
    path: '',
    title: 'Distribución · MediChain',
    canActivate: [roleGuard(['DISTRIBUIDOR'])],
    loadComponent: () =>
      import('./distribucion-dashboard.component').then((m) => m.DistribucionDashboardComponent),
  },
  {
    path: 'verificar',
    title: 'Verificar Bulto · MediChain',
    canActivate: [roleGuard(['DISTRIBUIDOR'])],
    loadComponent: () =>
      import('./verificar-bulto.component').then((m) => m.VerificarBultoComponent),
  },
  {
    path: 'incidente',
    title: 'Aviso de Retraso · MediChain',
    canActivate: [roleGuard(['DISTRIBUIDOR'])],
    loadComponent: () =>
      import('./incidente.component').then((m) => m.IncidenteComponent),
  },
];
