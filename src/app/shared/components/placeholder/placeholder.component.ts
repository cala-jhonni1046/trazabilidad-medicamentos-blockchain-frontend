import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SessionService } from '../../../core/session/session.service';
import { getRoleHome } from '../../../core/navigation/role-home';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="placeholder-container">
      <mat-card class="placeholder-card">
        <div class="icon-wrap">
          <mat-icon>construction</mat-icon>
        </div>
        <h2>Pantalla en construcción</h2>
        <p class="desc">
          Esta funcionalidad forma parte del plan de desarrollo del frontend (Hitos F10–F33).
          El módulo aún no fue integrado en esta rama.
        </p>
        <div class="session-info" *ngIf="session.usuario() as u">
          <span class="info-label">Sesión actual:</span>
          <span class="info-val">{{ u.email }} ({{ u.rol }})</span>
        </div>
        <div class="actions">
          <button mat-flat-button color="primary" (click)="irAInicio()">
            <mat-icon>home</mat-icon>
            Ir al inicio de mi rol
          </button>
          <button mat-stroked-button type="button" (click)="cerrarSesion()" *ngIf="session.isAuthenticated()">
            <mat-icon>logout</mat-icon>
            Cerrar sesión
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .placeholder-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 50vh;
        padding: 24px;
      }
      .placeholder-card {
        max-width: 520px;
        text-align: center;
        padding: 40px 28px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
      }
      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #fef3c7;
        color: #d97706;
        margin-bottom: 20px;
      }
      .icon-wrap mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #1e293b;
        font-weight: 700;
      }
      .desc {
        color: #64748b;
        font-size: 0.95rem;
        margin: 12px 0 24px 0;
        line-height: 1.5;
      }
      .session-info {
        background: #f1f5f9;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.85rem;
        display: inline-block;
        margin-bottom: 24px;
      }
      .info-label {
        color: #64748b;
        margin-right: 6px;
      }
      .info-val {
        color: #0f172a;
        font-weight: 600;
      }
      .actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
      }
    `,
  ],
})
export class PlaceholderComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  irAInicio(): void {
    const rol = this.session.rol();
    this.router.navigate([getRoleHome(rol)]);
  }

  cerrarSesion(): void {
    this.session.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
