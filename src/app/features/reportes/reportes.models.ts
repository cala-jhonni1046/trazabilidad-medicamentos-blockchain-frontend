/** Tipos propios de F31, reflejando docs/api.md sección 8 (Reportes Ciudadanos). */

export type EstadoReporte = 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO';

/** Refleja ReporteCiudadanoResponseDTO. */
export interface ReporteCiudadanoDto {
  id: number;
  motivoReporte: string;
  fechaHoraReporte: string;
  estado: EstadoReporte;
  unidadTrazableId: number | null;
  codigoUnicoQR: string | null;
  inspectorAsignadoId: number | null;
  inspectorNombre: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReporteFiltros {
  estado?: EstadoReporte;
  inspectorId?: number;
  unidadTrazableId?: number;
}

/** Refleja ReporteRevisionRequestDTO / ReporteResolucionRequestDTO: ambos solo llevan este campo opcional. */
export interface TransicionReporteRequest {
  inspectorAsignadoId?: number;
}

/** Proyección mínima de UnidadTrazableResponseDTO que necesita el detalle del reporte. */
export interface UnidadTrazableLite {
  id: number;
  codigoUnicoQR: string;
  loteId: number;
  codigoLote?: string | null;
  estado: string;
}

/** Proyección mínima de LoteResponseDTO que necesita el detalle del reporte. */
export interface LoteLite {
  id: number;
  codigoLote: string;
  estado: string;
  medicamentoNombre?: string | null;
}

export const ESTADOS_REPORTE: EstadoReporte[] = ['PENDIENTE', 'EN_REVISION', 'RESUELTO'];
