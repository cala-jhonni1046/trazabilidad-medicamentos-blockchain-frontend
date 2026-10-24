import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';

import { mensajeApi } from '../../core/http/api-error';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { CadenasApiService } from './cadenas-api.service';
import { DespachoDto, EventoCustodiaDto, LoteDto, ResultadoEncadenamiento } from './cadenas.models';
import { RegistrosDemoPanelComponent } from './registros-demo-panel.component';
import { verificarEncadenamiento } from './verificar-encadenamiento';

interface DespachoConEventos {
  despacho: DespachoDto;
  eventos: EventoCustodiaDto[];
  resultado: ResultadoEncadenamiento;
}

/**
 * F33 — "Comprobar Lote Blockchain". Verifica, en el cliente, la CONTINUIDAD del
 * encadenamiento de hashes de los eventos de custodia de cada despacho del lote.
 * No hay búsqueda por código de lote en el backend: se busca en el cliente sobre
 * el listado completo de /api/lotes (por eso el "no encontrado" es propio, no un
 * 404 real del servidor).
 */
@Component({
  selector: 'app-comprobar-lote',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LoadingOverlayComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    FechaArPipe,
    RegistrosDemoPanelComponent,
  ],
  templateUrl: './comprobar-lote.component.html',
  styleUrl: './comprobar-lote.component.scss',
})
export class ComprobarLoteComponent implements OnInit {
  private readonly api = inject(CadenasApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  codigoLote = '';
  buscando = signal(false);
  error = signal<string | null>(null);
  lote = signal<LoteDto | null>(null);
  grupos = signal<DespachoConEventos[]>([]);

  ngOnInit(): void {
    const desdeUrl = this.route.snapshot.queryParamMap.get('codigoLote');
    if (desdeUrl) {
      this.codigoLote = desdeUrl;
      this.buscar();
    }
  }

  buscar(): void {
    if (this.buscando()) return;
    const codigo = this.codigoLote.trim();
    this.error.set(null);
    this.lote.set(null);
    this.grupos.set([]);
    if (!codigo) {
      this.error.set('Ingresá un código de lote.');
      return;
    }
    this.buscando.set(true);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { codigoLote: codigo },
      replaceUrl: true,
    });

    this.api.obtenerLotePorCodigo(codigo).subscribe({
      next: (lote) => {
        if (!lote) {
          // No es un 404 real del backend: no existe búsqueda por código. Error propio.
          this.error.set('Lote inexistente.');
          this.buscando.set(false);
          return;
        }
        this.lote.set(lote);
        this.cargarDespachosYEventos(lote.id);
      },
      error: (err: unknown) => {
        this.error.set(mensajeApi(err));
        this.buscando.set(false);
      },
    });
  }

  private cargarDespachosYEventos(loteId: number): void {
    this.api.listarDespachosDeLote(loteId).subscribe({
      next: (despachos) => {
        if (despachos.length === 0) {
          this.grupos.set([]);
          this.buscando.set(false);
          return;
        }
        forkJoin(despachos.map((d) => this.api.listarEventos(d.id))).subscribe({
          next: (listasEventos) => {
            this.grupos.set(
              despachos.map((despacho, i) => {
                const eventos = [...listasEventos[i]].sort((a, b) =>
                  a.fechaHoraEvento.localeCompare(b.fechaHoraEvento),
                );
                return { despacho, eventos, resultado: verificarEncadenamiento(eventos) };
              }),
            );
            this.buscando.set(false);
          },
          error: (err: unknown) => {
            this.error.set(mensajeApi(err));
            this.buscando.set(false);
          },
        });
      },
      error: (err: unknown) => {
        this.error.set(mensajeApi(err));
        this.buscando.set(false);
      },
    });
  }

  truncarHash(hash: string | null): string {
    if (!hash) return '—';
    return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
  }

  copiarHash(hash: string | null): void {
    if (!hash || typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(hash);
  }
}
