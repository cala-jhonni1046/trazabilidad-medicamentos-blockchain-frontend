export type { DespachoLogistico, EventoCustodia, EstadoDespacho } from '../despachos/despachos.models';

export interface UnidadVerificacionResponse {
  id: number;
  codigoUnicoQR?: string | null;
  codigoQr?: string | null;
  loteId: number;
  codigoLote?: string | null;
  estado: string;
}

export interface ResultadoVerificacionBulto {
  valido: boolean;
  motivo?: string;
  unidad?: UnidadVerificacionResponse;
  eventoRegistrado?: boolean;
}
