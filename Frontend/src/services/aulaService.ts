export interface BloqueAula {
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string;
  horaFin: string;
  materia: string;
  docente: string;
  carrera: string;
  nivel: string;
  paralelo: string;
}

export interface DatosAula {
  aula: string;
  campus: string;
  capacidad: number;
  bloques: BloqueAula[];
}

// Carga estática en tiempo de empaquetado de las 37 aulas
const modulos = import.meta.glob<DatosAula>('../../../back/data/*.json', { eager: true, import: 'default' });

const aulasPorId: Record<string, DatosAula> = {};
for (const ruta in modulos) {
  const datos = modulos[ruta];
  if (datos && datos.aula) {
    aulasPorId[datos.aula.toUpperCase()] = datos;
  }
}

export const AULA_POR_DEFECTO = 'A4';

export function obtenerIdAulaDesdeUrl(url = typeof window !== 'undefined' ? window.location.href : ''): string | null {
  try {
    const parametro = new URL(url).searchParams.get('aula');
    return parametro ? parametro.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function obtenerDatosAula(idAula: string | null = obtenerIdAulaDesdeUrl()): DatosAula | null {
  const id = (idAula ?? AULA_POR_DEFECTO).toUpperCase();
  return aulasPorId[id] ?? null;
}

export function obtenerAulasDisponibles(): string[] {
  return Object.keys(aulasPorId).sort();
}
