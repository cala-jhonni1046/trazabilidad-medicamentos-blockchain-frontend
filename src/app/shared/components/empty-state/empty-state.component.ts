import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state-box">
      <div class="icon-circle">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p *ngIf="description" class="empty-desc">{{ description }}</p>
      <div *ngIf="actionLabel" class="empty-action">
        <button mat-flat-button color="primary" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty-state-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        background: #f8fafc;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        margin: 16px 0;
      }
      .icon-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #e2e8f0;
        color: #64748b;
        margin-bottom: 16px;
      }
      .icon-circle mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      .empty-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: #1e293b;
      }
      .empty-desc {
        margin: 8px 0 0 0;
        max-width: 480px;
        font-size: 0.9rem;
        color: #64748b;
        line-height: 1.45;
      }
      .empty-action {
        margin-top: 20px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
