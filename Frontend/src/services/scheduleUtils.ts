import { BloqueAula } from './aulaService';

export const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
export type DiaSemana = typeof DIAS[number];

export const DIAS_LABORABLES: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const DIAS_LABORABLES_LABEL: Record<DiaSemana, string> = {
  domingo: 'Domingo',
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

export function obtenerDiaActual(fecha: Date = new Date()): DiaSemana {
  return DIAS[fecha.getDay()];
}

export function parseHora(horaStr: string): number {
  if (!horaStr) return 0;
  const [horas, minutos] = horaStr.split(':').map(Number);
  return (horas || 0) * 60 + (minutos || 0);
}

export function formatearHora12(fecha: Date): string {
  let horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const sufijo = horas >= 12 ? 'pm' : 'am';
  horas = horas % 12 || 12;
  return `${horas.toString().padStart(2, '0')}:${minutos} ${sufijo}`;
}

export function formatearDetalle(bloque: BloqueAula): string {
  return `Nivel ${bloque.nivel} · ${bloque.carrera} · Paralelo ${bloque.paralelo}`;
}

export function obtenerBloquesDia(bloques: BloqueAula[], dia: string): BloqueAula[] {
  return bloques
    .filter((b) => b.dia === dia)
    .slice()
    .sort((a, b) => parseHora(a.horaInicio) - parseHora(b.horaInicio));
}

export function obtenerClaseActual(bloquesDia: BloqueAula[], minutosActuales: number): BloqueAula | null {
  return (
    bloquesDia.find(
      (b) => parseHora(b.horaInicio) <= minutosActuales && minutosActuales < parseHora(b.horaFin)
    ) ?? null
  );
}

export function obtenerClaseSiguiente(bloquesDia: BloqueAula[], minutosActuales: number): BloqueAula | null {
  const futuros = bloquesDia.filter((b) => parseHora(b.horaInicio) > minutosActuales);
  if (futuros.length === 0) return null;
  return futuros.reduce((masCercana, b) =>
    parseHora(b.horaInicio) < parseHora(masCercana.horaInicio) ? b : masCercana
  );
}

export function agruparBloquesConsecutivos(bloquesDia: BloqueAula[]): BloqueAula[] {
  const resultado: BloqueAula[] = [];
  for (const bloque of bloquesDia) {
    const anterior = resultado[resultado.length - 1];
    const esContinuacion =
      anterior &&
      anterior.materia === bloque.materia &&
      anterior.docente === bloque.docente &&
      anterior.carrera === bloque.carrera &&
      anterior.nivel === bloque.nivel &&
      anterior.paralelo === bloque.paralelo &&
      parseHora(bloque.horaInicio) - parseHora(anterior.horaFin) === 1;

    if (esContinuacion) {
      resultado[resultado.length - 1] = { ...anterior, horaFin: bloque.horaFin };
    } else {
      resultado.push({ ...bloque });
    }
  }
  return resultado;
}

export function obtenerSegmentosLlenos(bloque: BloqueAula, minutosActuales: number, totalSegmentos = 14): number {
  const inicio = parseHora(bloque.horaInicio);
  const fin = parseHora(bloque.horaFin);
  const duracion = fin - inicio;
  if (duracion <= 0) return 0;
  const transcurrido = Math.min(Math.max(minutosActuales - inicio, 0), duracion);
  return Math.round((transcurrido / duracion) * totalSegmentos);
}
