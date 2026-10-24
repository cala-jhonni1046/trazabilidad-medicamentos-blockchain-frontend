/** Tipos propios de F33, reflejando docs/api.md. */

export type EstadoEnlace = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';

/** Refleja EnlaceCUITResponseDTO. */
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
  estado: EstadoEnlace;
  fechaAprobacionANMAT?: string | null;
}

/** Refleja LoteResponseDTO (campos que usa esta pantalla). */
export interface LoteDto {
  id: number;
  codigoLote: string;
  estado: string;
  laboratorioId: number;
  medicamentoNombre?: string | null;
}

/** Refleja DespachoLogisticoResponseDTO (campos que usa esta pantalla). */
export interface DespachoDto {
  id: number;
  numeroRemito: string;
  loteId: number;
  distribuidorId: number;
  enlaceCuitId: number;
  estado: string;
}

/** Refleja EventoCustodiaResponseDTO. */
export interface EventoCustodiaDto {
  id: number;
  tipo: string;
  fechaHoraEvento: string;
  despachoLogisticoId: number;
  descripcion?: string | null;
  hashAnterior: string | null;
  hashEvento: string | null;
}

export type EstadoAnclaje = 'PENDIENTE' | 'ENVIADO' | 'CONFIRMADO' | 'FALLIDO';

/** Refleja RegistroBlockchainResponseDTO. Es un CRUD de metadatos declarados, no una red real. */
export interface RegistroBlockchainDto {
  id: number;
  transactionHash: string;
  bloque: number | null;
  firmaInspectorANMAT?: string | null;
  timestamp?: string | null;
  confirmado: boolean;
  fechaCreacion: string;
}

/** Refleja RegistroBlockchainRequestDTO. Sin Bean Validation en el backend (ver docs/api.md). */
export interface RegistroBlockchainRequest {
  transactionHash: string;
  bloque?: number;
  firmaInspectorANMAT?: string;
  confirmado?: boolean;
}

/** Resultado de verificarEncadenamiento: continuidad de hashAnterior → hashEvento. */
export interface ResultadoEncadenamiento {
  ok: boolean;
  /** true cuando falta algún hash y por eso no se puede afirmar continuidad (no es lo mismo que "roto"). */
  noVerificable: boolean;
  /** Índice (0-based) del evento donde se detectó la ruptura, si la hay. */
  indiceRuptura: number | null;
}

/** Cadena trazable para la tabla de /cadenas: un enlace ACTIVO con sus lotes y despachos. */
export interface CadenaResumen {
  enlace: EnlaceDto;
  lotes: LoteDto[];
  despachos: DespachoDto[];
}
