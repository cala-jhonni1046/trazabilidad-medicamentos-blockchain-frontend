import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EnlaceSolicitudFormComponent } from './enlace-solicitud-form.component';
import { EnlaceDto } from './enlaces.models';

/** SUPERADMIN: crear una cadena trazable eligiendo también el laboratorio. */
@Component({
  selector: 'app-nuevo-enlace',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EnlaceSolicitudFormComponent,
  ],
  template: `
    <section class="pagina">
      <app-page-header
        title="Crear cadena trazable"
        subtitle="Laboratorio → distribuidor → farmacia: se registra como solicitud pendiente de aprobación de ANMAT"
        icon="add_link"
      ></app-page-header>

      @if (creada(); as e) {
        <mat-card class="exito" role="status">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Solicitud #{{ e.id }} creada.</strong>
            Estado: <app-status-badge [estado]="e.estado"></app-status-badge>
            <p>ANMAT la resuelve desde "Solicitudes pendientes".</p>
          </div>
          <a mat-stroked-button routerLink="/enlaces">Ver enlaces</a>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          <app-enlace-solicitud-form (creada)="creada.set($event)"></app-enlace-solicitud-form>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .pagina {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 860px;
        margin: 0 auto;
      }
      .exito {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }
      .exito mat-icon {
        color: #059669;
      }
      .exito p {
        margin: 4px 0 0;
        font-size: 0.9rem;
        color: #475569;
      }
    `,
  ],
})
export class NuevoEnlaceComponent {
  readonly creada = signal<EnlaceDto | null>(null);
}
