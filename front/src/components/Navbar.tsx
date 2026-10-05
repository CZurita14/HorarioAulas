import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="bg-[#2c1547] text-white shadow-md border-b border-[#3b2259] transition-colors sticky top-0 z-40">
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

          {/* Toggle Tema Oscuro/Claro */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl text-[#b7a7cc] hover:text-white hover:bg-[#3b2259] transition-colors border border-[#3b2259] bg-[#211336] shadow-sm flex items-center space-x-2 text-xs font-semibold"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">Modo Oscuro</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
