import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const TELEMETRIA_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'mapa',
  },
  {
    path: 'mapa',
    title: 'Telemetría y GPS · MediChain',
    canActivate: [roleGuard(['ANMAT', 'LABORATORIO', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./telemetria-mapa.component').then((m) => m.TelemetriaMapaComponent),
  },
];
