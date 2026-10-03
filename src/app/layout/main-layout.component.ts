import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

interface NavItem {
  title: string;
  path: string;
  icon: string;
}

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
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = signal(false);
  readonly isSidenavOpen = signal(true);

  readonly navItems: NavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { title: 'Lotes', path: '/lotes', icon: 'inventory_2' },
    { title: 'Trazabilidad', path: '/trazabilidad', icon: 'timeline' },
  ];

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      const mobile = result.matches;
      this.isMobile.set(mobile);
      if (mobile) {
        this.isSidenavOpen.set(false);
      } else {
        this.isSidenavOpen.set(true);
      }
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
}
