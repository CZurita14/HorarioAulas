import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
import { DatosAula } from '../services/aulaService';
import { formatearHora12 } from '../services/scheduleUtils';

interface AulaHeaderProps {
  datosAula: DatosAula;
  fecha: Date;
}

export const AulaHeader: React.FC<AulaHeaderProps> = ({
  datosAula,
  fecha,
}) => {
  const fechaTexto = fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <header className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Identidad y Aula */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <span>Universidad Indoamérica</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              <span>Campus {datosAula.campus}</span>
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight">
            AULA {datosAula.aula}
          </h1>

          <div className="flex items-center space-x-4 text-xs text-text-muted">
            <span className="capitalize font-medium">{fechaTexto}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>Capacidad: {datosAula.capacidad} estudiantes</span>
            </span>
          </div>
        </div>

        {/* Reloj en vivo */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-border">
          <div className="text-xl md:text-2xl font-mono font-bold text-text mt-1 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-accent" />
            <span>{formatearHora12(fecha)}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
