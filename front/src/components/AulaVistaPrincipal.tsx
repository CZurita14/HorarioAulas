import React from 'react';
import { Calendar, User, BookOpen, Clock, ArrowRight, CheckCircle2, Coffee } from 'lucide-react';
import { BloqueAula, DatosAula } from '../services/aulaService';
import {
  obtenerDiaActual,
  obtenerBloquesDia,
  agruparBloquesConsecutivos,
  obtenerClaseActual,
  obtenerClaseSiguiente,
  formatearDetalle,
} from '../services/scheduleUtils';
import { AulaProgressBar } from './AulaProgressBar';

interface AulaVistaPrincipalProps {
  datosAula: DatosAula;
  fecha: Date;
  onVerHorarioCompleto: () => void;
}

export const AulaVistaPrincipal: React.FC<AulaVistaPrincipalProps> = ({
  datosAula,
  fecha,
  onVerHorarioCompleto,
}) => {
  const dia = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = agruparBloquesConsecutivos(obtenerBloquesDia(datosAula.bloques, dia));
  const actual = obtenerClaseActual(bloquesDia, minutosActuales);
  const siguiente = obtenerClaseSiguiente(bloquesDia, minutosActuales);
  const restoDelDia = bloquesDia.filter(
    (b) => siguiente && b !== actual && b !== siguiente && b.horaInicio > siguiente.horaInicio
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Tarjeta Clase Actual */}
      <section
        className={`rounded-2xl border p-6 shadow-md transition-all ${
          actual
            ? 'bg-surface motion-safe:transition-colors motion-safe:duration-700 border-emerald-300 dark:border-emerald-700/80 ring-2 ring-emerald-500/10'
            : 'bg-surface motion-safe:transition-colors motion-safe:duration-700 border-border'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-accent" />
            <span>Ahora mismo en esta aula</span>
          </span>

          {actual ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>CLASE EN CURSO</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-bg-soft text-text-muted border border-border">
              <Coffee className="w-3.5 h-3.5" />
              <span>AULA DISPONIBLE</span>
            </span>
          )}
        </div>

        {actual ? (
          <div className="pt-5 space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-text">
                {actual.materia}
              </h2>
              <p className="text-sm font-semibold text-accent mt-1 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{actual.docente}</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatearDetalle(actual)}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold text-text-muted mb-1">
                Progreso de la sesión:
              </div>
              <AulaProgressBar bloque={actual} minutosActuales={minutosActuales} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-bg-soft text-text-muted">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-text">
              Sin clases en este momento
            </h3>
            <p className="text-xs text-text-muted">
              El aula se encuentra desocupada en este intervalo de tiempo.
            </p>
          </div>
        )}
      </section>

      {/* 2. Tarjeta Siguiente Clase */}
      <section className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Siguiente clase hoy</span>
          </span>
          {siguiente && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-brand/10 text-brand">
              {siguiente.horaInicio} – {siguiente.horaFin}
            </span>
          )}
        </div>

        {siguiente ? (
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-text">
              {siguiente.materia}
            </h3>
            <p className="text-sm font-medium text-text-muted flex items-center space-x-2">
              <User className="w-4 h-4 text-accent" />
              <span>{siguiente.docente}</span>
            </p>
            <p className="text-xs text-text-muted">
              {formatearDetalle(siguiente)}
            </p>
          </div>
        ) : (
          <p className="pt-4 text-xs text-text-muted">
            No hay más clases programadas para el resto del día de hoy.
          </p>
        )}
      </section>

      {/* 3. Resto de clases del día si existen */}
      {restoDelDia.length > 0 && (
        <section className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Más tarde hoy ({restoDelDia.length} sesión{restoDelDia.length > 1 ? 'es' : ''})
          </h4>
          <div className="divide-y divide-border">
            {restoDelDia.map((bloque, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text">
                    {bloque.materia}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {bloque.docente} · {bloque.paralelo}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-accent">
                  {bloque.horaInicio} – {bloque.horaFin}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Botón Acción: Ver Horario Completo */}
      <div className="pt-2">
        <button
          onClick={onVerHorarioCompleto}
          className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-brand hover:bg-brand-strong text-white rounded-xl font-bold text-sm shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
        >
          <Calendar className="w-4 h-4 text-accent" />
          <span>Ver Horario Completo de la Semana</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
