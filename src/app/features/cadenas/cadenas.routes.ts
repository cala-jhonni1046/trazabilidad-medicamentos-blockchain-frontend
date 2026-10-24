import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const CADENAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Cadenas · MediChain',
    canActivate: [roleGuard(['SUPERADMIN', 'ANMAT'])],
    loadComponent: () => import('./cadenas.component').then((m) => m.CadenasComponent),
  },
  {
    path: 'lote',
    title: 'Comprobar lote · MediChain',
    canActivate: [roleGuard(['SUPERADMIN', 'ANMAT'])],
    loadComponent: () => import('./comprobar-lote.component').then((m) => m.ComprobarLoteComponent),
  },
];
