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
            ? 'bg-white dark:bg-[#26163d] border-emerald-300 dark:border-emerald-700/80 ring-2 ring-emerald-500/10'
            : 'bg-white dark:bg-[#26163d] border-[#e2d9ee] dark:border-[#3b2259]'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e2d9ee] dark:border-[#3b2259]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#f57021]" />
            <span>Ahora mismo en esta aula</span>
          </span>

          {actual ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>CLASE EN CURSO</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f4f0f9] dark:bg-[#211336] text-[#6e5987] dark:text-[#b7a7cc] border border-[#e2d9ee] dark:border-[#3b2259]">
              <Coffee className="w-3.5 h-3.5" />
              <span>AULA DISPONIBLE</span>
            </span>
          )}
        </div>

        {actual ? (
          <div className="pt-5 space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#2c1547] dark:text-[#f5f0fb]">
                {actual.materia}
              </h2>
              <p className="text-sm font-semibold text-[#f57021] mt-1 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{actual.docente}</span>
              </p>
              <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc] mt-1">
                {formatearDetalle(actual)}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">
                Progreso de la sesión:
              </div>
              <AulaProgressBar bloque={actual} minutosActuales={minutosActuales} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-[#f4f0f9] dark:bg-[#211336] text-[#6e5987] dark:text-[#b7a7cc]">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-[#2c1547] dark:text-[#f5f0fb]">
              Sin clases en este momento
            </h3>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">
              El aula se encuentra desocupada en este intervalo de tiempo.
            </p>
          </div>
        )}
      </section>

      {/* 2. Tarjeta Siguiente Clase */}
      <section className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#e2d9ee] dark:border-[#3b2259]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-[#f57021]" />
            <span>Siguiente clase hoy</span>
          </span>
          {siguiente && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#2c1547]/10 dark:bg-[#8a4ed9]/20 text-[#2c1547] dark:text-[#8a4ed9]">
              {siguiente.horaInicio} – {siguiente.horaFin}
            </span>
          )}
        </div>

        {siguiente ? (
          <div className="pt-4 space-y-2">
            <h3 className="text-xl font-bold text-[#2c1547] dark:text-[#f5f0fb]">
              {siguiente.materia}
            </h3>
            <p className="text-sm font-medium text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-2">
              <User className="w-4 h-4 text-[#f57021]" />
              <span>{siguiente.docente}</span>
            </p>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">
              {formatearDetalle(siguiente)}
            </p>
          </div>
        ) : (
          <p className="pt-4 text-xs text-[#6e5987] dark:text-[#b7a7cc]">
            No hay más clases programadas para el resto del día de hoy.
          </p>
        )}
      </section>

      {/* 3. Resto de clases del día si existen */}
      {restoDelDia.length > 0 && (
        <section className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6e5987] dark:text-[#b7a7cc]">
            Más tarde hoy ({restoDelDia.length} sesión{restoDelDia.length > 1 ? 'es' : ''})
          </h4>
          <div className="divide-y divide-[#e2d9ee] dark:divide-[#3b2259]">
            {restoDelDia.map((bloque, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#2c1547] dark:text-[#f5f0fb]">
                    {bloque.materia}
                  </p>
                  <p className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">
                    {bloque.docente} · {bloque.paralelo}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#f57021]">
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
          className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-[#2c1547] hover:bg-[#3b2259] dark:bg-[#8a4ed9] dark:hover:bg-[#7839cc] text-white rounded-xl font-bold text-sm shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
        >
          <Calendar className="w-4 h-4 text-[#f57021]" />
          <span>Ver Horario Completo de la Semana</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
