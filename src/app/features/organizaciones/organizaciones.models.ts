/** Refleja TipoOrganizacion del backend. */
export type TipoOrganizacion = 'LABORATORIO' | 'DISTRIBUIDOR' | 'FARMACIA';

/** Refleja OrganizacionResponseDTO del backend. */
export interface OrganizacionDto {
  id: number;
  cuit: string;
  nombre: string;
  tipo: TipoOrganizacion;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

/** Refleja OrganizacionRequestDTO del backend. */
export interface OrganizacionRequest {
  cuit: string;
  nombre: string;
  tipo: TipoOrganizacion;
}

export const TIPOS_ORGANIZACION: TipoOrganizacion[] = ['LABORATORIO', 'DISTRIBUIDOR', 'FARMACIA'];

export const TIPO_LABELS: Record<TipoOrganizacion, string> = {
  LABORATORIO: 'Laboratorio',
  DISTRIBUIDOR: 'Distribuidor',
  FARMACIA: 'Farmacia',
};

export const TIPO_ICONS: Record<TipoOrganizacion, string> = {
  LABORATORIO: 'science',
  DISTRIBUIDOR: 'local_shipping',
  FARMACIA: 'local_pharmacy',
};
