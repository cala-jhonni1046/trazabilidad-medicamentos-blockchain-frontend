/**
 * Tipos de dominio idénticos que usan dos o más features. Los DTO de cada pantalla
 * (EnlaceDto, DespachoDto, EventoCustodiaDto, ...) siguen en su feature: cada una
 * modela solo los campos del contrato que consume.
 */
export type TipoOrganizacion = 'LABORATORIO' | 'DISTRIBUIDOR' | 'FARMACIA';
export type EstadoEnlace = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO';
export type EstadoConformidad = 'CONFORME' | 'OBSERVADA' | 'RECHAZADA';
export type EstadoUnidad = 'DISPONIBLE' | 'DISPENSADA' | 'BLOQUEADA' | string;
