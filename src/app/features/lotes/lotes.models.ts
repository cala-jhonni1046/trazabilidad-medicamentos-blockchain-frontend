import type { EstadoUnidad } from '../../shared/models/dominio';
export type { EstadoUnidad };
export type EstadoLote =
  | 'CREADO'
  | 'EN_TRANSITO'
  | 'RECIBIDO'
  | 'EN_CUARENTENA'
  | 'LIBERADO'
  | 'CERRADO';

export interface Lote {
  id: number;
  codigoLote: string;
  medicamentoId: number;
  medicamentoNombre: string;
  laboratorioId: number;
  laboratorioNombre: string;
  laboratorioCuit: string;
  tempMin: number | null;
  tempMax: number | null;
  fechaHoraFabricacion: string | null;
  estado: EstadoLote;
  fechaCreacion?: string;
}

export interface LoteRequest {
  codigoLote: string;
  medicamentoId: number;
  laboratorioId: number;
  tempMin?: number | null;
  tempMax?: number | null;
  fechaHoraFabricacion?: string | null;
}


export interface UnidadResumen {
  id: number;
  codigoQr: string;
  loteId: number;
  estado: EstadoUnidad;
  fechaCreacion?: string;
}

export interface GenerarUnidadesRequest {
  cantidad: number;
}
