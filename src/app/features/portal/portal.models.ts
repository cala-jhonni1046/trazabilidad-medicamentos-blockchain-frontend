/**
 * Tipos propios de F30, reflejando los DTO reales del backend (docs/api.md, sección
 * "Consulta Pública por Código QR" y "Reportes Ciudadanos"). Este feature tiene su
 * propio servicio y tipos.
 */

/** Proyección pública del medicamento dentro de ConsultaPublicaQRResponseDTO. */
export interface MedicamentoPublico {
  nombre: string;
  principioActivo: string;
  requiereCadenaFrio: boolean;
}

/** Proyección pública del lote. fechaFabricacion puede faltar. */
export interface LotePublico {
  codigoLote: string;
  fechaFabricacion: string | null;
  estadoLote: string;
}

/** Resumen fijo de cuarentena del lote; nunca expone el motivo libre interno. */
export interface CuarentenaPublica {
  enCuarentena: boolean;
  resumen: string | null;
  fechaInicio: string | null;
}

/** Hito de custodia con hash demostrativo (SHA-256 local, no blockchain distribuida). */
export interface EventoCustodiaPublico {
  tipoEvento: string;
  fechaHoraEvento: string;
  descripcion: string;
  hashDemostrativo: string | null;
}

/** Refleja ConsultaPublicaQRResponseDTO de GET /api/public/consulta-qr/{codigoQr}. */
export interface ConsultaPublicaQR {
  codigoConsultado: string;
  estadoUnidad: string;
  medicamento: MedicamentoPublico | null;
  lote: LotePublico | null;
  cuarentena: CuarentenaPublica | null;
  historialCustodia: EventoCustodiaPublico[];
  advertencias: string[];
  informacionRegulatoria: string;
}

/**
 * Refleja ReporteCiudadanoRequestDTO para el alta pública (POST /api/reportes-ciudadanos).
 * No se envía estado, inspector ni fecha: el backend los asigna (nace PENDIENTE).
 * No se pide ni se guarda ningún dato personal del paciente.
 */
export interface ReporteCiudadanoCreateRequest {
  motivoReporte: string;
  codigoUnicoQR?: string;
}

/** Refleja ReporteCiudadanoResponseDTO devuelto por el alta. */
export interface ReporteCiudadanoCreado {
  id: number;
  motivoReporte: string;
  fechaHoraReporte: string;
  estado: 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO';
  unidadTrazableId: number | null;
  codigoUnicoQR: string | null;
  inspectorAsignadoId: number | null;
  inspectorNombre: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}
