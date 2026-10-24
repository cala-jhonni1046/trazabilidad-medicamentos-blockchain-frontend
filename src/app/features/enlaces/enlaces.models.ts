export type TipoOrganizacion = 'LABORATORIO' | 'DISTRIBUIDOR' | 'FARMACIA';
export type EstadoEnlace = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';

/** Organización tal como la devuelve GET /api/organizaciones/cuit/{cuit}. */
export interface OrganizacionLite {
  id: number;
  cuit: string;
  nombre: string;
  tipo: TipoOrganizacion;
}

/** Refleja EnlaceCUITResponseDTO del backend. */
export interface EnlaceDto {
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
  inspectorAprobadorId?: number | null;
  inspectorAprobadorNombre?: string | null;
  numeroDisposicionANMAT?: string | null;
  documentoCertificadoUrl?: string | null;
  estado: EstadoEnlace;
  fechaSolicitud?: string | null;
  fechaAprobacionANMAT?: string | null;
}

/**
 * Refleja EnlaceCUITRequestDTO para el alta. No se envían estado, inspector ni fechas:
 * el backend las rechaza o las asigna él (el enlace nace siempre PENDIENTE).
 */
export interface EnlaceRequest {
  laboratorioId: number;
  distribuidorId: number;
  farmaciaId: number;
  numeroDisposicionANMAT?: string | null;
  documentoCertificadoUrl?: string | null;
}

export type SlotKey = 'laboratorio' | 'distribuidor' | 'farmacia';

export interface SlotConfig {
  key: SlotKey;
  label: string;
  tipo: TipoOrganizacion;
  tipoLabel: string;
}

export const SLOTS: SlotConfig[] = [
  { key: 'laboratorio', label: 'CUIT del laboratorio', tipo: 'LABORATORIO', tipoLabel: 'laboratorio' },
  { key: 'distribuidor', label: 'CUIT del distribuidor', tipo: 'DISTRIBUIDOR', tipoLabel: 'distribuidor' },
  { key: 'farmacia', label: 'CUIT de la farmacia', tipo: 'FARMACIA', tipoLabel: 'farmacia' },
];

export const TIPO_LABELS: Record<TipoOrganizacion, string> = {
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidor',
  FARMACIA: 'Farmacia',
};

export type EstadoResolucion = 'vacio' | 'buscando' | 'ok' | 'error';

export interface Resolucion {
  estado: EstadoResolucion;
  org?: OrganizacionLite;
  mensaje?: string;
}
