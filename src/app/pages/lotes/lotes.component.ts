import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { finalize, forkJoin } from 'rxjs';
import {
  Lote,
  Medicamento,
  MedicamentosApiService,
  mensajeApi,
  Organizacion,
} from '../../core/medicamentos-api.service';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './lotes.component.html',
  styleUrl: './lotes.component.scss',
})
export class LotesComponent implements OnInit {
  private readonly api = inject(MedicamentosApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly displayedColumns = [
    'codigoLote',
    'medicamento',
    'laboratorio',
    'rango',
    'estado',
    'acciones',
  ];
  lotes: Lote[] = [];
  medicamentos: Medicamento[] = [];
  laboratorios: Organizacion[] = [];
  cargando = false;
  guardando = false;
  error = '';
  mensaje = '';
  nuevo = {
    codigoLote: '',
    medicamentoId: null as number | null,
    laboratorioId: null as number | null,
    tempMin: null as number | null,
    tempMax: null as number | null,
    fechaHoraFabricacion: '',
  };

  ngOnInit(): void {
    this.recargar();
  }

  recargar(): void {
    if (this.cargando || this.guardando) return;
    this.cargando = true;
    this.error = '';
    forkJoin({
      lotes: this.api.getLotes(),
      medicamentos: this.api.getMedicamentos(),
      organizaciones: this.api.getOrganizaciones(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ lotes, medicamentos, organizaciones }) => {
          this.lotes = lotes;
          this.medicamentos = medicamentos;
          this.laboratorios = organizaciones.filter((org) => org.tipo === 'LABORATORIO');
          this.cargando = false;
        },
        error: (err: unknown) => {
          this.error = mensajeApi(err);
          this.cargando = false;
        },
      });
  }

  crear(form?: NgForm): void {
    if (this.guardando || this.cargando) return;
    this.error = '';
    this.mensaje = '';
    if (
      !this.nuevo.codigoLote.trim() ||
      this.nuevo.codigoLote.trim().length > 80 ||
      !this.medicamentos.some((m) => m.id === this.nuevo.medicamentoId) ||
      !this.laboratorios.some((l) => l.id === this.nuevo.laboratorioId)
    ) {
      this.error = 'Completá código, medicamento y laboratorio.';
      return;
    }
    if (
      this.nuevo.tempMin != null &&
      this.nuevo.tempMax != null &&
      this.nuevo.tempMin > this.nuevo.tempMax
    ) {
      this.error = 'La temperatura mínima no puede superar la máxima.';
      return;
    }
    this.guardando = true;
    this.api
      .crearLote({
        codigoLote: this.nuevo.codigoLote.trim(),
        medicamentoId: Number(this.nuevo.medicamentoId),
        laboratorioId: Number(this.nuevo.laboratorioId),
        tempMin: this.nuevo.tempMin,
        tempMax: this.nuevo.tempMax,
        fechaHoraFabricacion: this.nuevo.fechaHoraFabricacion || null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (lote) => {
          this.mensaje = `Lote ${lote.codigoLote} creado en estado ${lote.estado}.`;
          this.nuevo = {
            codigoLote: '',
            medicamentoId: null,
            laboratorioId: null,
            tempMin: null,
            tempMax: null,
            fechaHoraFabricacion: '',
          };
          form?.resetForm(this.nuevo);
          this.guardando = false;
          this.recargar();
        },
        error: (err: unknown) => {
          this.error = mensajeApi(err);
          this.guardando = false;
        },
      });
  }
}
