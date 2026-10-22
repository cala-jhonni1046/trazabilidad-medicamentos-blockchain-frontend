import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { finalize, forkJoin, map, of, Subscription, switchMap } from 'rxjs';
import {
  ConsultaQR,
  Despacho,
  EventoCustodia,
  Lote,
  MedicamentosApiService,
  mensajeApi,
} from '../../core/medicamentos-api.service';

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.scss',
})
export class TrazabilidadComponent implements OnInit {
  private readonly api = inject(MedicamentosApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private custodia?: Subscription;
  private loteSolicitado: number | null = null;
  cargandoLotes = false;
  errorLotes = '';
  lotes: Lote[] = [];
  loteId: number | null = null;
  despachos: Despacho[] = [];
  eventos: { evento: EventoCustodia; despacho: Despacho }[] = [];
  codigoQr = '';
  consulta: ConsultaQR | null = null;
  cargando = false;
  consultando = false;
  error = '';
  errorQr = '';

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.custodia?.unsubscribe());
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('loteId'));
      const solicitado = Number.isSafeInteger(id) && id > 0 ? id : null;
      const cambio = solicitado !== this.loteSolicitado;
      this.loteSolicitado = solicitado;
      if (this.lotes.length && cambio) this.seleccionarDesdeRuta();
    });
    this.recargarLotes();
  }

  recargarLotes(): void {
    if (this.cargandoLotes) return;
    this.cargandoLotes = true;
    this.errorLotes = '';
    this.api
      .getLotes()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargandoLotes = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (lotes) => {
          this.lotes = lotes;
          this.seleccionarDesdeRuta();
        },
        error: (err: unknown) => {
          this.errorLotes = mensajeApi(err);
        },
      });
  }

  private seleccionarDesdeRuta(): void {
    this.loteId = this.lotes.some((l) => l.id === this.loteSolicitado) ? this.loteSolicitado : null;
    this.cargarCustodia();
    if (this.loteSolicitado && !this.loteId)
      this.error = 'El lote indicado no está disponible. Seleccioná otro lote.';
    this.cdr.markForCheck();
  }

  seleccionarLote(): void {
    this.loteSolicitado = this.loteId;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { loteId: this.loteId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.cargarCustodia();
  }

  cargarCustodia(): void {
    this.custodia?.unsubscribe();
    this.eventos = [];
    this.despachos = [];
    this.error = '';
    this.cargando = false;
    if (!this.loteId) return;
    this.cargando = true;
    this.custodia = this.api
      .getDespachos(Number(this.loteId))
      .pipe(
        switchMap((despachos) => {
          const consultas = despachos.map((d) => this.api.getEventos(d.id));
          return (consultas.length ? forkJoin(consultas) : of([] as EventoCustodia[][])).pipe(
            map((grupos) => ({ despachos, grupos })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ despachos, grupos }) => {
          this.despachos = despachos;
          this.eventos = grupos
            .flatMap((grupo, index) =>
              grupo.map((evento) => ({ evento, despacho: despachos[index] })),
            )
            .sort((a, b) => a.evento.fechaHoraEvento.localeCompare(b.evento.fechaHoraEvento));
        },
        error: (err: unknown) => {
          this.error = mensajeApi(err);
        },
      });
  }

  consultarQR(): void {
    if (this.consultando) return;
    this.errorQr = '';
    this.consulta = null;
    const codigo = this.codigoQr.trim();
    if (!codigo) {
      this.errorQr = 'Ingresá un código QR.';
      return;
    }
    this.consultando = true;
    this.api
      .consultarQR(codigo)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.consultando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (consulta) => {
          this.consulta = consulta;
          this.consultando = false;
        },
        error: (err: unknown) => {
          this.errorQr = mensajeApi(err);
          this.consultando = false;
        },
      });
  }
}
