import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LotesComponent } from './pages/lotes/lotes.component';
import { TrazabilidadComponent } from './pages/trazabilidad/trazabilidad.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'lotes', component: LotesComponent },
      { path: 'trazabilidad', component: TrazabilidadComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

