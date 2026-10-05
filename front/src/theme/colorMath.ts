/**
 * Matemática de color pura para el tema adaptativo — sin dependencias,
 * sin estado. Todo en términos de "#rrggbb" de entrada/salida, salvo
 * donde se indica.
 */

export type RGB = [number, number, number];

export function hexARgb(hex: string): RGB {
  const limpio = hex.replace('#', '');
  const n = parseInt(limpio, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbATripletaCss([r, g, b]: RGB): string {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

function canalAHex(c: number): string {
  return Math.round(Math.max(0, Math.min(255, c)))
    .toString(16)
    .padStart(2, '0');
}

export function rgbAHex([r, g, b]: RGB): string {
  return `#${canalAHex(r)}${canalAHex(g)}${canalAHex(b)}`;
}

export function hexATripletaCss(hex: string): string {
  return rgbATripletaCss(hexARgb(hex));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mezclarColorHex(hexA: string, hexB: string, t: number): RGB {
  const [r1, g1, b1] = hexARgb(hexA);
  const [r2, g2, b2] = hexARgb(hexB);
  return [lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t)];
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Curva logística centrada en 0.5: 0 en los extremos, transición
 * concentrada en el centro del tramo. `nitidez` más alto = cambio más
 * concentrado (curva más "en S" cerrada); más bajo = más repartido.
 */
export function curvaLogistica(t: number, nitidez: number): number {
  const x = (clamp01(t) - 0.5) * nitidez;
  return 1 / (1 + Math.exp(-x));
}

function canalLinealSrgb(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa WCAG (0 = negro, 1 = blanco). */
export function luminanciaRelativa([r, g, b]: RGB): number {
  const [R, G, B] = [r, g, b].map(canalLinealSrgb);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Razón de contraste WCAG entre dos colores (siempre >= 1). */
export function razonContraste(a: RGB, b: RGB): number {
  const la = luminanciaRelativa(a);
  const lb = luminanciaRelativa(b);
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return (alto + 0.05) / (bajo + 0.05);
}

/**
 * De entre dos colores candidatos, el que da mayor contraste contra `fondo`.
 * Se usa para elegir texto neutro (blanco/negro) durante los cruces
 * oscuro↔claro del tema.
 */
export function elegirMayorContraste(fondoHex: string, candidatoAHex: string, candidatoBHex: string): string {
  const fondo = hexARgb(fondoHex);
  const ca = razonContraste(hexARgb(candidatoAHex), fondo);
  const cb = razonContraste(hexARgb(candidatoBHex), fondo);
  return ca >= cb ? candidatoAHex : candidatoBHex;
}
