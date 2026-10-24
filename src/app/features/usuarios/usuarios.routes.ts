import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPERADMIN'])],
    loadComponent: () => import('./usuarios.component').then((m) => m.UsuariosComponent),
  },
];
