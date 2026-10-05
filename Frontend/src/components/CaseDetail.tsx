import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, FileX, Code, Clock, User, ShieldAlert } from 'lucide-react';
import { ResultadoJSON } from '../services/api';
import { ScheduleGrid } from './ScheduleGrid';

interface CaseDetailProps {
  resultado: ResultadoJSON;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ resultado }) => {
  const [verJson, setVerJson] = useState(false);
  const [vistaMatriz, setVistaMatriz] = useState(true);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'SIN_CRUCE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>SIN CRUCE</span>
          </span>
        );
      case 'CRUCE_DOCENTE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>CRUCE DOCENTE</span>
          </span>
        );
      case 'CRUCE_AULA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>CRUCE AULA</span>
          </span>
        );
      case 'CRUCE_DOCENTE_AULA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>CRUCE DOCENTE Y AULA</span>
          </span>
        );
      case 'HORARIO_NO_PERMITIDO_10_10_30':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>FRANJA NO PERMITIDA (10:00–10:30)</span>
          </span>
        );
      case 'DATO_FALTANTE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800">
            <HelpCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span>DATO FALTANTE</span>
          </span>
        );
      case 'NO_APLICA':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
            <FileX className="w-4 h-4 text-gray-500" />
            <span>NO APLICA</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

      {/* Contenedor Principal del Dictamen */}
      <div className="bg-white dark:bg-[#26163d] border border-[#e2d9ee] dark:border-[#3b2259] rounded-xl shadow-md overflow-hidden transition-colors">
        
        {/* Encabezado del Caso */}
        <div className="bg-[#f4f0f9] dark:bg-[#211336] p-6 border-b border-[#e2d9ee] dark:border-[#3b2259] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-[#6e5987] dark:text-[#b7a7cc]">
                {resultado.case_id}
              </span>
              {getBadgeEstado(resultado.estado)}
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#2c1547]/10 dark:bg-[#8a4ed9]/20 text-[#2c1547] dark:text-[#8a4ed9] font-medium">
                Origen: {resultado.procesamiento.origen_datos}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-2">
              {resultado.facultad || 'Facultad de Ingeniería'} — Período {resultado.periodo}
            </h2>
            {resultado.docente && (
              <p className="text-sm text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1 mt-1">
                <User className="w-4 h-4 text-[#f57021]" />
                <span>Docente principal: <strong>{resultado.docente}</strong></span>
              </p>
            )}
          </div>

          {/* Destino de Enrutamiento */}
          <div className="bg-white dark:bg-[#26163d] px-4 py-3 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259] text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6e5987] dark:text-[#b7a7cc] block">
              Enrutamiento Operativo ({resultado.enrutamiento.regla})
            </span>
            <span className="text-sm font-bold text-[#f57021] block mt-0.5">
              {resultado.enrutamiento.destino}
            </span>
          </div>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="p-6 border-b border-[#e2d9ee] dark:border-[#3b2259]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e5987] dark:text-[#b7a7cc] mb-1">
            Resumen Ejecutivo del Dictamen
          </h3>
          <p className="text-sm text-[#2c1547] dark:text-[#f5f0fb] font-medium">
            {resultado.resumen}
          </p>
        </div>

        {/* Detalle de Conflictos Encontrados */}
        {resultado.conflictos && resultado.conflictos.length > 0 && (
          <div className="p-6 border-b border-[#e2d9ee] dark:border-[#3b2259] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Conflictos Detectados por el Core Determinístico ({resultado.conflictos.length})</span>
            </h3>

            <div className="space-y-4">
              {resultado.conflictos.map((conflicto, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                        {conflicto.tipo}
                      </span>
                      <span className="text-xs font-semibold text-[#2c1547] dark:text-[#f5f0fb]">
                        {conflicto.dia} {conflicto.hora_inicio} – {conflicto.hora_fin}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Regla: {conflicto.regla}
                    </span>
                  </div>

                  {/* Registros afectantes */}
                  <div className="space-y-2 mt-3">
                    <span className="text-[11px] font-semibold text-[#6e5987] dark:text-[#b7a7cc] block">
                      Registros implicados y Evidencia Literal:
                    </span>
                    {conflicto.registros_afectados.map((af, aIdx) => (
                      <div key={aIdx} className="bg-white dark:bg-[#150b24] p-3 rounded border border-rose-100 dark:border-rose-950 text-xs">
                        <div className="flex justify-between font-semibold text-[#2c1547] dark:text-[#f5f0fb]">
                          <span>{af.docente} — {af.curso}</span>
                          <span className="text-[#f57021] font-mono">Aula: {af.aula}</span>
                        </div>
                        <div className="mt-1.5 p-2 bg-[#f4f0f9] dark:bg-[#211336] rounded font-mono text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">
                          Cita literal: "{af.evidencia}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Modo de Visualización (Matriz Cronograma vs Evidencia Texto) */}
        <div className="p-4 bg-[#f4f0f9] dark:bg-[#211336] border-b border-[#e2d9ee] dark:border-[#3b2259] flex items-center justify-between">
          <span className="text-xs font-bold text-[#6e5987] dark:text-[#b7a7cc] uppercase tracking-wider">
            Visualizador del Horario Académico
          </span>

          <div className="flex items-center space-x-2 bg-white dark:bg-[#26163d] p-1 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259]">
            <button
              onClick={() => setVistaMatriz(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                vistaMatriz
                  ? 'bg-[#2c1547] text-white shadow-sm'
                  : 'text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#2c1547]'
              }`}
            >
              <span>Matriz Cronograma</span>
            </button>
            <button
              onClick={() => setVistaMatriz(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                !vistaMatriz
                  ? 'bg-[#2c1547] text-white shadow-sm'
                  : 'text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#2c1547]'
              }`}
            >
              <span>Lista de Evidencia ({resultado.evidencia?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Renderizado Condicional: Matriz vs Lista */}
        {vistaMatriz ? (
          <div className="p-6">
            <ScheduleGrid resultado={resultado} />
          </div>
        ) : (
          resultado.evidencia && resultado.evidencia.length > 0 && (
            <div className="p-6 border-b border-[#e2d9ee] dark:border-[#3b2259]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e5987] dark:text-[#b7a7cc] mb-3">
                Evidencia Documental Extraída ({resultado.evidencia.length} filas analizadas)
              </h3>
              <div className="bg-[#f4f0f9] dark:bg-[#150b24] p-4 rounded-lg space-y-1.5 font-mono text-xs text-[#2c1547] dark:text-[#b7a7cc] max-h-48 overflow-y-auto border border-[#e2d9ee] dark:border-[#3b2259]">
                {resultado.evidencia.map((ev, evIdx) => (
                  <div key={evIdx} className="border-b border-[#e2d9ee]/50 dark:border-[#3b2259]/50 pb-1 last:border-none">
                    • {ev}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Visor de JSON Completo */}
        <div className="p-4 bg-[#f4f0f9] dark:bg-[#211336] flex items-center justify-between border-t border-[#e2d9ee] dark:border-[#3b2259]">
          <button
            onClick={() => setVerJson(!verJson)}
            className="flex items-center space-x-2 text-xs font-semibold text-[#2c1547] dark:text-[#8a4ed9] hover:text-[#f57021] transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>{verJson ? 'Ocultar JSON Estructurado' : 'Ver Contrato JSON Completo'}</span>
          </button>
        </div>

        {verJson && (
          <div className="p-6 bg-[#150b24] text-emerald-400 font-mono text-xs overflow-x-auto border-t border-[#3b2259]">
            <pre>{JSON.stringify(resultado, null, 2)}</pre>
          </div>
        )}

      </div>
    </div>
  );
};
