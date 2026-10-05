import React, { useState, useEffect, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { Navbar } from './components/Navbar';
import {
  obtenerDatosAula,
  obtenerAulasDisponibles,
  obtenerIdAulaDesdeUrl,
  AULA_POR_DEFECTO,
  DatosAula,
} from './services/aulaService';
import { sesionActiva } from './services/aulaAdminService';
import { AulaHeader } from './components/AulaHeader';
import { AulaVistaPrincipal } from './components/AulaVistaPrincipal';
import { AulaVistaCompleta } from './components/AulaVistaCompleta';
import { AulaNoEncontrada } from './components/AulaNoEncontrada';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';

export const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [idAulaActual, setIdAulaActual] = useState<string>(() => {
    return obtenerIdAulaDesdeUrl() || AULA_POR_DEFECTO;
  });
  const [vistaAula, setVistaAula] = useState<'principal' | 'completa'>('principal');

  const [datosAula, setDatosAula] = useState<DatosAula | null | undefined>(undefined);
  const [aulasDisponibles, setAulasDisponibles] = useState<string[]>([]);

  const [vistaRaiz, setVistaRaiz] = useState<'aula' | 'admin'>('aula');
  const [adminUsuario, setAdminUsuario] = useState<string | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [fecha, setFecha] = useState<Date>(new Date());

  // Lista de aulas (para el selector y la pantalla de "no encontrada")
  const cargarAulasDisponibles = useCallback(() => {
    obtenerAulasDisponibles().then(setAulasDisponibles);
  }, []);

  useEffect(() => {
    cargarAulasDisponibles();
  }, [cargarAulasDisponibles]);

  // Datos del aula activa
  useEffect(() => {
    let vigente = true;
    setDatosAula(undefined);
    obtenerDatosAula(idAulaActual).then((datos) => {
      if (vigente) setDatosAula(datos);
    });
    return () => {
      vigente = false;
    };
  }, [idAulaActual]);

  // Sesión de admin ya activa (ej. tras refrescar la página)
  useEffect(() => {
    sesionActiva()
      .then(setAdminUsuario)
      .finally(() => setVerificandoSesion(false));
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (datosAula) {
      document.title = `Horario Aula ${datosAula.aula} — Universidad Indoamérica`;
    } else {
      document.title = 'Horario de Aulas — Universidad Indoamérica';
    }
  }, [datosAula]);

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
    setVistaRaiz('aula');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('aula', nuevaAula.toUpperCase());
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Ignorar si no está en navegador
    }
  };

  const handlePublicado = (aulaPublicada: string) => {
    cargarAulasDisponibles();
    if (aulaPublicada.toUpperCase() === idAulaActual.toUpperCase()) {
      obtenerDatosAula(idAulaActual).then(setDatosAula);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f0f9] dark:bg-[#150b24] text-[#2c1547] dark:text-[#f5f0fb] transition-colors duration-200 flex flex-col justify-between">

      <div>
        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {vistaRaiz === 'admin' ? (
            verificandoSesion ? null : adminUsuario ? (
              <AdminPanel
                usuario={adminUsuario}
                aulasDisponibles={aulasDisponibles}
                onCerrarSesion={() => { setAdminUsuario(null); setVistaRaiz('aula'); }}
                onPublicado={handlePublicado}
              />
            ) : (
              <AdminLogin
                onLoggedIn={() => sesionActiva().then(setAdminUsuario)}
                onCerrar={() => setVistaRaiz('aula')}
              />
            )
          ) : datosAula === undefined ? (
            <div className="text-center py-20 text-sm text-[#6e5987] dark:text-[#b7a7cc]">Cargando horario…</div>
          ) : datosAula ? (
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

      <footer className="border-t border-[#e2d9ee] dark:border-[#3b2259] py-6 text-center text-xs text-[#6e5987] dark:text-[#b7a7cc] space-y-2">
        <p>Universidad Tecnológica Indoamérica · Sistema de Horarios por Aula © 2026</p>
        {vistaRaiz === 'aula' && (
          <button
            onClick={() => setVistaRaiz('admin')}
            className="inline-flex items-center space-x-1 text-[10px] text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#f57021] opacity-70 hover:opacity-100 transition-all"
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
        )}
      </footer>

    </div>
  );
};

export default App;
