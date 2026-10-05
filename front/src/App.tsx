import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import {
  obtenerDatosAula,
  obtenerAulasDisponibles,
  obtenerIdAulaDesdeUrl,
  AULA_POR_DEFECTO,
} from './services/aulaService';
import { AulaHeader } from './components/AulaHeader';
import { AulaVistaPrincipal } from './components/AulaVistaPrincipal';
import { AulaVistaCompleta } from './components/AulaVistaCompleta';
import { AulaNoEncontrada } from './components/AulaNoEncontrada';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Estado del Aula seleccionada y vista (principal / completa)
  const [idAulaActual, setIdAulaActual] = useState<string>(() => {
    return obtenerIdAulaDesdeUrl() || AULA_POR_DEFECTO;
  });
  const [vistaAula, setVistaAula] = useState<'principal' | 'completa'>('principal');

  // Reloj sincronizado al segundo cero de cada minuto
  const [fecha, setFecha] = useState<Date>(new Date());

  const aulasDisponibles = obtenerAulasDisponibles();
  const datosAula = obtenerDatosAula(idAulaActual);

  // Sincronización del tema oscuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Actualizar título de la página según el aula activa
  useEffect(() => {
    if (datosAula) {
      document.title = `Horario Aula ${datosAula.aula} — Universidad Indoamérica`;
    } else {
      document.title = 'Horario de Aulas — Universidad Indoamérica';
    }
  }, [datosAula]);

  // Manejo del reloj en tiempo real con alineación precisa al minuto
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const programarSiguienteTick = () => {
      const retraso = 60000 - (Date.now() % 60000);
      timerId = setTimeout(() => {
        setFecha(new Date());
        programarSiguienteTick();
      }, retraso);
    };

    programarSiguienteTick();

    const handleVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        setFecha(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilidad);
    window.addEventListener('pageshow', handleVisibilidad);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilidad);
      window.removeEventListener('pageshow', handleVisibilidad);
    };
  }, []);

  const handleCambiarAula = (nuevaAula: string) => {
    setIdAulaActual(nuevaAula.toUpperCase());
    setVistaAula('principal');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('aula', nuevaAula.toUpperCase());
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Ignorar si no está en navegador
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f0f9] dark:bg-[#150b24] text-[#2c1547] dark:text-[#f5f0fb] transition-colors duration-200 flex flex-col justify-between">
      
      <div>
        {/* Navbar Institucional UTI con Logo y Toggle de Tema */}
        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Contenido Principal — Horario del Aula */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {datosAula ? (
            <>
              <AulaHeader
                datosAula={datosAula}
                fecha={fecha}
                aulasDisponibles={aulasDisponibles}
                onCambiarAula={handleCambiarAula}
              />

              {vistaAula === 'principal' ? (
                <AulaVistaPrincipal
                  datosAula={datosAula}
                  fecha={fecha}
                  onVerHorarioCompleto={() => setVistaAula('completa')}
                />
              ) : (
                <AulaVistaCompleta
                  datosAula={datosAula}
                  fecha={fecha}
                  onVolver={() => setVistaAula('principal')}
                />
              )}
            </>
          ) : (
            <AulaNoEncontrada
              idBuscado={idAulaActual}
              aulasDisponibles={aulasDisponibles}
              onSeleccionarAula={handleCambiarAula}
            />
          )}
        </main>
      </div>

      {/* Pie de página institucional */}
      <footer className="border-t border-[#e2d9ee] dark:border-[#3b2259] py-6 text-center text-xs text-[#6e5987] dark:text-[#b7a7cc]">
        Universidad Tecnológica Indoamérica · Sistema de Horarios por Aula © 2026
      </footer>

    </div>
  );
};

export default App;
