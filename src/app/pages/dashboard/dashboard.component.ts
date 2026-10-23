import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, forkJoin, Observable, of } from 'rxjs';
import { MedicamentosApiService, mensajeApi } from '../../core/medicamentos-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(MedicamentosApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  cargando = false;
  error = '';
  metricas: { titulo: string; valor: number | null; detalle: string; icono: string }[] = [];
  temperaturasDisponibles = false;
  lecturas: { lote: string; temperatura: number; fecha: string; alerta: boolean | null }[] = [];

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';
    const fallos: string[] = [];
    const disponible = <T>(nombre: string, consulta: Observable<T[]>) =>
      consulta.pipe(
        catchError((err: unknown) => {
          fallos.push(`${nombre}: ${mensajeApi(err)}`);
          return of(null);
        }),
      );
    forkJoin({
      lotes: disponible('Lotes', this.api.getLotes()),
      despachos: disponible('Despachos', this.api.getDespachos()),
      temperaturas: disponible('Temperaturas', this.api.getTemperaturas()),
      cuarentenas: disponible('Cuarentenas', this.api.getCuarentenasAbiertas()),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ lotes, despachos, temperaturas, cuarentenas }) => {
          this.metricas = [
            {
              titulo: 'Lotes registrados',
              valor: lotes?.length ?? null,
              detalle: 'Total de la base actual',
              icono: 'inventory_2',
            },
            {
              titulo: 'Despachos en tránsito',
              valor: despachos?.filter((d) => d.estado === 'EN_TRANSITO').length ?? null,
              detalle: 'Estado logístico',
              icono: 'local_shipping',
            },
            {
              titulo: 'Cuarentenas abiertas',
              valor: cuarentenas?.length ?? null,
              detalle: 'Pendientes de resolución',
              icono: 'gpp_maybe',
            },
            {
              titulo: 'Lecturas con excursión',
              valor: temperaturas?.filter((t) => t.alertaExcursion === true).length ?? null,
              detalle: 'Lecturas registradas, sin cuarentena automática',
              icono: 'thermostat',
            },
          ];
          this.error = fallos.join(' · ');
          this.temperaturasDisponibles = temperaturas !== null;
          const codigos = new Map((despachos ?? []).map((d) => [d.id, d.codigoLote]));
          this.lecturas = [...(temperaturas ?? [])]
            .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
            .slice(0, 5)
            .map((t) => ({
              lote: codigos.get(t.despachoLogisticoId) ?? `Despacho #${t.despachoLogisticoId}`,
              temperatura: t.temperatura,
              fecha: t.fechaHora,
              alerta: t.alertaExcursion,
            }));
          this.cargando = false;
        },
        error: (err: unknown) => {
          this.error = mensajeApi(err);
          this.cargando = false;
        },
      });
  }
}
