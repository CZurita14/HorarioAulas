import React from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { ModoTema } from '../theme/useTemaAdaptativo';

interface SelectorTemaProps {
  modo: ModoTema;
  onCambiar: (modo: ModoTema) => void;
}

const OPCIONES: { modo: ModoTema; etiqueta: string; Icono: React.ElementType }[] = [
  { modo: 'auto', etiqueta: 'Automático', Icono: Sparkles },
  { modo: 'claro', etiqueta: 'Claro', Icono: Sun },
  { modo: 'oscuro', etiqueta: 'Oscuro', Icono: Moon },
];

/** Selector de tema (Automático / Claro / Oscuro) — reemplaza al viejo botón único. */
export const SelectorTema: React.FC<SelectorTemaProps> = ({ modo, onCambiar }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Tema de la página"
      className="inline-flex items-center rounded-xl border border-[#3b2259] bg-[#211336] p-1 gap-1"
    >
      {OPCIONES.map(({ modo: valor, etiqueta, Icono }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={etiqueta}
            onClick={() => onCambiar(valor)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f57021] ${
              activo
                ? 'bg-[#f57021] text-white'
                : 'text-[#b7a7cc] hover:text-white hover:bg-[#3b2259]'
            }`}
          >
            <Icono className="w-4 h-4" />
            <span className="hidden sm:inline">{etiqueta}</span>
          </button>
        );
      })}
    </div>
  );
};
