import { Routes } from '@angular/router';

// Placeholder de F00: Dev4 lo reemplaza en F30 por la pantalla real del portal ciudadano.
export const PORTAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/placeholder/placeholder.component').then(
        (m) => m.PlaceholderComponent,
      ),
  },
];
