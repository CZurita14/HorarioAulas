/**
 * Configuración del tema adaptativo (cambia según la hora del día).
 *
 * Este es el único archivo que hay que tocar para ajustar los horarios de
 * cada ambiente visual — todo lo demás (interpolación, hook, variables CSS)
 * lee de acá. No hace falta tocar componentes para cambiar un horario.
 */

export type FranjaId = 'noche' | 'manana' | 'mediodia' | 'tarde';

export const ZONA_HORARIA = 'America/Guayaquil';

/**
 * Un punto en la cronología del día: a partir de este minuto (0-1440,
 * minutos desde medianoche) el tema "apunta" hacia esta franja. Entre dos
 * puntos con franjas distintas hay una transición gradual; entre dos puntos
 * con la MISMA franja el ambiente se queda fijo (sólido) en esa paleta.
 *
 * Cronología inicial (ver también el enunciado original):
 *   00:00–05:30  noche (sólido)
 *   05:30–07:00  transición noche → mañana
 *   07:00–11:00  mañana (sólido)
 *   11:00–14:00  transición mañana → mediodía
 *   14:00–16:30  transición mediodía → tarde (mediodía es un pico, no una
 *                franja sólida: la transición hacia tarde empieza de inmediato)
 *   16:30–18:30  transición tarde → noche (tarde también es un pico)
 *   18:30–24:00  noche (sólido)
 */
export const CRONOLOGIA: { minutos: number; franja: FranjaId }[] = [
  { minutos: 0, franja: 'noche' }, // 00:00
  { minutos: 5 * 60 + 30, franja: 'noche' }, // 05:30 — empieza transición a mañana
  { minutos: 7 * 60, franja: 'manana' }, // 07:00 — mañana ya llegó
  { minutos: 11 * 60, franja: 'manana' }, // 11:00 — empieza transición a mediodía
  { minutos: 14 * 60, franja: 'mediodia' }, // 14:00 — pico de mediodía, sigue derecho a tarde
  { minutos: 16 * 60 + 30, franja: 'tarde' }, // 16:30 — pico de tarde, sigue derecho a noche
  { minutos: 18 * 60 + 30, franja: 'noche' }, // 18:30 — noche ya llegó
  { minutos: 24 * 60, franja: 'noche' }, // 24:00 = 00:00, cierra el ciclo
];

/**
 * "Nitidez" de la transición de fondo/superficie (una curva logística
 * centrada en la mitad del tramo). Más alto = el cambio de color se nota
 * más concentrado en el centro del tramo (se siente menos "plano"); más
 * bajo = un degradado más repartido a lo largo de todo el tramo. No afecta
 * el contraste mínimo garantizado (eso está probado matemáticamente para
 * cualquier valor), sólo el ritmo visual.
 */
export const NITIDEZ_TRANSICION = 5;

export interface Paleta {
  /** Fondo de página. */
  bg: string;
  /** Segundo tono del degradado ambiental de fondo (sutil). */
  bgSuave: string;
  /** Fondo de tarjetas / superficies elevadas. */
  superficie: string;
  /** Bordes y separadores. */
  borde: string;
  /** Texto principal sobre superficie. */
  texto: string;
  /** Texto secundario/atenuado sobre superficie. */
  textoMuted: string;
  /** Morado institucional (botones y acentos de marca). */
  marca: string;
  /** Variante hover/activa de "marca". */
  marcaFuerte: string;
  /** Naranja institucional (acciones e indicadores importantes). */
  acento: string;
  /** Variante hover/activa de "acento". */
  acentoFuerte: string;
}

export const PALETAS: Record<FranjaId, Paleta> = {
  // Mañana: fondo lavanda claro, tarjetas blancas, sombras suaves.
  manana: {
    bg: '#f4f0f9',
    bgSuave: '#eae3f4',
    superficie: '#ffffff',
    borde: '#e2d9ee',
    texto: '#2c1547',
    textoMuted: '#6e5987',
    marca: '#2c1547',
    marcaFuerte: '#3b2259',
    acento: '#f57021',
    acentoFuerte: '#e05e10',
  },
  // Mediodía: blancos menos intensos, matices ligeramente cálidos.
  mediodia: {
    bg: '#faf7f1',
    bgSuave: '#f2e9d9',
    superficie: '#fffdfa',
    borde: '#ece0cf',
    texto: '#352047',
    textoMuted: '#6b5847',
    marca: '#2c1547',
    marcaFuerte: '#3b2259',
    acento: '#ea660f',
    acentoFuerte: '#cf590d',
  },
  // Tarde: atenuación progresiva hacia tonos morados, con un toque durazno sutil.
  tarde: {
    bg: '#ecdfea',
    bgSuave: '#f0d6bc',
    superficie: '#faf3f7',
    borde: '#dcc5d7',
    texto: '#3a1f4d',
    textoMuted: '#64495f',
    marca: '#3a1f55',
    marcaFuerte: '#4e2d6e',
    acento: '#e86526',
    acentoFuerte: '#cc571f',
  },
  // Noche: fondo morado profundo, tarjetas oscuras y textos claros.
  noche: {
    bg: '#150b24',
    bgSuave: '#211336',
    superficie: '#26163d',
    borde: '#3b2259',
    texto: '#f5f0fb',
    textoMuted: '#b7a7cc',
    marca: '#8a4ed9',
    marcaFuerte: '#7839cc',
    acento: '#f57021',
    acentoFuerte: '#ff8a3d',
  },
};

/**
 * Las transiciones noche↔mañana y tarde↔noche cruzan de fondo oscuro a
 * claro (o viceversa). Interpolar el color de TEXTO en esos tramos (en vez
 * de tratarlo aparte) pasa inevitablemente por un punto de contraste casi
 * nulo a mitad de camino — es una consecuencia matemática de mezclar
 * "texto claro sobre fondo oscuro" con "texto oscuro sobre fondo claro".
 * Por eso, sólo en estos dos tramos, el texto usa un color neutro
 * (blanco/negro puro, el que dé más contraste en cada instante) elegido
 * por separado para lo que va sobre `bg` y lo que va sobre `superficie` —
 * matemáticamente, así el contraste nunca baja de ~4.5:1. El resto de
 * transiciones (mañana↔mediodía↔tarde) son todas "de día" y el texto de
 * marca interpola sin problema.
 */
export const TRANSICIONES_CRUZADAS: ReadonlySet<string> = new Set([
  'noche->manana',
  'tarde->noche',
]);

export const NEUTRO_OSCURO = '#050308';
export const NEUTRO_CLARO = '#ffffff';
