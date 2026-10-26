import type { EstadoUnidad } from '../../shared/models/dominio';
export type { EstadoUnidad };

export interface UnidadTrazableDto {
  id: number;
  codigoQr: string;
  loteId: number;
  estado: EstadoUnidad;
  fechaCreacion?: string;
}

export interface DespachoDto {
  id: number;
  loteId: number;
  codigoLote?: string;
  numeroRemito?: string;
  distribuidorId?: number;
  distribuidorNombre?: string;
  farmaciaDestinoId?: number;
  farmaciaDestinoNombre?: string;
  estado?: string;
  fechaSalida?: string | null;
}

export interface EventoCustodiaDto {
  id: number;
  despachoLogisticoId?: number;
  tipo: string;
  fechaHoraEvento: string;
  organizacionActorNombre?: string | null;
  descripcion?: string | null;
  hashEvento?: string | null;
}

export interface CuarentenaDto {
  id: number;
  loteId: number;
  codigoLote?: string;
  motivo?: string;
  estado: string; // ABIERTA, CERRADA
  fechaInicio: string;
  fechaFin?: string | null;
  inspectorResponsable?: string | null;
  resolucion?: string | null;
}

export interface DispensacionDto {
  id: number;
  unidadId: number;
  farmaciaId?: number;
  farmaciaNombre?: string;
  fechaDispensacion: string;
  // Nota de privacidad: no exponer datos del paciente
}

export interface RecepcionFarmaciaDto {
  id: number;
  despachoLogisticoId: number;
  farmaciaId?: number;
  farmaciaNombre?: string;
  fechaRecepcion: string;
  temperaturaLlegada?: number | null;
  observaciones?: string | null;
}

export type TipoPasoHistorial =
  | 'FABRICACION'
  | 'DESPACHO'
  | 'CUSTODIA'
  | 'CUARENTENA'
  | 'RECEPCION'
  | 'DISPENSACION';

export interface HistorialPaso {
  fecha: string;
  tipo: TipoPasoHistorial;
  titulo: string;
  detalle: string;
  estado?: string;
  hashDemostrativo?: string | null;
  esCuarentena?: boolean;
}

export interface HistorialUnidad {
  unidad: UnidadTrazableDto;
  lote?: {
    id: number;
    codigoLote: string;
    medicamentoNombre?: string;
    laboratorioNombre?: string;
    tempMin?: number | null;
    tempMax?: number | null;
    fechaHoraFabricacion?: string | null;
    estado?: string;
  } | null;
  pasos: HistorialPaso[];
}
