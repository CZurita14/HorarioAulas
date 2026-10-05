import React, { useState } from 'react';
import { Clock3, X } from 'lucide-react';

interface TemaDevPreviewProps {
  /** Hora simulada actual en minutos (0–1439), o null si no se está simulando. */
  minutosSimulados: number | null;
  onCambiarMinutos: (minutos: number | null) => void;
  franjaActual: string;
}

function formatearMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor(minutos % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Panel solo de desarrollo: un deslizador 00:00–23:59 para ver cómo se ve
 * el tema a cualquier hora, sin tocar el reloj real ni la lógica de clases
 * (ver App.tsx: arma una fecha simulada de hoy con esta hora y se la pasa
 * solo al hook de tema — `fecha` sigue siendo la real para todo lo demás).
 * No se renderiza en producción (ver dónde se usa en App.tsx).
 */
export const TemaDevPreview: React.FC<TemaDevPreviewProps> = ({ minutosSimulados, onCambiarMinutos, franjaActual }) => {
  const [abierto, setAbierto] = useState(false);
  const simulando = minutosSimulados !== null;

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center space-x-1.5 px-3 py-2 rounded-full bg-amber-500 text-black text-xs font-bold shadow-lg hover:bg-amber-400 motion-safe:transition-colors"
      >
        <Clock3 className="w-4 h-4" />
        <span>Simular hora (dev)</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-amber-500 bg-black/90 backdrop-blur text-white p-4 shadow-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-bold uppercase tracking-wide">
          <Clock3 className="w-4 h-4" />
          <span>Previsualización de tema (solo dev)</span>
        </div>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-white/60 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {simulando && (
        <div className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-lg px-2 py-1">
          ⚠ Mostrando una simulación — no es la hora real.
        </div>
      )}

      <div className="flex items-center justify-between text-sm font-mono font-bold">
        <span>{formatearMinutos(minutosSimulados ?? 0)}</span>
        <span className="text-white/60 text-xs font-sans font-semibold uppercase">{franjaActual}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1439}
        step={1}
        value={minutosSimulados ?? 0}
        onChange={(e) => onCambiarMinutos(Number(e.target.value))}
        className="w-full accent-amber-500"
        aria-label="Hora simulada"
      />

      <button
        type="button"
        onClick={() => onCambiarMinutos(null)}
        disabled={!simulando}
        className="w-full text-xs font-bold py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition-colors"
      >
        Volver a la hora actual
      </button>
    </div>
  );
};
