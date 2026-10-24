import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { TelemetriaApiService } from './telemetria-api.service';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
import { mensajeApi, extraerFieldErrors } from '../../core/http/api-error';

@Component({
  selector: 'app-simulador-sensor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ErrorAlertComponent,
  ],
  templateUrl: './simulador-sensor.component.html',
  styleUrls: ['./simulador-sensor.component.scss'],
})
export class SimuladorSensorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TelemetriaApiService);

  @Input({ required: true }) despachoId!: number;
  @Output() lecturaEnviada = new EventEmitter<{ alertaExcursion?: boolean | null }>();

  form!: FormGroup;
  enviando = false;
  errorEnvio: string | null = null;
  fieldErrors: Record<string, string> = {};
  resultadoAlerta: boolean | null = null;

  ngOnInit(): void {
    const ahora = new Date().toISOString().slice(0, 16);
    this.form = this.fb.group({
      latitud: [-34.6037, [Validators.required]],
      longitud: [-58.3816, [Validators.required]],
      velocidad: [60, [Validators.min(0)]],
      sensorId: ['IOT-TERM-01', [Validators.required, Validators.maxLength(50)]],
      temperatura: [5.0, [Validators.required]],
      fechaHora: [ahora, [Validators.required]],
      direccionAproximada: ['Ruta Nacional 9 km 45'],
    });
  }

  enviarLecturas(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    this.errorEnvio = null;
    this.fieldErrors = {};
    this.resultadoAlerta = null;

    const val = this.form.value;
    const fechaHora = val.fechaHora ? new Date(val.fechaHora).toISOString() : new Date().toISOString();

    const gpsReq = {
      despachoLogisticoId: this.despachoId,
      latitud: Number(val.latitud),
      longitud: Number(val.longitud),
      velocidad: val.velocidad != null ? Number(val.velocidad) : null,
      direccionAproximada: val.direccionAproximada || null,
      fechaHora,
    };

    const tempReq = {
      despachoLogisticoId: this.despachoId,
      sensorId: String(val.sensorId).trim(),
      temperatura: Number(val.temperatura),
      fechaHora,
    };

    forkJoin({
      gps: this.api.registrarGps(gpsReq),
      temp: this.api.registrarTemperatura(tempReq),
    }).subscribe({
      next: ({ temp }) => {
        this.enviando = false;
        this.resultadoAlerta = temp.alertaExcursion ?? false;
        this.lecturaEnviada.emit({ alertaExcursion: temp.alertaExcursion });
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio = mensajeApi(err);
        this.fieldErrors = extraerFieldErrors(err);
      },
    });
  }
}
