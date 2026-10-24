import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title" [ngClass]="{ 'text-danger': data.isDanger }">
      <mat-icon *ngIf="data.isDanger" class="dialog-icon danger">warning</mat-icon>
      <mat-icon *ngIf="!data.isDanger" class="dialog-icon info">help_outline</mat-icon>
      <span>{{ data.title }}</span>
    </h2>
    <mat-dialog-content class="dialog-content">
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()">{{ data.cancelText || 'Cancelar' }}</button>
      <button
        mat-flat-button
        [color]="data.isDanger ? 'warn' : 'primary'"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        padding-top: 16px;
      }
      .dialog-icon.danger {
        color: #ef4444;
      }
      .dialog-icon.info {
        color: #0284c7;
      }
      .text-danger {
        color: #b91c1c;
      }
      .dialog-content {
        padding-top: 12px;
      }
      .dialog-message {
        margin: 0;
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .dialog-actions {
        padding: 16px 24px;
        gap: 8px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
