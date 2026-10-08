import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import {
  obtenerDatosAula,
  obtenerAulasDisponibles,
  obtenerIdAulaDesdeUrl,
  DatosAula,
} from './services/aulaService';
import { sesionActiva } from './services/aulaAdminService';
import { AulaHeader } from './components/AulaHeader';
import { AulaVistaPrincipal } from './components/AulaVistaPrincipal';
import { AulaVistaCompleta } from './components/AulaVistaCompleta';
import { AulaNoEncontrada } from './components/AulaNoEncontrada';
import { BienvenidaInicio } from './components/BienvenidaInicio';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { TemaDevPreview } from './components/TemaDevPreview';
import { useTemaAdaptativo } from './theme/useTemaAdaptativo';
import { construirFechaConMinutosGuayaquil } from './theme/calcularColoresTema';

export const App: React.FC = () => {
  // null = no se pasó ?aula= en la URL (ej. alguien entra al dominio
  // directo, sin escanear ningún QR) — antes esto caía por defecto al
  // Aula A4, ahora muestra la pantalla de bienvenida en su lugar.
  const [idAulaActual, setIdAulaActual] = useState<string | null>(() => {
    return obtenerIdAulaDesdeUrl();
  });
  const [vistaAula, setVistaAula] = useState<'principal' | 'completa'>('principal');

  const [datosAula, setDatosAula] = useState<DatosAula | null | undefined>(undefined);
  const [aulasDisponibles, setAulasDisponibles] = useState<string[]>([]);

  // Acceso al panel de admin: solo por la ruta /admin, sin ningún enlace
  // visible en la página pública.
  const [vistaRaiz, setVistaRaiz] = useState<'aula' | 'admin'>(() => {
    return typeof window !== 'undefined' && window.location.pathname === '/admin' ? 'admin' : 'aula';
  });
  const [adminUsuario, setAdminUsuario] = useState<string | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [fecha, setFecha] = useState<Date>(new Date());

  // Previsualización de tema (solo desarrollo): minutos del día simulados,
  // o null si se está mostrando la hora real. No toca `fecha` ni la lógica
  // de clases — solo cambia qué instante calcula el tema adaptativo.
  const [minutosSimulados, setMinutosSimulados] = useState<number | null>(null);
  const fechaSimuladaTema =
    minutosSimulados === null ? null : construirFechaConMinutosGuayaquil(minutosSimulados, fecha);
  const { modo: modoTema, setModo: setModoTema, franjaActual } = useTemaAdaptativo(fecha, fechaSimuladaTema);

  // Lista de aulas (para el selector y la pantalla de "no encontrada")
  const cargarAulasDisponibles = useCallback(() => {
    obtenerAulasDisponibles().then(setAulasDisponibles);
  }, []);

  useEffect(() => {
    cargarAulasDisponibles();
  }, [cargarAulasDisponibles]);

  // Datos del aula activa — si no hay aula en la URL, no se pide nada (se
  // muestra la bienvenida en vez de "Cargando…" o un horario que no se pidió).
  useEffect(() => {
    if (idAulaActual === null) {
      setDatosAula(null);
      return;
    }
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

  const salirDeAdmin = () => {
    setVistaRaiz('aula');
    try {
      window.history.replaceState(null, '', '/');
    } catch {
      // Ignorar si no está en navegador
    }
  };

  const handlePublicado = (aulaPublicada: string) => {
    cargarAulasDisponibles();
    if (idAulaActual && aulaPublicada.toUpperCase() === idAulaActual.toUpperCase()) {
      obtenerDatosAula(idAulaActual).then(setDatosAula);
    }
  };

  return (
    <div className="min-h-screen text-text-on-bg motion-safe:transition-colors motion-safe:duration-700 flex flex-col justify-between">

      <div>
        <Navbar modoTema={modoTema} onCambiarModoTema={setModoTema} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {vistaRaiz === 'admin' ? (
            verificandoSesion ? null : adminUsuario ? (
              <AdminPanel
                usuario={adminUsuario}
                aulasDisponibles={aulasDisponibles}
                onCerrarSesion={() => { setAdminUsuario(null); salirDeAdmin(); }}
                onVolver={salirDeAdmin}
                onPublicado={handlePublicado}
              />
            ) : (
              <AdminLogin
                onLoggedIn={() => sesionActiva().then(setAdminUsuario)}
                onCerrar={salirDeAdmin}
              />
            )
          ) : idAulaActual === null ? (
            <BienvenidaInicio />
          ) : datosAula === undefined ? (
            <div className="text-center py-20 text-sm text-text-muted-on-bg">Cargando horario…</div>
          ) : datosAula ? (
            <>
              <AulaHeader
                datosAula={datosAula}
                fecha={fecha}
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

      <footer className="border-t border-border py-6 text-center text-xs text-text-muted-on-bg space-y-2 motion-safe:transition-colors motion-safe:duration-700">
        <p>Universidad Tecnológica Indoamérica · Sistema de Horarios por Aula © 2026</p>
      </footer>

      {import.meta.env.DEV && (
        <TemaDevPreview
          minutosSimulados={minutosSimulados}
          onCambiarMinutos={setMinutosSimulados}
          franjaActual={franjaActual}
        />
      )}

    </div>
  );
};

export default App;
