import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaAr',
  standalone: true,
})
export class FechaArPipe implements PipeTransform {
  transform(
    value: string | number | Date | null | undefined,
    format: 'corto' | 'completo' | 'hora' = 'completo',
  ): string {
    if (!value) return '—';

    const fecha = new Date(value);
    if (isNaN(fecha.getTime())) return String(value);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dia = pad(fecha.getDate());
    const mes = pad(fecha.getMonth() + 1);
    const anio = fecha.getFullYear();
    const hora = pad(fecha.getHours());
    const min = pad(fecha.getMinutes());

    if (format === 'corto') {
      return `${dia}/${mes}/${anio}`;
    }
    if (format === 'hora') {
      return `${hora}:${min}`;
    }
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
  }
}
