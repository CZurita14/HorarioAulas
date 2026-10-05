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

// Los datos ya no se importan en build time: se piden al backend (ver
// back/server/index.js), para que un admin pueda publicar un horario
// nuevo y que se refleje sin tener que reconstruir el sitio.

export const AULA_POR_DEFECTO = 'A4';

export function obtenerIdAulaDesdeUrl(url = typeof window !== 'undefined' ? window.location.href : ''): string | null {
  try {
    const parametro = new URL(url).searchParams.get('aula');
    return parametro ? parametro.toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function obtenerDatosAula(idAula: string | null): Promise<DatosAula | null> {
  const id = (idAula ?? AULA_POR_DEFECTO).toUpperCase();
  const resp = await fetch(`/api/aulas/${encodeURIComponent(id)}`);
  if (!resp.ok) return null;
  return resp.json();
}

export async function obtenerAulasDisponibles(): Promise<string[]> {
  const resp = await fetch('/api/aulas');
  if (!resp.ok) return [];
  return resp.json();
}
