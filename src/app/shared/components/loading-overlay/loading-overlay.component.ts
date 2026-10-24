import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="loading" class="loading-container" [class.overlay-mode]="overlay">
      <mat-spinner [diameter]="diameter" color="primary"></mat-spinner>
      <span *ngIf="message" class="loading-message">{{ message }}</span>
    </div>
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        gap: 16px;
      }
      .overlay-mode {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.75);
        backdrop-filter: blur(2px);
        z-index: 20;
      }
      .loading-message {
        font-size: 0.9rem;
        color: #475569;
        font-weight: 500;
      }
    `,
  ],
})
export class LoadingOverlayComponent {
  @Input() loading = false;
  @Input() overlay = false;
  @Input() diameter = 40;
  @Input() message?: string;
}
