import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Lote } from '../lotes/lotes.models';
import {
  CuarentenaDto,
  DespachoDto,
  DispensacionDto,
  EventoCustodiaDto,
  HistorialPaso,
  HistorialUnidad,
  RecepcionFarmaciaDto,
  UnidadTrazableDto,
} from './unidades.models';

@Injectable({ providedIn: 'root' })
export class UnidadesApiService {
  private readonly http = inject(HttpClient);

  obtenerPorQr(codigoQr: string): Observable<UnidadTrazableDto> {
    return this.http.get<UnidadTrazableDto>(
      `/api/unidades-trazables/qr/${encodeURIComponent(codigoQr.trim())}`,
    );
  }

  listar(loteId?: number, estado?: string): Observable<UnidadTrazableDto[]> {
    let params = new HttpParams();
    if (loteId != null) {
      params = params.set('loteId', String(loteId));
    }
    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }
    return this.http.get<UnidadTrazableDto[]>('/api/unidades-trazables', { params });
  }

  obtenerLote(id: number): Observable<Lote> {
    return this.http.get<Lote>(`/api/lotes/${id}`);
  }

  obtenerDespachosPorLote(loteId: number): Observable<DespachoDto[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<DespachoDto[]>('/api/despachos-logisticos', { params });
  }

  obtenerEventosCustodia(despachoId: number): Observable<EventoCustodiaDto[]> {
    return this.http.get<EventoCustodiaDto[]>(
      `/api/despachos-logisticos/${despachoId}/eventos`,
    );
  }

  obtenerCuarentenasPorLote(loteId: number): Observable<CuarentenaDto[]> {
    const params = new HttpParams().set('loteId', String(loteId));
    return this.http.get<CuarentenaDto[]>('/api/cuarentenas', { params });
  }

  obtenerDispensacion(unidadId: number): Observable<DispensacionDto | null> {
    return this.http
      .get<DispensacionDto>(`/api/dispensaciones/unidad/${unidadId}`)
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of(null);
          }
          return of(null);
        }),
      );
  }

  obtenerRecepcionPorDespacho(despachoId: number): Observable<RecepcionFarmaciaDto[]> {
    const params = new HttpParams().set('despachoLogisticoId', String(despachoId));
    return this.http
      .get<RecepcionFarmaciaDto[]>('/api/recepciones-farmacia', { params })
      .pipe(
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            return of([]);
          }
          return of([]);
        }),
      );
  }

  construirHistorial(codigoQr: string): Observable<HistorialUnidad> {
    return this.obtenerPorQr(codigoQr).pipe(
      switchMap((unidad) => {
        return forkJoin({
          lote: this.obtenerLote(unidad.loteId).pipe(catchError(() => of(null))),
          cuarentenas: this.obtenerCuarentenasPorLote(unidad.loteId).pipe(
            catchError(() => of([])),
          ),
          despachos: this.obtenerDespachosPorLote(unidad.loteId).pipe(
            catchError(() => of([])),
          ),
          dispensacion: this.obtenerDispensacion(unidad.id),
        }).pipe(
          switchMap(({ lote, cuarentenas, despachos, dispensacion }) => {
            // Para cada despacho, consultamos eventos y recepciones en paralelo
            if (despachos.length === 0) {
              const pasos = this.generarPasos(
                unidad,
                lote,
                cuarentenas,
                [],
                [],
                [],
                dispensacion,
              );
              return of({ unidad, lote, pasos });
            }

            const eventos$ = despachos.map((d) =>
              this.obtenerEventosCustodia(d.id).pipe(catchError(() => of([]))),
            );
            const recepciones$ = despachos.map((d) =>
              this.obtenerRecepcionPorDespacho(d.id).pipe(catchError(() => of([]))),
            );

            return forkJoin({
              eventosPorDespacho: forkJoin(eventos$),
              recepcionesPorDespacho: forkJoin(recepciones$),
            }).pipe(
              map(({ eventosPorDespacho, recepcionesPorDespacho }) => {
                const todosEventos = eventosPorDespacho.flat();
                const todasRecepciones = recepcionesPorDespacho.flat();
                const pasos = this.generarPasos(
                  unidad,
                  lote,
                  cuarentenas,
                  despachos,
                  todosEventos,
                  todasRecepciones,
                  dispensacion,
                );
                return { unidad, lote, pasos };
              }),
            );
          }),
        );
      }),
    );
  }

  private generarPasos(
    unidad: UnidadTrazableDto,
    lote: Lote | null,
    cuarentenas: CuarentenaDto[],
    despachos: DespachoDto[],
    eventos: EventoCustodiaDto[],
    recepciones: RecepcionFarmaciaDto[],
    dispensacion: DispensacionDto | null,
  ): HistorialPaso[] {
    const pasos: HistorialPaso[] = [];

    // 1. Fabricación
    if (lote) {
      pasos.push({
        fecha: lote.fechaHoraFabricacion || lote.fechaCreacion || 'Fecha inicial',
        tipo: 'FABRICACION',
        titulo: 'Fabricación y generación de unidad QR',
        detalle: `Fabricado por ${lote.laboratorioNombre || 'Laboratorio'} · Fármaco: ${lote.medicamentoNombre || 'Medicamento'}. Lote ${lote.codigoLote}.`,
        estado: lote.estado,
      });
    }

    // 2. Cuarentenas
    for (const c of cuarentenas) {
      pasos.push({
        fecha: c.fechaInicio,
        tipo: 'CUARENTENA',
        titulo: `Cuarentena ${c.estado === 'ABIERTA' ? 'abierta' : 'resuelta'}`,
        detalle: c.motivo
          ? `Motivo: ${c.motivo}${c.resolucion ? ` · Resolución: ${c.resolucion}` : ''}`
          : 'Lote ingresado en cuarentena regulatoria por ANMAT.',
        estado: c.estado,
        esCuarentena: true,
      });
    }

    // 3. Despachos
    for (const d of despachos) {
      pasos.push({
        fecha: d.fechaSalida || 'Fecha en tránsito',
        tipo: 'DESPACHO',
        titulo: `Despacho logístico ${d.numeroRemito ? `#${d.numeroRemito}` : ''}`,
        detalle: `Distribuidor: ${d.distribuidorNombre || 'Transportista'} → Destino: ${d.farmaciaDestinoNombre || 'Farmacia'}.`,
        estado: d.estado,
      });
    }

    // 4. Eventos de custodia
    for (const ev of eventos) {
      pasos.push({
        fecha: ev.fechaHoraEvento,
        tipo: 'CUSTODIA',
        titulo: `Evento de custodia: ${ev.tipo}`,
        detalle: ev.descripcion || `Registrado por ${ev.organizacionActorNombre || 'operador'}.`,
        hashDemostrativo: ev.hashEvento,
      });
    }

    // 5. Recepción en farmacia
    for (const r of recepciones) {
      pasos.push({
        fecha: r.fechaRecepcion,
        tipo: 'RECEPCION',
        titulo: 'Recepción en farmacia',
        detalle: `Recibido en ${r.farmaciaNombre || 'Farmacia destino'}${r.temperaturaLlegada != null ? ` · Temp de llegada: ${r.temperaturaLlegada}°C` : ''}.`,
        estado: 'RECIBIDO',
      });
    }

    // 6. Dispensación (con estricto cuidado de privacidad: sin DNI)
    if (dispensacion) {
      pasos.push({
        fecha: dispensacion.fechaDispensacion,
        tipo: 'DISPENSACION',
        titulo: 'Dispensación a paciente',
        detalle: `Dispensada en ${dispensacion.farmaciaNombre || 'farmacia de la red'}. Verificación de trazabilidad completada. (Dato de paciente reservado por privacidad).`,
        estado: 'DISPENSADA',
      });
    }

    // Orden cronológico por fecha
    return pasos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}
