import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../../core/session/session.service';
import { getRoleHome } from '../../../core/navigation/role-home';
import { PlaceholderComponent } from '../placeholder/placeholder.component';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  imports: [PlaceholderComponent],
  template: `<app-placeholder></app-placeholder>`,
})
export class HomeRedirectComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const rol = this.session.rol();
    if (!this.session.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    const destino = getRoleHome(rol);
    this.router.navigate([destino]);
  }
}
