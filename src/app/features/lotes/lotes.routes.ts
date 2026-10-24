import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const LOTES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['LABORATORIO', 'ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./lotes-list.component').then((m) => m.LotesListComponent),
  },
  {
    path: 'nuevo',
    canActivate: [roleGuard(['LABORATORIO'])],
    loadComponent: () =>
      import('./lote-nuevo.component').then((m) => m.LoteNuevoComponent),
  },
  {
    path: ':id',
    canActivate: [roleGuard(['LABORATORIO', 'ANMAT', 'SUPERADMIN'])],
    loadComponent: () =>
      import('./lote-detalle.component').then((m) => m.LoteDetalleComponent),
  },
];
