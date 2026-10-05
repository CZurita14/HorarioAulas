import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, Clock, CheckCircle } from 'lucide-react';
import { DatosAula } from '../services/aulaService';
import {
  DIAS_LABORABLES,
  DIAS_LABORABLES_LABEL,
  DiaSemana,
  obtenerDiaActual,
  obtenerBloquesDia,
  agruparBloquesConsecutivos,
  obtenerClaseActual,
  formatearDetalle,
} from '../services/scheduleUtils';

interface AulaVistaCompletaProps {
  datosAula: DatosAula;
  fecha: Date;
  onVolver: () => void;
}

export const AulaVistaCompleta: React.FC<AulaVistaCompletaProps> = ({
  datosAula,
  fecha,
  onVolver,
}) => {
  const diaHoy = obtenerDiaActual(fecha);
  const diaInicial = diaHoy === 'domingo' ? 'lunes' : diaHoy;
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>(diaInicial);

  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const esHoy = diaSeleccionado === diaHoy;

  const bloquesDia = agruparBloquesConsecutivos(obtenerBloquesDia(datosAula.bloques, diaSeleccionado));
  const claseEnCurso = esHoy ? obtenerClaseActual(bloquesDia, minutosActuales) : null;

  return (
    <div className="space-y-6">
      
      {/* Barra Superior con Botón Volver */}
      <div className="flex items-center justify-between bg-surface motion-safe:transition-colors motion-safe:duration-700 p-4 rounded-2xl border border-border shadow-sm">
        <button
          onClick={onVolver}
          className="inline-flex items-center space-x-2 text-xs md:text-sm font-bold text-text hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-accent" />
          <span>Volver a Clase Actual</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-semibold text-text-muted">
          <Calendar className="w-4 h-4 text-accent" />
          <span>Horario Completo</span>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Selector de Chips de Día (Lunes a Sábado) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {DIAS_LABORABLES.map((dia) => {
            const cantidadBloques = obtenerBloquesDia(datosAula.bloques, dia).length;
            const activo = diaSeleccionado === dia;
            const esElDiaActual = dia === diaHoy;

            return (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(dia)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activo
                    ? 'bg-accent text-white shadow-md scale-[1.02]'
                    : 'bg-surface motion-safe:transition-colors motion-safe:duration-700 text-text border border-border hover:border-accent'
                }`}
              >
                <span>{DIAS_LABORABLES_LABEL[dia]}</span>
                {esElDiaActual && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activo
                      ? 'bg-white/20 text-white'
                      : 'bg-bg-soft text-text-muted'
                  }`}
                >
                  {cantidadBloques}
                </span>
              </button>
            );
          })}
        </div>

        {/* Lista de Tarjetas del Día Seleccionado */}
        <div className="space-y-3">
          {bloquesDia.length > 0 ? (
            bloquesDia.map((bloque, idx) => {
              const esLaClaseEnCurso = claseEnCurso === bloque;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    esLaClaseEnCurso
                      ? 'bg-surface motion-safe:transition-colors motion-safe:duration-700 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-surface motion-safe:transition-colors motion-safe:duration-700 border-border shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-mono font-bold text-accent flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{bloque.horaInicio} – {bloque.horaFin}</span>
                    </span>

                    {esLaClaseEnCurso && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>EN CURSO</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-3">
                    <h4 className="text-lg font-bold text-text">
                      {bloque.materia}
                    </h4>
                    <p className="text-xs font-semibold text-text-muted mt-1 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-accent" />
                      <span>{bloque.docente}</span>
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {formatearDetalle(bloque)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-10 text-center space-y-2">
              <Calendar className="w-8 h-8 text-text-muted mx-auto opacity-60" />
              <h4 className="text-base font-bold text-text">
                Sin clases programadas
              </h4>
              <p className="text-xs text-text-muted">
                No existen asignaturas registradas para el día {DIAS_LABORABLES_LABEL[diaSeleccionado]} en el Aula {datosAula.aula}.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
