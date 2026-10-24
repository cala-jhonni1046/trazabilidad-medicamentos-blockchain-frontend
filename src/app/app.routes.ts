import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard } from './core/session/auth.guards';

// Pantallas legadas — se mantienen hasta que cada dueño las migre (F11, F13, F20)
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LotesComponent } from './pages/lotes/lotes.component';
import { TrazabilidadComponent } from './pages/trazabilidad/trazabilidad.component';

export const routes: Routes = [
  // ── Login (público) ───────────────────────────────────────────────────────
  {
    path: 'login',
    loadChildren: () =>
      import('./features/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },

  // ── Layout protegido ──────────────────────────────────────────────────────
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Redirigir raíz al inicio de rol
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/home-redirect/home-redirect.component').then(
            (m) => m.HomeRedirectComponent,
          ),
      },

      // ── LEGACY: pantallas existentes (no borrar hasta migración) ───────
      { path: 'dashboard', component: DashboardComponent },
      { path: 'lotes', component: LotesComponent },
      { path: 'trazabilidad', component: TrazabilidadComponent },

      // ── Features por lazy loading (UN loadChildren por feature) ────────
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES),
      },
      {
        path: 'inspectores',
        loadChildren: () =>
          import('./features/inspectores/inspectores.routes').then((m) => m.INSPECTORES_ROUTES),
      },
      {
        path: 'organizaciones',
        loadChildren: () =>
          import('./features/organizaciones/organizaciones.routes').then(
            (m) => m.ORGANIZACIONES_ROUTES,
          ),
      },
      {
        path: 'enlaces',
        loadChildren: () =>
          import('./features/enlaces/enlaces.routes').then((m) => m.ENLACES_ROUTES),
      },
      {
        path: 'medicamentos',
        loadChildren: () =>
          import('./features/medicamentos/medicamentos.routes').then((m) => m.MEDICAMENTOS_ROUTES),
      },
      {
        path: 'laboratorio',
        loadChildren: () =>
          import('./features/laboratorio/laboratorio.routes').then((m) => m.LABORATORIO_ROUTES),
      },
      {
        path: 'unidades',
        loadChildren: () =>
          import('./features/unidades/unidades.routes').then((m) => m.UNIDADES_ROUTES),
      },
      {
        path: 'despachos',
        loadChildren: () =>
          import('./features/despachos/despachos.routes').then((m) => m.DESPACHOS_ROUTES),
      },
      {
        path: 'distribucion',
        loadChildren: () =>
          import('./features/distribucion/distribucion.routes').then((m) => m.DISTRIBUCION_ROUTES),
      },
      {
        path: 'telemetria',
        loadChildren: () =>
          import('./features/telemetria/telemetria.routes').then((m) => m.TELEMETRIA_ROUTES),
      },
      {
        path: 'cuarentenas',
        loadChildren: () =>
          import('./features/cuarentenas/cuarentenas.routes').then((m) => m.CUARENTENAS_ROUTES),
      },
      {
        path: 'recepcion',
        loadChildren: () =>
          import('./features/recepcion/recepcion.routes').then((m) => m.RECEPCION_ROUTES),
      },
      {
        path: 'farmacia',
        loadChildren: () =>
          import('./features/farmacia/farmacia.routes').then((m) => m.FARMACIA_ROUTES),
      },
      {
        path: 'dispensacion',
        loadChildren: () =>
          import('./features/dispensacion/dispensacion.routes').then((m) => m.DISPENSACION_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'cadenas',
        loadChildren: () =>
          import('./features/cadenas/cadenas.routes').then((m) => m.CADENAS_ROUTES),
      },
    ],
  },

  // ── Portal público (sin layout protegido) ────────────────────────────────
  {
    path: 'portal',
    loadChildren: () =>
      import('./features/portal/portal.routes').then((m) => m.PORTAL_ROUTES),
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
