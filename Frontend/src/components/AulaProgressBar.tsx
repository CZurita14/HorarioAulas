import React from 'react';
import { BloqueAula } from '../services/aulaService';
import { obtenerSegmentosLlenos } from '../services/scheduleUtils';

interface AulaProgressBarProps {
  bloque: BloqueAula;
  minutosActuales: number;
}

const TOTAL_SEGMENTOS = 14;

export const AulaProgressBar: React.FC<AulaProgressBarProps> = ({ bloque, minutosActuales }) => {
  const llenos = obtenerSegmentosLlenos(bloque, minutosActuales, TOTAL_SEGMENTOS);

  return (
    <div className="space-y-1.5 pt-2">
      <div
        className="h-3 rounded-sm overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TOTAL_SEGMENTOS}, minmax(0, 1fr))`,
          gap: '4px',
        }}
      >
        {Array.from({ length: TOTAL_SEGMENTOS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-sm transition-all duration-500 ${
              i < llenos
                ? 'bg-[#f57021] shadow-sm'
                : 'bg-[#e2d9ee] dark:bg-[#3b2259]'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] font-mono font-bold text-[#6e5987] dark:text-[#b7a7cc]">
        <span>{bloque.horaInicio}</span>
        <span>{bloque.horaFin}</span>
      </div>
    </div>
  );
};
