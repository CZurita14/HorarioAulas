// Cada aula tiene su propio archivo back/data/<ID>.json (mismo esquema),
// generado a partir de SharePoint por los scripts de /consumos. Vite los
// importa todos en build time; así, agregar una aula nueva es solo agregar
// su JSON en back/data/ sin tocar este archivo.
const modulos = import.meta.glob('../../back/data/*.json', { eager: true });

const aulasPorId = {};
for (const ruta in modulos) {
  const datos = modulos[ruta].default ?? modulos[ruta];
  aulasPorId[datos.aula.toUpperCase()] = datos;
}

const AULA_POR_DEFECTO = 'A4';

export function obtenerIdAulaDesdeUrl(url = window.location.href) {
  const parametro = new URL(url).searchParams.get('aula');
  return parametro ? parametro.toUpperCase() : null;
}

export function obtenerDatosAula(idAula = obtenerIdAulaDesdeUrl()) {
  // Sin parámetro en la URL (QR antiguo que apunta a la raíz): usamos el
  // aula por defecto. Con parámetro pero aula desconocida: no hay fallback
  // silencioso, se reporta como no encontrada para detectar QRs mal armados.
  const id = (idAula ?? AULA_POR_DEFECTO).toUpperCase();
  return aulasPorId[id] ?? null;
}

export function obtenerAulasDisponibles() {
  return Object.keys(aulasPorId).sort();
}
