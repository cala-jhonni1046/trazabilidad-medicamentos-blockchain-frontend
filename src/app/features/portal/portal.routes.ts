import { Routes } from '@angular/router';

/** F30: portal público, sin guard (accesible sin sesión). ROLE_HOME de PACIENTE. */
export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    title: 'Portal público · MediChain',
    loadComponent: () => import('./portal.component').then((m) => m.PortalComponent),
  },
];
