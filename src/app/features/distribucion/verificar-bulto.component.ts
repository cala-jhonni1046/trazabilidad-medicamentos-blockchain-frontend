import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DistribucionApiService } from './distribucion-api.service';
import { DespachoLogistico, ResultadoVerificacionBulto } from './distribucion.models';
import { SessionService } from '../../core/session/session.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { mensajeApi } from '../../core/http/api-error';

@Component({
  selector: 'app-verificar-bulto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    ErrorAlertComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './verificar-bulto.component.html',
  styleUrls: ['./verificar-bulto.component.scss'],
})
export class VerificarBultoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DistribucionApiService);
  readonly session = inject(SessionService);

  form!: FormGroup;
  despachos: DespachoLogistico[] = [];
  despachoSeleccionado?: DespachoLogistico;

  cargandoDespachos = false;
  verificando = false;
  errorCarga: string | null = null;
  errorVerificacion: string | null = null;

  resultado: ResultadoVerificacionBulto | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      despachoId: [null, [Validators.required]],
      codigoQr: ['', [Validators.required, Validators.maxLength(160)]],
    });

    this.cargarDespachos();
  }

  cargarDespachos(): void {
    const org = this.session.organizacion();
    if (!org) {
      this.errorCarga = 'No se ha detectado una organización distribuidora en la sesión.';
      return;
    }

    this.cargandoDespachos = true;
    this.errorCarga = null;

    this.api.getDespachosDistribuidor(org.id).subscribe({
      next: (data) => {
        // Solo despachos PREPARADO o EN_TRANSITO
        this.despachos = data.filter(
          (d) => d.estado === 'PREPARADO' || d.estado === 'EN_TRANSITO',
        );
        this.cargandoDespachos = false;
      },
      error: (err) => {
        this.errorCarga = mensajeApi(err);
        this.cargandoDespachos = false;
      },
    });
  }

  onDespachoChange(id: number): void {
    this.despachoSeleccionado = this.despachos.find((d) => d.id === id);
    this.resultado = null;
    this.errorVerificacion = null;
  }

  verificar(): void {
    if (this.form.invalid || !this.despachoSeleccionado) {
      this.form.markAllAsTouched();
      return;
    }

    this.verificando = true;
    this.errorVerificacion = null;
    this.resultado = null;

    const codigoQr = String(this.form.value.codigoQr).trim();
    const despacho = this.despachoSeleccionado;

    this.api.consultarUnidadPorQr(codigoQr).subscribe({
      next: (unidad) => {
        // Validar que pertenezca al lote del despacho
        if (unidad.loteId !== despacho.loteId) {
          this.verificando = false;
          this.resultado = {
            valido: false,
            motivo: `El bulto escaneado pertenece al Lote #${unidad.loteId} (${unidad.codigoLote || 'otro lote'}), pero el despacho seleccionado corresponde al Lote #${despacho.loteId} (${despacho.codigoLote || ''}).`,
            unidad,
            eventoRegistrado: false,
          };
          return;
        }

        // Validar que no esté bloqueada
        if (unidad.estado === 'BLOQUEADA') {
          this.verificando = false;
          this.resultado = {
            valido: false,
            motivo: 'La unidad trazable se encuentra en estado BLOQUEADA por auditoría regulatoria o reporte.',
            unidad,
            eventoRegistrado: false,
          };
          return;
        }

        // Registrar evento de custodia CUSTODIA_ASUMIDA
        const orgId = this.session.organizacion()?.id;
        const orgNombre = this.session.organizacion()?.nombre || 'Distribuidor';

        this.api
          .registrarEvento(despacho.id, {
            tipo: 'CUSTODIA_ASUMIDA',
            fechaHoraEvento: new Date().toISOString(),
            organizacionActorId: orgId,
            descripcion: `Verificación exitosa de bulto QR y custodia asumida por ${orgNombre}`,
          })
          .subscribe({
            next: () => {
              this.verificando = false;
              this.resultado = {
                valido: true,
                unidad,
                eventoRegistrado: true,
              };
            },
            error: (errEvento) => {
              this.verificando = false;
              // Si falla por 409 (ej: lote en cuarentena)
              this.errorVerificacion = mensajeApi(errEvento);
              this.resultado = {
                valido: false,
                motivo: mensajeApi(errEvento),
                unidad,
                eventoRegistrado: false,
              };
            },
          });
      },
      error: (err) => {
        this.verificando = false;
        this.errorVerificacion = mensajeApi(err);
        this.resultado = {
          valido: false,
          motivo: 'El código QR ingresado no existe en el registro de unidades trazables.',
          eventoRegistrado: false,
        };
      },
    });
  }
}
