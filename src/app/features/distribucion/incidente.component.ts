import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-incidente',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="incidente-container">
      <app-page-header
        title="Aviso de retraso en ruta"
        subtitle="Registro de incidencias operativas durante el transporte del lote"
        icon="report_problem"
      >
        <div actions>
          <a mat-stroked-button routerLink="/distribucion">
            <mat-icon>arrow_back</mat-icon>
            Volver a distribución
          </a>
        </div>
      </app-page-header>

      <mat-card class="limitacion-card" appearance="outlined">
        <mat-card-header>
          <div class="card-title-group">
            <mat-icon class="warn-icon">info</mat-icon>
            <mat-card-title>Funcionalidad pendiente en backend (Requisito 2.4)</mat-card-title>
          </div>
        </mat-card-header>

        <mat-card-content>
          <p class="limitacion-desc">
            El contrato actual de OpenAPI del backend no define el tipo de evento de custodia
            <code>INCIDENTE_EN_RUTA</code> en el enum <code>TipoEventoCustodia</code>.
          </p>
          <p class="limitacion-desc">
            Conforme a las reglas del proyecto (<em>no simular con datos falsos ni forzar eventos inexistentes</em>),
            esta pantalla permanece en modo informativo y la opción se mantiene oculta del menú principal
            hasta que el backend incorpore dicho tipo de evento.
          </p>

          <div class="acciones-box">
            <a mat-flat-button color="primary" routerLink="/distribucion">
              <mat-icon>local_shipping</mat-icon>
              Ir al panel de distribución
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .incidente-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 16px;
      }
      .limitacion-card {
        margin-top: 16px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #f59e0b;
      }
      .card-title-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .warn-icon {
        color: #d97706;
      }
      .limitacion-desc {
        color: #334155;
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 12px;
      }
      .acciones-box {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }
    `,
  ],
})
export class IncidenteComponent {}
