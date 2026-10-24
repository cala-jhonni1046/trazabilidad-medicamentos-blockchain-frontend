import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/auth.guards';

export const MEDICAMENTOS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['LABORATORIO', 'SUPERADMIN', 'ANMAT'])],
    loadComponent: () =>
      import('./medicamentos.component').then((m) => m.MedicamentosComponent),
  },
];
