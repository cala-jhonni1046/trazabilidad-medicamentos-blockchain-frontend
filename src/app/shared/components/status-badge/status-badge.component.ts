import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type EstadoTipo =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'HABILITADO'
  | 'SUSPENDIDO'
  | 'PENDIENTE'
  | 'RECHAZADO'
  | 'CREADO'
  | 'EN_TRANSITO'
  | 'RECIBIDO'
  | 'EN_CUARENTENA'
  | 'LIBERADO'
  | 'CERRADO'
  | 'CANCELADO'
  | 'PREPARADO'
  | 'ABIERTA'
  | 'CERRADA'
  | string;

interface EstadoConfig {
  label: string;
  clase: string;
  icon: string;
}

const CONFIG_ESTADOS: Record<string, EstadoConfig> = {
  ACTIVO: { label: 'Activo', clase: 'badge-success', icon: 'check_circle' },
  INACTIVO: { label: 'Inactivo', clase: 'badge-muted', icon: 'cancel' },
  HABILITADO: { label: 'Habilitado', clase: 'badge-success', icon: 'verified' },
  SUSPENDIDO: { label: 'Suspendido', clase: 'badge-danger', icon: 'block' },
  PENDIENTE: { label: 'Pendiente', clase: 'badge-warning', icon: 'schedule' },
  RECHAZADO: { label: 'Rechazado', clase: 'badge-danger', icon: 'highlight_off' },
  CREADO: { label: 'Creado', clase: 'badge-info', icon: 'add_circle_outline' },
  EN_TRANSITO: { label: 'En tránsito', clase: 'badge-primary', icon: 'local_shipping' },
  RECIBIDO: { label: 'Recibido', clase: 'badge-success', icon: 'done_all' },
  EN_CUARENTENA: { label: 'En cuarentena', clase: 'badge-danger', icon: 'warning' },
  LIBERADO: { label: 'Liberado', clase: 'badge-success', icon: 'lock_open' },
  CERRADO: { label: 'Cerrado', clase: 'badge-neutral', icon: 'lock' },
  CANCELADO: { label: 'Cancelado', clase: 'badge-danger', icon: 'cancel' },
  PREPARADO: { label: 'Preparado', clase: 'badge-info', icon: 'inventory_2' },
  ABIERTA: { label: 'Abierta', clase: 'badge-danger', icon: 'lock' },
  CERRADA: { label: 'Cerrada', clase: 'badge-neutral', icon: 'check' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="status-badge" [ngClass]="badgeConfig.clase" [attr.aria-label]="badgeConfig.label">
      <mat-icon class="badge-icon">{{ badgeConfig.icon }}</mat-icon>
      <span class="badge-text">{{ badgeConfig.label }}</span>
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        line-height: 1;
        white-space: nowrap;
        border: 1px solid transparent;
      }
      .badge-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        line-height: 14px;
      }
      .badge-success {
        background-color: rgba(16, 185, 129, 0.12);
        color: #065f46;
        border-color: rgba(16, 185, 129, 0.3);
      }
      .badge-warning {
        background-color: rgba(245, 158, 11, 0.14);
        color: #92400e;
        border-color: rgba(245, 158, 11, 0.35);
      }
      .badge-danger {
        background-color: rgba(239, 68, 68, 0.12);
        color: #991b1b;
        border-color: rgba(239, 68, 68, 0.3);
      }
      .badge-info {
        background-color: rgba(14, 165, 233, 0.12);
        color: #0369a1;
        border-color: rgba(14, 165, 233, 0.3);
      }
      .badge-primary {
        background-color: rgba(79, 70, 229, 0.12);
        color: #3730a3;
        border-color: rgba(79, 70, 229, 0.3);
      }
      .badge-neutral {
        background-color: rgba(100, 116, 139, 0.12);
        color: #334155;
        border-color: rgba(100, 116, 139, 0.25);
      }
      .badge-muted {
        background-color: rgba(148, 163, 184, 0.15);
        color: #475569;
        border-color: rgba(148, 163, 184, 0.25);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() estado?: EstadoTipo | boolean | null;

  get badgeConfig(): EstadoConfig {
    if (typeof this.estado === 'boolean') {
      return this.estado ? CONFIG_ESTADOS['ACTIVO'] : CONFIG_ESTADOS['INACTIVO'];
    }
    const clave = (this.estado || '').toString().toUpperCase();
    return (
      CONFIG_ESTADOS[clave] || {
        label: this.estado ? String(this.estado) : 'Desconocido',
        clase: 'badge-neutral',
        icon: 'help_outline',
      }
    );
  }
}
