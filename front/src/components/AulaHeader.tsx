import React from 'react';
import { Clock, MapPin, Users, ChevronDown } from 'lucide-react';
import { DatosAula } from '../services/aulaService';
import { formatearHora12 } from '../services/scheduleUtils';

interface AulaHeaderProps {
  datosAula: DatosAula;
  fecha: Date;
  aulasDisponibles: string[];
  onCambiarAula: (nuevaAula: string) => void;
}

export const AulaHeader: React.FC<AulaHeaderProps> = ({
  datosAula,
  fecha,
  aulasDisponibles,
  onCambiarAula,
}) => {
  const fechaTexto = fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <header className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Identidad y Aula */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] uppercase tracking-wider">
            <span>Universidad Indoamérica</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#f57021]" />
              <span>Campus {datosAula.campus}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#2c1547] dark:text-[#f5f0fb] tracking-tight">
              AULA {datosAula.aula}
            </h1>

            {/* Selector interactivo de las 37 aulas */}
            <div className="relative inline-block">
              <select
                value={datosAula.aula}
                onChange={(e) => onCambiarAula(e.target.value)}
                className="appearance-none bg-[#f4f0f9] dark:bg-[#211336] text-[#2c1547] dark:text-[#f5f0fb] font-bold text-xs pl-3 pr-8 py-1.5 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259] cursor-pointer hover:border-[#f57021] transition-all"
                title="Cambiar de aula"
              >
                {aulasDisponibles.map((id) => (
                  <option key={id} value={id}>
                    Aula {id}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6e5987] dark:text-[#b7a7cc] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-[#6e5987] dark:text-[#b7a7cc]">
            <span className="capitalize font-medium">{fechaTexto}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-[#f57021]" />
              <span>Capacidad: {datosAula.capacidad} estudiantes</span>
            </span>
          </div>
        </div>

        {/* Reloj en vivo */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-[#e2d9ee] dark:border-[#3b2259]">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>EN VIVO</span>
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-1 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#f57021]" />
            <span>{formatearHora12(fecha)}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
