import type { EstadoConformidad } from '../../shared/models/dominio';
export type { EstadoConformidad };
/** Tipos propios de F32 (dashboard de farmacia), reflejando docs/api.md. */


/** Proyección mínima de RecepcionFarmaciaResponseDTO. */
export interface RecepcionLite {
  id: number;
  farmaciaId: number;
  despachoLogisticoId: number;
  estadoConformidad: EstadoConformidad;
}

/** Proyección mínima de DespachoLogisticoResponseDTO. */
export interface DespachoLite {
  id: number;
  loteId: number;
  estado: string;
}

/** Proyección mínima de LoteResponseDTO. */
export interface LoteLite {
  id: number;
  codigoLote: string;
  estado: string;
  medicamentoNombre?: string | null;
}

/** Proyección mínima de UnidadTrazableResponseDTO. */
export interface UnidadTrazableLite {
  id: number;
  codigoUnicoQR: string;
  loteId: number;
  estado: 'DISPONIBLE' | 'DISPENSADA' | 'BLOQUEADA' | string;
}

/** Vista combinada para la tabla de inventario de la farmacia (no existe un endpoint directo). */
export interface ItemInventario {
  unidadId: number;
  codigoQr: string;
  loteId: number;
  codigoLote: string;
  medicamentoNombre: string | null;
  estado: string;
}
