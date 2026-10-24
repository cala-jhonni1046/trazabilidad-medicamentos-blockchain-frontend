export type EstadoCuarentena = 'ABIERTA' | 'LIBERADA' | 'MANTENIDA';

export interface CuarentenaDTO {
  id: number;
  codigoCuarentena: string;
  fechaInicio: string;
  fechaFin?: string | null;
  motivo: string;
  estado: EstadoCuarentena;
  loteId: number;
  codigoLote?: string | null;
  inspectorResponsableId?: number | null;
  inspectorNombre?: string | null;
  resolucionFinal?: string | null;
  observaciones?: string | null;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface CuarentenaRequest {
  codigoCuarentena: string;
  loteId: number;
  motivo: string;
  inspectorResponsableId?: number | null;
  observaciones?: string | null;
}

export interface CuarentenaResolucionRequest {
  estado: 'LIBERADA' | 'MANTENIDA';
  resolucionFinal?: string | null;
  observaciones?: string | null;
  inspectorResponsableId?: number | null;
  fechaFin?: string | null;
}

export interface LoteConTelemetria {
  id: number;
  codigoLote: string;
  medicamentoNombre: string;
  laboratorioNombre: string;
  laboratorioCuit: string;
  estado: string;
  distribuidorNombre?: string | null;
  distribuidorCuit?: string | null;
  farmaciaNombre?: string | null;
  farmaciaCuit?: string | null;
  ultimaTemperatura?: number | null;
  alertaExcursion?: boolean | null;
  despachoId?: number | null;
  cuarentenaAbierta?: CuarentenaDTO | null;
}
