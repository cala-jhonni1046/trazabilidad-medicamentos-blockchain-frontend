import { DespachoLogistico } from '../despachos/despachos.models';

export interface TelemetriaGPS {
  id: number;
  despachoLogisticoId: number;
  latitud: number;
  longitud: number;
  altitud?: number | null;
  velocidad?: number | null;
  dispositivoGpsId?: string | null;
  direccionAproximada?: string | null;
  fechaHora: string;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface TelemetriaGPSRequest {
  despachoLogisticoId: number;
  latitud: number;
  longitud: number;
  velocidad?: number | null;
  altitud?: number | null;
  dispositivoGpsId?: string | null;
  direccionAproximada?: string | null;
  fechaHora: string;
}

export interface TelemetriaTemperatura {
  id: number;
  despachoLogisticoId: number;
  sensorId: string;
  temperatura: number;
  alertaExcursion?: boolean | null;
  observaciones?: string | null;
  fechaHora: string;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}

export interface TelemetriaTemperaturaRequest {
  despachoLogisticoId: number;
  sensorId: string;
  temperatura: number;
  fechaHora: string;
  observaciones?: string | null;
}

export interface DespachoEnTransito extends DespachoLogistico {}
