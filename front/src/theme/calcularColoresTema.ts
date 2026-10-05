import {
  CRONOLOGIA,
  FranjaId,
  NEUTRO_CLARO,
  NEUTRO_OSCURO,
  NITIDEZ_TRANSICION,
  PALETAS,
  TRANSICIONES_CRUZADAS,
  ZONA_HORARIA,
} from './temaConfig';
import { curvaLogistica, elegirMayorContraste, hexATripletaCss, mezclarColorHex, rgbAHex, rgbATripletaCss } from './colorMath';

/** Nombres de las variables CSS que expone el tema (todas en triplete "r g b"). */
export interface ColoresTemaCss {
  bg: string;
  bgSuave: string;
  superficie: string;
  borde: string;
  texto: string;
  textoMuted: string;
  textoEnBg: string;
  textoMutedEnBg: string;
  marca: string;
  marcaFuerte: string;
  acento: string;
  acentoFuerte: string;
}

export interface EstadoTema {
  colores: ColoresTemaCss;
  /** Franja "ancla" más cercana (para mostrar al usuario, ej. en el panel de previsualización). */
  franjaCercana: FranjaId;
  enTransicion: boolean;
}

/**
 * Guayaquil no tiene horario de verano, así que su offset es siempre
 * UTC-5 — construir una fecha a partir de "minutos del día en Guayaquil"
 * es una simple resta de horas, sin necesitar parsear strings localizadas.
 * Solo la usa el panel de previsualización en desarrollo (ver App.tsx).
 */
export function construirFechaConMinutosGuayaquil(minutosDia: number, fechaBase: Date): Date {
  const OFFSET_GUAYAQUIL_MIN = 5 * 60;
  const minutosUtc = ((Math.round(minutosDia) + OFFSET_GUAYAQUIL_MIN) % 1440 + 1440) % 1440;
  const resultado = new Date(fechaBase);
  resultado.setUTCHours(Math.floor(minutosUtc / 60), minutosUtc % 60, 0, 0);
  return resultado;
}

/** Minutos desde medianoche (0–1439.99) de `fecha`, en la zona horaria de Guayaquil. */
export function minutosDelDiaEnGuayaquil(fecha: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(fecha);

  const obtener = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? '0');
  const horas = obtener('hour') % 24; // Intl puede dar "24" para medianoche en hour12:false
  const minutos = obtener('minute');
  const segundos = obtener('second');
  return horas * 60 + minutos + segundos / 60;
}

export function canalesSolidos(franja: FranjaId): ColoresTemaCss {
  const p = PALETAS[franja];
  return {
    bg: hexATripletaCss(p.bg),
    bgSuave: hexATripletaCss(p.bgSuave),
    superficie: hexATripletaCss(p.superficie),
    borde: hexATripletaCss(p.borde),
    texto: hexATripletaCss(p.texto),
    textoMuted: hexATripletaCss(p.textoMuted),
    textoEnBg: hexATripletaCss(p.texto),
    textoMutedEnBg: hexATripletaCss(p.textoMuted),
    marca: hexATripletaCss(p.marca),
    marcaFuerte: hexATripletaCss(p.marcaFuerte),
    acento: hexATripletaCss(p.acento),
    acentoFuerte: hexATripletaCss(p.acentoFuerte),
  };
}

/** Calcula los colores del tema para un instante dado (ver temaConfig.ts para ajustar horarios). */
export function calcularColoresTema(fecha: Date): EstadoTema {
  const minutos = minutosDelDiaEnGuayaquil(fecha);

  for (let i = 0; i < CRONOLOGIA.length - 1; i++) {
    const a = CRONOLOGIA[i];
    const b = CRONOLOGIA[i + 1];
    if (minutos < a.minutos || minutos > b.minutos) continue;

    // Tramo sólido: misma franja en ambos extremos, nada que interpolar.
    if (a.franja === b.franja) {
      return { colores: canalesSolidos(a.franja), franjaCercana: a.franja, enTransicion: false };
    }

    const t = (minutos - a.minutos) / (b.minutos - a.minutos);
    const tFondo = curvaLogistica(t, NITIDEZ_TRANSICION);
    const pa = PALETAS[a.franja];
    const pb = PALETAS[b.franja];

    const mezclar = (clave: keyof typeof pa) => rgbATripletaCss(mezclarColorHex(pa[clave], pb[clave], tFondo));

    const esCruce = TRANSICIONES_CRUZADAS.has(`${a.franja}->${b.franja}`);

    let texto: string;
    let textoMuted: string;
    let textoEnBg: string;
    let textoMutedEnBg: string;

    if (esCruce) {
      // Fondo oscuro <-> claro: el texto no se mezcla (ver TRANSICIONES_CRUZADAS
      // en temaConfig.ts) — se elige blanco o negro puro según cuál da más
      // contraste contra el color ya interpolado, por separado para
      // "superficie" (tarjetas) y para "bg" (fondo de página).
      const superficieHex = rgbAHex(mezclarColorHex(pa.superficie, pb.superficie, tFondo));
      const bgHex = rgbAHex(mezclarColorHex(pa.bg, pb.bg, tFondo));

      const sobreSuperficie = elegirMayorContraste(superficieHex, NEUTRO_OSCURO, NEUTRO_CLARO);
      const sobreBg = elegirMayorContraste(bgHex, NEUTRO_OSCURO, NEUTRO_CLARO);

      texto = hexATripletaCss(sobreSuperficie);
      textoMuted = texto;
      textoEnBg = hexATripletaCss(sobreBg);
      textoMutedEnBg = textoEnBg;
    } else {
      // Transición "de día" (mañana↔mediodía↔tarde): ambos extremos ya
      // tienen de por sí buen contraste con fondos claros, así que el
      // texto de marca puede mezclarse sin pasar por ninguna zona de
      // contraste bajo.
      texto = mezclar('texto');
      textoMuted = mezclar('textoMuted');
      textoEnBg = texto;
      textoMutedEnBg = textoMuted;
    }

    const colores: ColoresTemaCss = {
      bg: mezclar('bg'),
      bgSuave: mezclar('bgSuave'),
      superficie: mezclar('superficie'),
      borde: mezclar('borde'),
      texto,
      textoMuted,
      textoEnBg,
      textoMutedEnBg,
      marca: mezclar('marca'),
      marcaFuerte: mezclar('marcaFuerte'),
      acento: mezclar('acento'),
      acentoFuerte: mezclar('acentoFuerte'),
    };

    const franjaCercana = t < 0.5 ? a.franja : b.franja;
    return { colores, franjaCercana, enTransicion: true };
  }

  // No debería llegar acá (CRONOLOGIA cubre 0–1440 completo), pero por las
  // dudas: noche sólida como respaldo.
  return { colores: canalesSolidos('noche'), franjaCercana: 'noche', enTransicion: false };
}
