import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { SessionService } from '../core/session/session.service';
import { getMenuForRole, MenuItem } from '../core/navigation/menu.registry';
import { getRoleHome } from '../core/navigation/role-home';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly isMobile = signal(false);
  readonly isSidenavOpen = signal(true);

  /** Ítems filtrados por el rol de la sesión */
  readonly navItems = computed<MenuItem[]>(() => getMenuForRole(this.session.rol()));

  /** Label legible del rol */
  readonly rolLabel = computed(() => {
    const rol = this.session.rol();
    const labels: Record<string, string> = {
      SUPERADMIN: 'Sede Central',
      ANMAT: 'Inspector ANMAT',
      LABORATORIO: 'Laboratorio',
      DISTRIBUIDOR: 'Distribuidor',
      FARMACIA: 'Farmacia',
      PACIENTE: 'Paciente',
    };
    return rol ? (labels[rol] ?? rol) : 'Sin sesión';
  });

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      const mobile = result.matches;
      this.isMobile.set(mobile);
      this.isSidenavOpen.set(!mobile);
    });
  }

  toggleSidenav(): void {
    this.isSidenavOpen.update((val) => !val);
  }

  onNavItemClick(): void {
    if (this.isMobile()) {
      this.isSidenavOpen.set(false);
    }
  }

  cerrarSesion(): void {
    this.session.cerrarSesion();
    this.router.navigate(['/login']);
  }

  badgeCount(item: MenuItem): number | null {
    return item.badgeFn ? item.badgeFn() : null;
  }
}
