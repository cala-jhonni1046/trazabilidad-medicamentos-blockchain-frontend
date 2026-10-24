import { Lote } from '../lotes/lotes.models';
import { EnlaceDto } from '../enlaces/enlaces.models';

export interface DespachoLaboratorio {
  id: number;
  loteId: number;
  codigoLote?: string;
  numeroRemito?: string;
  distribuidorId?: number;
  distribuidorNombre?: string;
  distribuidorCuit?: string;
  farmaciaDestinoId?: number;
  farmaciaDestinoNombre?: string;
  patente?: string;
  patenteVehiculo?: string;
  estado?: string;
  fechaSalida?: string | null;
}

export interface CuarentenaAbierta {
  id: number;
  loteId: number;
  codigoLote?: string;
  motivo?: string;
  estado: string;
  fechaInicio: string;
}

export interface MonitoreoLoteFila {
  lote: Lote;
  cantidadUnidades: number | null;
  despacho?: DespachoLaboratorio | null;
  enlace?: EnlaceDto | null;
  cuarentenaAbierta?: CuarentenaAbierta | null;
}

export interface MetricaLaboratorio {
  titulo: string;
  valor: number | null;
  detalle: string;
  icono: string;
}
