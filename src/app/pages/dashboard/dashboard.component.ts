import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

interface MetricCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  badge: string;
  badgeType: 'success' | 'warning' | 'info' | 'primary';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly metrics: MetricCard[] = [
    {
      title: 'Lotes en Circulación',
      value: '18',
      subtitle: 'Monitoreados en tiempo real',
      icon: 'inventory_2',
      badge: '+3 hoy',
      badgeType: 'primary',
    },
    {
      title: 'Telemetría IoT (Frío)',
      value: '3.6 °C',
      subtitle: 'Rango óptimo (2°C a 8°C)',
      icon: 'ac_unit',
      badge: 'Normal',
      badgeType: 'success',
    },
    {
      title: 'Cuarentenas ANMAT',
      value: '1',
      subtitle: 'Lote #MED-883 bajo auditoría',
      icon: 'gpp_maybe',
      badge: 'Alerta Activa',
      badgeType: 'warning',
    },
    {
      title: 'Cadenas Blockchain',
      value: '1,420',
      subtitle: 'Bloques de custodia sellados',
      icon: 'verified_user',
      badge: 'Inmutable',
      badgeType: 'info',
    },
  ];

  readonly recentEvents = [
    {
      id: 'EVT-904',
      lote: 'Lote #MED-904 (Insulina 100UI)',
      origen: 'Laboratorio Central CUIT 30-11223344-5',
      destino: 'Distribuidora Logística Sur',
      temp: '4.1 °C',
      estado: 'En Tránsito',
      timestamp: 'Hace 12 minutos',
    },
    {
      id: 'EVT-883',
      lote: 'Lote #MED-883 (Vacuna Neumo-23)',
      origen: 'Transporte Flota A-04',
      destino: 'Farmacia Hospitalaria San Martín',
      temp: '9.2 °C',
      estado: 'Cuarentena Automática',
      timestamp: 'Hace 45 minutos',
    },
    {
      id: 'EVT-871',
      lote: 'Lote #MED-871 (Amoxicilina 500mg)',
      origen: 'Distribuidora Logística Sur',
      destino: 'Farmacia del Sol CUIT 30-99887766-1',
      temp: '18.4 °C',
      estado: 'Entregado y Verificado',
      timestamp: 'Hace 2 horas',
    },
  ];
}
