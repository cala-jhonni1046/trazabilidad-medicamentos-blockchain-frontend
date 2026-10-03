import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface LoteItem {
  id: string;
  medicamento: string;
  laboratorio: string;
  custodia: string;
  temperatura: string;
  rangoExigido: string;
  estado: 'En Tránsito' | 'Liberado' | 'Cuarentena';
  hashTx: string;
}

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './lotes.component.html',
  styleUrl: './lotes.component.scss',
})
export class LotesComponent {
  readonly displayedColumns: string[] = [
    'id',
    'medicamento',
    'laboratorio',
    'custodia',
    'temperatura',
    'estado',
    'hashTx',
  ];

  readonly lotes: LoteItem[] = [
    {
      id: 'LOT-2026-904',
      medicamento: 'Insulina Glargina 100UI/ml (Solución Inyectable)',
      laboratorio: 'Laboratorios Beta S.A. (CUIT 30-11223344-5)',
      custodia: 'Distribuidora Logística Sur (Patente AF-892-CD)',
      temperatura: '4.2 °C',
      rangoExigido: '2°C a 8°C',
      estado: 'En Tránsito',
      hashTx: '0x3a91...f08d',
    },
    {
      id: 'LOT-2026-883',
      medicamento: 'Vacuna Neumocócica Conjugada 13-valente',
      laboratorio: 'Laboratorio Pasteur Nac. (CUIT 30-22334455-6)',
      custodia: 'Transporte Frío Austral (Patente AG-102-ZX)',
      temperatura: '9.4 °C',
      rangoExigido: '2°C a 8°C',
      estado: 'Cuarentena',
      hashTx: '0x884c...e219',
    },
    {
      id: 'LOT-2026-871',
      medicamento: 'Amoxicilina + Clavulánico 500mg/125mg',
      laboratorio: 'PharmaTech Argentina (CUIT 30-33445566-7)',
      custodia: 'Farmacia Hospitalaria Central (CUIT 30-44556677-8)',
      temperatura: '20.1 °C',
      rangoExigido: '15°C a 25°C',
      estado: 'Liberado',
      hashTx: '0x19de...77fa',
    },
    {
      id: 'LOT-2026-865',
      medicamento: 'Factor VIII Recombinante Humano',
      laboratorio: 'Laboratorios Beta S.A. (CUIT 30-11223344-5)',
      custodia: 'Sede Distribución Cuyo (Patente AC-442-MK)',
      temperatura: '5.0 °C',
      rangoExigido: '2°C a 8°C',
      estado: 'En Tránsito',
      hashTx: '0x9021...b81e',
    },
  ];
}
