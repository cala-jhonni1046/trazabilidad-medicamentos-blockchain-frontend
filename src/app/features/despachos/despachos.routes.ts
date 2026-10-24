import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const DESPACHOS_ROUTES: Routes = [
  {
    path: '',
    title: 'Despachos · MediChain',
    canActivate: [roleGuard(['LABORATORIO', 'ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./despachos-list.component').then((m) => m.DespachosListComponent),
  },
  {
    path: 'nuevo',
    title: 'Nuevo Despacho · MediChain',
    canActivate: [roleGuard(['LABORATORIO'])],
    loadComponent: () =>
      import('./despacho-nuevo.component').then((m) => m.DespachoNuevoComponent),
  },
  {
    path: ':id',
    title: 'Detalle de Despacho · MediChain',
    canActivate: [roleGuard(['LABORATORIO', 'DISTRIBUIDOR', 'ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./despacho-detalle.component').then((m) => m.DespachoDetalleComponent),
  },
];
