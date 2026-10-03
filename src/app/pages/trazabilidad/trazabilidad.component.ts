import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface TrazabilidadStep {
  stepNumber: number;
  rol: string;
  entidad: string;
  cuit: string;
  accion: string;
  timestamp: string;
  estado: 'completado' | 'en-proceso' | 'pendiente';
  icono: string;
  hash: string;
  detalles: string;
}

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './trazabilidad.component.html',
  styleUrl: './trazabilidad.component.scss',
})
export class TrazabilidadComponent {
  readonly loteSeleccionado = 'LOT-2026-904 (Insulina Glargina 100UI)';

  readonly pasos: TrazabilidadStep[] = [
    {
      stepNumber: 1,
      rol: 'LABORATORIO',
      entidad: 'Laboratorios Beta S.A.',
      cuit: '30-11223344-5',
      accion: 'Fabricación y Emisión de Lote',
      timestamp: '03/10/2026 08:30:15 ART',
      estado: 'completado',
      icono: 'biotech',
      hash: '0x9fa12b...48c1',
      detalles: 'Producción de 5,000 unidades. QR serializados emitidos en Smart Contract.',
    },
    {
      stepNumber: 2,
      rol: 'DISTRIBUIDOR',
      entidad: 'Distribuidora Logística Sur',
      cuit: '30-22334455-6',
      accion: 'Asunción de Custodia y Telemetría IoT',
      timestamp: '03/10/2026 11:15:40 ART',
      estado: 'completado',
      icono: 'local_shipping',
      hash: '0x3c78d1...09ee',
      detalles: 'Patente Camión AF-892-CD. Sensor IoT #SN-441 activo transmitiendo 4.1°C constante.',
    },
    {
      stepNumber: 3,
      rol: 'ANMAT',
      entidad: 'Autoridad Sanitaria Nacional',
      cuit: '30-00000000-1',
      accion: 'Fiscalización y Validación de Cadena',
      timestamp: '03/10/2026 11:20:00 ART',
      estado: 'completado',
      icono: 'verified',
      hash: '0x12aae9...66f2',
      detalles: 'Trinomio de custodia aprobado por Inspector Matriculado #8491.',
    },
    {
      stepNumber: 4,
      rol: 'FARMACIA',
      entidad: 'Farmacia Hospitalaria Central',
      cuit: '30-44556677-8',
      accion: 'Recepción y Escaneo de Ingreso',
      timestamp: '03/10/2026 14:05:22 ART',
      estado: 'en-proceso',
      icono: 'local_pharmacy',
      hash: '0x4490bc...11ba',
      detalles: 'Carga arribada a destino. Escaneo de bultos en proceso de verificación.',
    },
    {
      stepNumber: 5,
      rol: 'PACIENTE',
      entidad: 'Portal Ciudadano / Validación Final',
      cuit: 'Consumidor Final',
      accion: 'Validación por Código QR y Dispensación',
      timestamp: 'Pendiente de venta',
      estado: 'pendiente',
      icono: 'qr_code_scanner',
      hash: 'Pendiente',
      detalles: 'Se vinculará el QR único al DNI del paciente al momento de la dispensa.',
    },
  ];
}
