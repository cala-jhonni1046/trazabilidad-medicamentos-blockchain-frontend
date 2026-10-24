import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div *ngIf="message" class="error-alert" role="alert">
      <div class="alert-content">
        <mat-icon class="alert-icon">error_outline</mat-icon>
        <div class="alert-text">
          <p class="alert-msg">{{ message }}</p>
          <ul *ngIf="fieldErrorsList.length > 0" class="field-errors-list">
            <li *ngFor="let item of fieldErrorsList">
              <strong>{{ item.field }}:</strong> {{ item.message }}
            </li>
          </ul>
        </div>
      </div>
      <div *ngIf="showRetry" class="alert-actions">
        <button mat-stroked-button color="warn" (click)="retry.emit()">
          <mat-icon>refresh</mat-icon>
          Reintentar
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .error-alert {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 14px 18px;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        margin: 16px 0;
        flex-wrap: wrap;
      }
      .alert-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        flex: 1;
        min-width: 240px;
      }
      .alert-icon {
        color: #dc2626;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .alert-text {
        color: #991b1b;
        font-size: 0.9rem;
      }
      .alert-msg {
        margin: 0;
        font-weight: 500;
        line-height: 1.4;
      }
      .field-errors-list {
        margin: 6px 0 0 0;
        padding-left: 18px;
        font-size: 0.85rem;
      }
      .alert-actions {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class ErrorAlertComponent {
  @Input() message?: string | null;
  @Input() fieldErrors?: Record<string, string> | null;
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();

  get fieldErrorsList(): { field: string; message: string }[] {
    if (!this.fieldErrors) return [];
    return Object.entries(this.fieldErrors).map(([field, message]) => ({ field, message }));
  }
}
