import { useEffect, useMemo, useState } from 'react';
import { calcularColoresTema, canalesSolidos, ColoresTemaCss, EstadoTema } from './calcularColoresTema';
import { FranjaId } from './temaConfig';

export type ModoTema = 'auto' | 'claro' | 'oscuro';

const CLAVE_STORAGE = 'horario-aulas:modo-tema';

function leerModoGuardado(): ModoTema {
  try {
    const valor = window.localStorage.getItem(CLAVE_STORAGE);
    if (valor === 'auto' || valor === 'claro' || valor === 'oscuro') return valor;
  } catch {
    // localStorage no disponible (navegación privada, permisos, etc.) — seguimos con 'auto'.
  }
  return 'auto';
}

function guardarModo(modo: ModoTema) {
  try {
    window.localStorage.setItem(CLAVE_STORAGE, modo);
  } catch {
    // Si no se puede guardar, la app sigue funcionando igual — solo no recuerda la elección.
  }
}

const MAPA_VARIABLES: Record<keyof ColoresTemaCss, string> = {
  bg: '--color-bg',
  bgSuave: '--color-bg-soft',
  superficie: '--color-surface',
  borde: '--color-border',
  texto: '--color-text',
  textoMuted: '--color-text-muted',
  textoEnBg: '--color-text-on-bg',
  textoMutedEnBg: '--color-text-muted-on-bg',
  marca: '--color-brand',
  marcaFuerte: '--color-brand-strong',
  acento: '--color-accent',
  acentoFuerte: '--color-accent-strong',
};

function aplicarVariablesCss(colores: ColoresTemaCss) {
  const raiz = document.documentElement.style;
  (Object.keys(colores) as (keyof ColoresTemaCss)[]).forEach((clave) => {
    raiz.setProperty(MAPA_VARIABLES[clave], colores[clave]);
  });
}

export interface UseTemaAdaptativoResultado {
  modo: ModoTema;
  setModo: (modo: ModoTema) => void;
  /** Franja visual más cercana al instante actual (para mostrar al usuario). */
  franjaActual: FranjaId;
  enTransicion: boolean;
}

/**
 * Hook del tema adaptativo. Reutiliza el reloj que ya tiene la app (`fecha`,
 * que se actualiza cada minuto y al volver a la pestaña — ver App.tsx) en
 * vez de armar un timer propio. `fechaSimulada`, si se pasa, reemplaza SOLO
 * el cálculo del tema (no toca `fecha` real) — la usa el panel de
 * previsualización en desarrollo.
 */
export function useTemaAdaptativo(fecha: Date, fechaSimulada: Date | null = null): UseTemaAdaptativoResultado {
  const [modo, setModoState] = useState<ModoTema>(() => leerModoGuardado());

  const setModo = (nuevo: ModoTema) => {
    setModoState(nuevo);
    guardarModo(nuevo);
  };

  const estado: EstadoTema = useMemo(() => {
    if (modo === 'claro') return { colores: canalesSolidos('manana'), franjaCercana: 'manana', enTransicion: false };
    if (modo === 'oscuro') return { colores: canalesSolidos('noche'), franjaCercana: 'noche', enTransicion: false };
    return calcularColoresTema(fechaSimulada ?? fecha);
  }, [modo, fecha, fechaSimulada]);

  useEffect(() => {
    aplicarVariablesCss(estado.colores);
  }, [estado.colores]);

  // Los tokens institucionales (bg, surface, text, accent...) ya se
  // calculan de forma continua vía variables CSS. La clase .dark en <html>
  // queda solo para los indicadores semánticos universales de Tailwind
  // (verde/rojo/ámbar: "clase en curso", errores, advertencias) que usan
  // dark: y necesitan un interruptor binario — se activa en la franja
  // "noche" (sólida o ya cruzada en una transición).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', estado.franjaCercana === 'noche');
  }, [estado.franjaCercana]);

  return { modo, setModo, franjaActual: estado.franjaCercana, enTransicion: estado.enTransicion };
}
