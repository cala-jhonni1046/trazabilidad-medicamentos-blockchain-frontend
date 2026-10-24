export type EstadoConformidad = 'CONFORME' | 'OBSERVADA' | 'RECHAZADA';

export interface RecepcionFarmaciaRequest {
  numeroComprobante: string;
  fechaHoraRecepcion?: string | null;
  farmaciaId: number;
  farmaceuticoResponsable?: string | null;
  despachoLogisticoId: number;
  estadoConformidad: EstadoConformidad;
  cadenaFrioIntacta: boolean;
  observaciones?: string | null;
}

export interface RecepcionFarmaciaResponse {
  id: number;
  numeroComprobante: string;
  fechaHoraRecepcion?: string | null;
  farmaciaId: number;
  farmaciaCuit?: string | null;
  farmaciaNombre?: string | null;
  farmaceuticoResponsable?: string | null;
  despachoLogisticoId: number;
  numeroRemito?: string | null;
  estadoConformidad: EstadoConformidad;
  cadenaFrioIntacta: boolean;
  observaciones?: string | null;
  fechaCreacion?: string | null;
  fechaActualizacion?: string | null;
}
