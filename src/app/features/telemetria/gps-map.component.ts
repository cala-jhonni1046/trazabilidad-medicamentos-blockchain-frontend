import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TelemetriaGPS } from './telemetria.models';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-gps-map',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    FechaArPipe,
    EmptyStateComponent,
  ],
  templateUrl: './gps-map.component.html',
  styleUrls: ['./gps-map.component.scss'],
})
export class GpsMapComponent implements OnChanges, AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() lecturas: TelemetriaGPS[] = [];
  @Input() patente?: string | null;

  @ViewChild('mapElement') mapElement?: ElementRef<HTMLDivElement>;

  modoFallback = false;
  mostrarTabla = false;
  mapaIniciado = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private leafletMap: any = null;

  readonly displayedColumns: string[] = ['fechaHora', 'latitud', 'longitud', 'velocidad', 'direccion'];

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lecturas'] && !changes['lecturas'].firstChange) {
      this.actualizarPuntos();
    }
  }

  ngOnDestroy(): void {
    if (this.leafletMap) {
      try {
        this.leafletMap.remove();
      } catch {
        // Ignorar error al destruir
      }
      this.leafletMap = null;
    }
  }

  toggleVista(): void {
    this.mostrarTabla = !this.mostrarTabla;
    if (!this.mostrarTabla) {
      setTimeout(() => this.iniciarMapa(), 100);
    }
  }

  private async iniciarMapa(): Promise<void> {
    if (typeof window === 'undefined' || !this.mapElement || this.lecturas.length === 0) {
      return;
    }

    try {
      const L = await import('leaflet');

      if (!this.mapElement?.nativeElement) {
        return;
      }

      if (this.leafletMap) {
        this.leafletMap.remove();
        this.leafletMap = null;
      }

      const mapContainer = this.mapElement.nativeElement;
      const ultimaLectura = this.lecturas[this.lecturas.length - 1];
      const centro: [number, number] = [ultimaLectura.latitud, ultimaLectura.longitud];

      this.leafletMap = L.map(mapContainer).setView(centro, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(this.leafletMap);

      this.actualizarPuntosEnMapa(L);
      this.mapaIniciado = true;
      this.modoFallback = false;
      this.cdr.markForCheck();
    } catch {
      // Si Leaflet falla o no hay internet/entorno headless, degradar limpiamente
      this.modoFallback = true;
      this.cdr.markForCheck();
    }
  }

  private actualizarPuntos(): void {
    if (!this.leafletMap) {
      this.iniciarMapa();
      return;
    }

    import('leaflet')
      .then((L) => {
        this.actualizarPuntosEnMapa(L);
      })
      .catch(() => {
        this.modoFallback = true;
        this.cdr.markForCheck();
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private actualizarPuntosEnMapa(L: any): void {
    if (!this.leafletMap || this.lecturas.length === 0) return;

    // Coordenadas ordenadas
    const latLngs = this.lecturas.map((l) => [l.latitud, l.longitud] as [number, number]);

    // Polilínea de ruta
    L.polyline(latLngs, { color: '#0284c7', weight: 4, opacity: 0.85 }).addTo(this.leafletMap);

    // Marcadores para cada lectura intermedia
    this.lecturas.slice(0, -1).forEach((l) => {
      L.circleMarker([l.latitud, l.longitud], {
        radius: 4,
        fillColor: '#38bdf8',
        color: '#0369a1',
        weight: 1,
        fillOpacity: 0.9,
      })
        .addTo(this.leafletMap)
        .bindPopup(`Hora: ${l.fechaHora}<br>Velocidad: ${l.velocidad ?? 0} km/h`);
    });

    // Marcador destacado para la última posición
    const ultima = this.lecturas[this.lecturas.length - 1];
    const marker = L.circleMarker([ultima.latitud, ultima.longitud], {
      radius: 9,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(this.leafletMap);

    marker
      .bindPopup(
        `<strong>Última posición (${this.patente || 'Vehículo'})</strong><br>` +
          `Hora: ${ultima.fechaHora}<br>Velocidad: ${ultima.velocidad ?? 0} km/h` +
          (ultima.direccionAproximada ? `<br>${ultima.direccionAproximada}` : ''),
      )
      .openPopup();

    // Ajustar zoom a todos los puntos
    const bounds = L.latLngBounds(latLngs);
    this.leafletMap.fitBounds(bounds, { padding: [30, 30] });
  }
}
