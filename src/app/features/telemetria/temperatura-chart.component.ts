import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TelemetriaTemperatura } from './telemetria.models';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface ChartPoint {
  x: number;
  y: number;
  temp: number;
  fecha: string;
  excursion: boolean;
  sensorId: string;
}

@Component({
  selector: 'app-temperatura-chart',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, FechaArPipe, EmptyStateComponent],
  templateUrl: './temperatura-chart.component.html',
  styleUrls: ['./temperatura-chart.component.scss'],
})
export class TemperaturaChartComponent {
  @Input() lecturas: TelemetriaTemperatura[] = [];
  @Input() tempMin?: number | null;
  @Input() tempMax?: number | null;

  readonly displayedColumns: string[] = ['fechaHora', 'sensorId', 'temperatura', 'estado'];

  get tieneLecturas(): boolean {
    return this.lecturas.length > 0;
  }

  get totalExcursiones(): number {
    return this.lecturas.filter((l) => l.alertaExcursion === true).length;
  }

  get ultimaLectura(): TelemetriaTemperatura | null {
    return this.lecturas.length > 0 ? this.lecturas[this.lecturas.length - 1] : null;
  }

  // Dimensiones del SVG
  readonly width = 600;
  readonly height = 220;
  readonly padding = { top: 20, right: 30, bottom: 30, left: 45 };

  get chartData(): {
    points: ChartPoint[];
    polylineStr: string;
    yMinPos: number | null;
    yMaxPos: number | null;
    yMinTemp: number;
    yMaxTemp: number;
  } {
    if (this.lecturas.length === 0) {
      return { points: [], polylineStr: '', yMinPos: null, yMaxPos: null, yMinTemp: 0, yMaxTemp: 10 };
    }

    const temps = this.lecturas.map((l) => l.temperatura);
    if (this.tempMin != null) temps.push(this.tempMin);
    if (this.tempMax != null) temps.push(this.tempMax);

    const minT = Math.floor(Math.min(...temps) - 2);
    const maxT = Math.ceil(Math.max(...temps) + 2);
    const rangeT = maxT - minT || 1;

    const plotWidth = this.width - this.padding.left - this.padding.right;
    const plotHeight = this.height - this.padding.top - this.padding.bottom;

    const scaleX = (index: number) => {
      if (this.lecturas.length === 1) return this.padding.left + plotWidth / 2;
      return this.padding.left + (index / (this.lecturas.length - 1)) * plotWidth;
    };

    const scaleY = (temp: number) => {
      const norm = (temp - minT) / rangeT;
      return this.padding.top + plotHeight * (1 - norm);
    };

    const points: ChartPoint[] = this.lecturas.map((l, i) => {
      const fueraDeRango =
        l.alertaExcursion === true ||
        (this.tempMin != null && l.temperatura < this.tempMin) ||
        (this.tempMax != null && l.temperatura > this.tempMax);

      return {
        x: scaleX(i),
        y: scaleY(l.temperatura),
        temp: l.temperatura,
        fecha: l.fechaHora,
        excursion: fueraDeRango,
        sensorId: l.sensorId,
      };
    });

    const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    const yMinPos = this.tempMin != null ? scaleY(this.tempMin) : null;
    const yMaxPos = this.tempMax != null ? scaleY(this.tempMax) : null;

    return { points, polylineStr, yMinPos, yMaxPos, yMinTemp: minT, yMaxTemp: maxT };
  }
}
