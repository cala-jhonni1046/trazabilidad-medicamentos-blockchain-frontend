export type EstadoDespacho = 'PREPARADO' | 'EN_TRANSITO' | 'RECIBIDO' | 'CANCELADO';

export type TipoEventoCustodia =
  | 'LOTE_DESPACHADO'
  | 'CUSTODIA_ASUMIDA'
  | 'TELEMETRIA_REGISTRADA'
  | 'RECEPCION_CONFIRMADA'
  | 'RECEPCION_RECHAZADA'
  | 'DESPACHO_CANCELADO'
  | 'CUARENTENA_ABIERTA'
  | 'CUARENTENA_RESUELTA'
  | 'UNIDAD_DISPENSADA'
  | string;

export interface DespachoLogistico {
  id: number;
  numeroRemito: string;
  codigoSeguimiento?: string | null;
  origen?: string | null;
  destino?: string | null;
  distribuidorId: number;
  distribuidorNombre?: string | null;
  distribuidorCuit?: string | null;
  laboratorioId?: number | null;
  laboratorioNombre?: string | null;
  laboratorioCuit?: string | null;
  farmaciaDestinoId?: number | null;
  farmaciaDestinoNombre?: string | null;
  farmaciaDestinoCuit?: string | null;
  vehiculoPatente?: string | null;
  fechaSalida?: string | null;
  fechaEstimadaEntrega?: string | null;
  fechaEntregaReal?: string | null;
  estado: EstadoDespacho;
  temperaturaMinimaPermitida?: number | null;
  temperaturaMaximaPermitida?: number | null;
  observaciones?: string | null;
  loteId: number;
  codigoLote?: string | null;
  medicamentoNombre?: string | null;
  enlaceCuitId: number;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface DespachoLogisticoRequest {
  loteId: number;
  enlaceCuitId: number;
  distribuidorId: number;
  numeroRemito: string;
  farmaciaDestinoId?: number | null;
  vehiculoPatente?: string | null;
  fechaSalida?: string | null;
  fechaEstimadaEntrega?: string | null;
  temperaturaMinimaPermitida?: number | null;
  temperaturaMaximaPermitida?: number | null;
  observaciones?: string | null;
  origen?: string | null;
  destino?: string | null;
  codigoSeguimiento?: string | null;
}

export interface TransicionDespachoRequest {
  observaciones?: string | null;
}

export interface EventoCustodia {
  id: number;
  tipo: TipoEventoCustodia;
  fechaHoraEvento: string;
  despachoLogisticoId?: number | null;
  organizacionActorId?: number | null;
  organizacionActorNombre?: string | null;
  organizacionActorCuit?: string | null;
  descripcion?: string | null;
  hashAnterior?: string | null;
  hashEvento?: string | null;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface EventoCustodiaRequest {
  tipo: TipoEventoCustodia;
  fechaHoraEvento?: string | null;
  organizacionActorId?: number | null;
  descripcion?: string | null;
}

export interface LoteSimple {
  id: number;
  codigoLote: string;
  medicamentoId: number;
  medicamentoNombre?: string;
  laboratorioId: number;
  laboratorioNombre?: string;
  laboratorioCuit?: string;
  tempMin?: number | null;
  tempMax?: number | null;
  fechaHoraFabricacion?: string | null;
  estado?: string;
}

export interface EnlaceCuitSimple {
  id: number;
  laboratorioId: number;
  laboratorioNombre?: string | null;
  laboratorioCuit?: string | null;
  distribuidorId: number;
  distribuidorNombre?: string | null;
  distribuidorCuit?: string | null;
  farmaciaId: number;
  farmaciaNombre?: string | null;
  farmaciaCuit?: string | null;
  estado: 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';
}
