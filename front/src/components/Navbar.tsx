import React from 'react';
import { SelectorTema } from './SelectorTema';
import { ModoTema } from '../theme/useTemaAdaptativo';

interface NavbarProps {
  modoTema: ModoTema;
  onCambiarModoTema: (modo: ModoTema) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ modoTema, onCambiarModoTema }) => {
  return (
    <header className="bg-[#2c1547] text-white shadow-md border-b border-[#3b2259] sticky top-0 z-40">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Logo & Marca Institucional */}
          <div className="flex items-center space-x-3.5 flex-shrink-0">
            <img
              src="/logo-uti.png"
              alt="Universidad Tecnológica Indoamérica"
              className="h-10 md:h-12 w-auto object-contain hover:opacity-95 transition-opacity"
            />
            <div className="flex flex-col justify-center">
              <h1 className="font-bold text-base md:text-lg leading-tight tracking-wide text-white">
                Horario de Aulas
              </h1>
              <p className="text-[11px] text-[#b7a7cc] font-medium">
                Universidad Indoamérica
              </p>
            </div>
          </div>

          <SelectorTema modo={modoTema} onCambiar={onCambiarModoTema} />

        </div>
      </div>
    </header>
  );
};
