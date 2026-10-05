import React from 'react';
import { AlertCircle, ArrowRight, MapPin } from 'lucide-react';

interface AulaNoEncontradaProps {
  idBuscado: string | null;
  aulasDisponibles: string[];
  onSeleccionarAula: (aula: string) => void;
}

export const AulaNoEncontrada: React.FC<AulaNoEncontradaProps> = ({
  idBuscado,
  aulasDisponibles,
  onSeleccionarAula,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-rose-300 dark:border-rose-900/60 p-8 shadow-md text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-text">
            Aula no encontrada
          </h2>
          <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
            {idBuscado ? (
              <>
                El identificador <span className="font-mono font-bold text-rose-600 dark:text-rose-400">"{idBuscado}"</span> no corresponde a un aula registrada en el sistema.
              </>
            ) : (
              'El código QR escaneado no especificó un aula válida.'
            )}
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onSeleccionarAula('A4')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-strong text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Ir al Aula A4 por Defecto</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de las 37 aulas registradas */}
      <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-text-muted">
          <MapPin className="w-4 h-4 text-accent" />
          <span>Aulas disponibles en Campus ({aulasDisponibles.length} aulas)</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {aulasDisponibles.map((aula) => (
            <button
              key={aula}
              onClick={() => onSeleccionarAula(aula)}
              className="p-2 text-center rounded-lg border border-border hover:border-accent hover:bg-bg-soft text-xs font-bold text-text transition-all"
            >
              {aula}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
