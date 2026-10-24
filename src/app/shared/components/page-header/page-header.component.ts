import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="page-header">
      <div class="header-main">
        <div class="title-wrap">
          <div *ngIf="icon" class="header-icon-box">
            <mat-icon>{{ icon }}</mat-icon>
          </div>
          <div>
            <h1 class="page-title">{{ title }}</h1>
            <p *ngIf="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="header-actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      <div class="header-extra">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      .page-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e2e8f0;
      }
      .header-main {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 16px;
      }
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .header-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: linear-gradient(135deg, #1e293b, #0f172a);
        color: #38bdf8;
      }
      .page-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.25;
      }
      .page-subtitle {
        margin: 4px 0 0 0;
        font-size: 0.88rem;
        color: #64748b;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .header-extra {
        margin-top: 12px;
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
}
