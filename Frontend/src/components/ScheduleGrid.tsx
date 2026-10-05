import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { ResultadoJSON, getConfiguracionReglas, ConfiguracionReglas } from '../services/api';

interface ScheduleGridProps {
  resultado: ResultadoJSON;
}

interface BloqueCronograma {
  id: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  inicio_min: number;
  fin_min: number;
  asignatura: string;
  aula: string;
  docente: string;
  evidencia: string;
  es_conflicto: boolean;
  tipo_conflicto?: string;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const FRANJAS_HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

function horaAMinutos(horaStr: string): number {
  if (!horaStr) return 0;
  const parts = horaStr.trim().split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ resultado }) => {
  const [configReglas, setConfigReglas] = useState<ConfiguracionReglas | null>(null);

  useEffect(() => {
    getConfiguracionReglas().then(setConfigReglas).catch(() => {});
  }, []);

  // Datos dinámicos de la franja prohibida
  const franjaActiva = configReglas?.franja_no_permitida?.activa ?? true;
  const franjaInicio = configReglas?.franja_no_permitida?.inicio ?? "10:00";
  const franjaFin = configReglas?.franja_no_permitida?.fin ?? "10:30";
  const franjaInicioMin = horaAMinutos(franjaInicio);

  const bloques: BloqueCronograma[] = [];

  resultado.evidencia.forEach((evText, idx) => {
    const match = evText.match(/(Lunes|Martes|Miércoles|Miercoles|Jueves|Viernes|Sábado|Sabado|Domingo)\s+(\d{1,2}:\d{2})\s*(?:–|-|a)\s*(\d{1,2}:\d{2})\s+(.+?)\s+AULA\s+([A-Za-z0-9_-]+)/i);
    
    if (match) {
      const diaNorm = match[1].replace('Miercoles', 'Miércoles').replace('Sabado', 'Sábado');
      const inicio = match[2];
      const fin = match[3];
      const resto = match[4];
      const aula = match[5];
      
      const partesResto = resto.split(' ');
      const docente = partesResto.length > 2 ? partesResto[0] + ' ' + partesResto[1] : resultado.docente || 'Docente';
      const asignatura = partesResto.length > 2 ? partesResto.slice(2).join(' ') : resto;

      const iMin = horaAMinutos(inicio);
      const fMin = horaAMinutos(fin);

      let tieneConflicto = false;
      let tipoConf = '';

      resultado.conflictos.forEach((c) => {
        if (c.dia === diaNorm) {
          const cInicio = horaAMinutos(c.hora_inicio);
          const cFin = horaAMinutos(c.hora_fin);
          if (iMin < cFin && cInicio < fMin) {
            tieneConflicto = true;
            tipoConf = c.tipo;
          }
        }
      });

      bloques.push({
        id: `b-${idx}`,
        dia: diaNorm,
        hora_inicio: inicio,
        hora_fin: fin,
        inicio_min: iMin,
        fin_min: fMin,
        asignatura: asignatura || 'Asignatura',
        aula: aula || 'A1',
        docente: docente || resultado.docente || 'Docente',
        evidencia: evText,
        es_conflicto: tieneConflicto,
        tipo_conflicto: tipoConf
      });
    }
  });

  if (bloques.length === 0 && resultado.conflictos) {
    resultado.conflictos.forEach((c, idx) => {
      c.registros_afectados.forEach((af, aIdx) => {
        const iMin = horaAMinutos(af.hora_inicio);
        const fMin = horaAMinutos(af.hora_fin);
        bloques.push({
          id: `conf-${idx}-${aIdx}`,
          dia: c.dia,
          hora_inicio: af.hora_inicio,
          hora_fin: af.hora_fin,
          inicio_min: iMin,
          fin_min: fMin,
          asignatura: af.curso,
          aula: af.aula,
          docente: af.docente,
          evidencia: af.evidencia,
          es_conflicto: true,
          tipo_conflicto: c.tipo
        });
      });
    });
  }

  return (
    <div className="bg-white dark:bg-[#26163d] rounded-xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm space-y-4">
      
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e2d9ee] dark:border-[#3b2259]">
        <div>
          <h3 className="font-bold text-sm text-[#2c1547] dark:text-[#f5f0fb] flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#f57021]" />
            <span>Matriz Visual de Horarios y Conflictos (Cronograma Semanal)</span>
          </h3>
          <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc] mt-0.5">
            Visualización gráfica de franjas horarias y detección visual de cruces por día
          </p>
        </div>

        {/* Leyenda Dinámica de la Matriz */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Clase Sin Cruce</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-700 dark:text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Conflicto / Cruce</span>
          </span>
          {franjaActiva && (
            <span className="flex items-center space-x-1 text-purple-700 dark:text-purple-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
              <span>Franja Restringida ({franjaInicio}–{franjaFin})</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid del Cronograma Semanal */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[#e2d9ee] dark:border-[#3b2259] text-xs min-w-[700px]">
          <thead>
            <tr className="bg-[#2c1547] text-white">
              <th className="p-2.5 border border-[#3b2259] w-20 text-center font-bold">Hora</th>
              {DIAS_SEMANA.map((dia) => (
                <th key={dia} className="p-2.5 border border-[#3b2259] text-center font-bold">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS_HORAS.map((horaSlot) => {
              const slotMin = horaAMinutos(horaSlot);
              // Verificar si el slot coincide con la franja prohibida configurada
              const esFranjaProhibida = franjaActiva && Math.abs(slotMin - franjaInicioMin) < 30;

              return (
                <tr
                  key={horaSlot}
                  className={esFranjaProhibida ? 'bg-purple-50/70 dark:bg-purple-950/40' : 'hover:bg-[#f4f0f9]/40 dark:hover:bg-[#211336]/40'}
                >
                  {/* Celda de Hora */}
                  <td className="p-2 border border-[#e2d9ee] dark:border-[#3b2259] text-center font-mono font-bold text-[#6e5987] dark:text-[#b7a7cc] bg-[#f4f0f9]/80 dark:bg-[#211336]/80">
                    {horaSlot}
                    {esFranjaProhibida && (
                      <span className="block text-[9px] text-purple-600 dark:text-purple-400 font-normal">
                        Restringida
                      </span>
                    )}
                  </td>

                  {/* Celdas por Día */}
                  {DIAS_SEMANA.map((dia) => {
                    const bloquesMatch = bloques.filter((b) => {
                      if (b.dia !== dia) return false;
                      return b.inicio_min <= slotMin && slotMin < b.fin_min;
                    });

                    return (
                      <td
                        key={`${dia}-${horaSlot}`}
                        className={`p-1.5 border border-[#e2d9ee] dark:border-[#3b2259] vertical-top align-top min-h-[60px] relative ${
                          esFranjaProhibida ? 'bg-purple-100/30 dark:bg-purple-950/20' : ''
                        }`}
                      >
                        {bloquesMatch.length > 0 ? (
                          <div className="space-y-1.5">
                            {bloquesMatch.map((b) => (
                              <div
                                key={b.id}
                                className={`p-2 rounded-md shadow-sm transition-all text-[11px] leading-snug border ${
                                  b.es_conflicto
                                    ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span className="font-mono text-[10px] underline">
                                    {b.hora_inicio} - {b.hora_fin}
                                  </span>
                                  {b.es_conflicto ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-600 text-white font-extrabold uppercase">
                                      {b.tipo_conflicto || 'CRUCE'}
                                    </span>
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  )}
                                </div>

                                <div className="font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-1">
                                  {b.asignatura}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-[#6e5987] dark:text-[#b7a7cc] mt-1">
                                  <span>Aula: <strong className="text-[#f57021]">{b.aula}</strong></span>
                                  <span className="truncate max-w-[90px]">{b.docente}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          esFranjaProhibida && (
                            <div className="text-[10px] text-purple-500 dark:text-purple-400 font-medium text-center italic py-1">
                              Franja {franjaInicio}–{franjaFin}
                            </div>
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
