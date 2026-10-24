import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

import { mensajeApi } from '../../core/http/api-error';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { FechaArPipe } from '../../shared/pipes/fecha-ar.pipe';
import { InspectoresApiService } from './inspectores-api.service';
import { InspectorDto, dniValidator, normalizarDni } from './inspectores.models';

@Component({
  selector: 'app-auditoria-inspector',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    PageHeaderComponent,
    ErrorAlertComponent,
    StatusBadgeComponent,
    FechaArPipe,
  ],
  templateUrl: './auditoria-inspector.component.html',
  styleUrl: './auditoria-inspector.component.scss',
})
export class AuditoriaInspectorComponent {
  private readonly api = inject(InspectoresApiService);

  readonly dni = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, dniValidator()],
  });

  /** El <form> necesita un FormGroup para que (ngSubmit) se dispare con Enter y con el botón. */
  readonly form = new FormGroup({ dni: this.dni });

  readonly buscando = signal(false);
  readonly error = signal<string | null>(null);
  readonly consultado = signal(false);
  readonly resultado = signal<InspectorDto | null>(null);

  buscar(): void {
    if (this.buscando()) return;
    if (this.dni.invalid) {
      this.dni.markAsTouched();
      // No arrastrar el resultado (o el cartel de "sin resultado") de la búsqueda anterior.
      this.resultado.set(null);
      this.consultado.set(false);
      return;
    }
    const buscado = normalizarDni(this.dni.value);
    this.buscando.set(true);
    this.error.set(null);
    this.resultado.set(null);
    this.consultado.set(false);

    this.api.buscarPorDni(buscado).subscribe({
      next: (lista) => {
        // Se vuelve a comparar en el cliente (normalizando puntos y espacios) porque un backend
        // sin el filtro ?dni= devuelve el listado completo.
        this.resultado.set(lista.find((i) => normalizarDni(i.dni) === buscado) ?? null);
        this.consultado.set(true);
        this.buscando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeApi(err));
        this.buscando.set(false);
      },
    });
  }
}
