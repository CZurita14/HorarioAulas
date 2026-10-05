import React, { useEffect, useState } from 'react';
import { Activity, Database, Cpu, ShieldCheck, RefreshCw, Server } from 'lucide-react';
import { getSaludSistema, SaludResponse } from '../services/api';

export const HealthStatusCard: React.FC = () => {
  const [salud, setSalud] = useState<SaludResponse | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargarSalud = async () => {
    setCargando(true);
    try {
      const res = await getSaludSistema();
      setSalud(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSalud();
  }, []);

  return (
    <div className="bg-white dark:bg-[#26163d] rounded-xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2d9ee] dark:border-[#3b2259]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#f4f0f9] dark:bg-[#211336] rounded-lg text-[#f57021]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#2c1547] dark:text-[#f5f0fb]">
              Estado Técnico y Salud del Agente IA
            </h3>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">
              Monitoreo de componentes, Core determinístico, SGA y LLM Gateway
            </p>
          </div>
        </div>

        <button
          onClick={cargarSalud}
          className="p-2 rounded-lg bg-[#f4f0f9] dark:bg-[#211336] text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#f57021] transition-colors"
          title="Recargar Estado"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {salud ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* API Server */}
          <div className="p-4 rounded-lg bg-[#f4f0f9]/60 dark:bg-[#211336]/60 border border-[#e2d9ee] dark:border-[#3b2259]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-[#2c1547] dark:text-[#8a4ed9]" />
                <span>API FastAPI</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {salud.api}
              </span>
            </div>
            <p className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-2">
              Operativo
            </p>
          </div>

          {/* Core Determinístico */}
          <div className="p-4 rounded-lg bg-[#f4f0f9]/60 dark:bg-[#211336]/60 border border-[#e2d9ee] dark:border-[#3b2259]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-[#f57021]" />
                <span>Core Determinístico</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {salud.core}
              </span>
            </div>
            <p className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-2">
              Reglas v{salud.version_reglas}
            </p>
          </div>

          {/* SGA Connection */}
          <div className="p-4 rounded-lg bg-[#f4f0f9]/60 dark:bg-[#211336]/60 border border-[#e2d9ee] dark:border-[#3b2259]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Origen SGA</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                salud.sga_conectado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {salud.sga_origen}
              </span>
            </div>
            <p className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-2">
              {salud.sga_conectado ? 'SGA Vivo (READ ONLY)' : 'Snapshot Local SQLite'}
            </p>
          </div>

          {/* LLM Gateway */}
          <div className="p-4 rounded-lg bg-[#f4f0f9]/60 dark:bg-[#211336]/60 border border-[#e2d9ee] dark:border-[#3b2259]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>LLM Gateway</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                {salud.llm_status}
              </span>
            </div>
            <p className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-2 uppercase">
              {salud.llm_provider}
            </p>
          </div>

        </div>
      ) : (
        <div className="text-xs text-[#6e5987] dark:text-[#b7a7cc] animate-pulse">
          Consultando métricas de salud del sistema...
        </div>
      )}
    </div>
  );
};
