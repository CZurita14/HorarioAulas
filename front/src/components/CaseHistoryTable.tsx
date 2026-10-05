import React from 'react';
import { Eye, Shield, Filter } from 'lucide-react';
import { ResultadoJSON } from '../services/api';

export type UserRole = 'admin' | 'coordinador' | 'infraestructura' | 'decano';

interface CaseHistoryTableProps {
  casos: ResultadoJSON[];
  onSeleccionarCaso: (caso: ResultadoJSON) => void;
  currentRole: UserRole;
}

export const CaseHistoryTable: React.FC<CaseHistoryTableProps> = ({ casos, onSeleccionarCaso, currentRole }) => {
  // Filtrar o resaltar según el Rol Activo (RBAC - Sección 41 del SPEC)
  const esCasoDelRol = (destino: string) => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'coordinador' && (destino.includes('COORDINADOR') || destino.includes('USUARIO'))) return true;
    if (currentRole === 'infraestructura' && destino.includes('INFRAESTRUCTURA')) return true;
    if (currentRole === 'decano' && destino.includes('DECANO')) return true;
    return false;
  };

  const getBadgeMini = (estado: string) => {
    switch (estado) {
      case 'SIN_CRUCE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">SIN CRUCE</span>;
      case 'CRUCE_DOCENTE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">CRUCE DOCENTE</span>;
      case 'CRUCE_AULA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">CRUCE AULA</span>;
      case 'CRUCE_DOCENTE_AULA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300">DOCENTE Y AULA</span>;
      case 'HORARIO_NO_PERMITIDO_10_10_30':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">FRANJA 10:00-10:30</span>;
      case 'DATO_FALTANTE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-300">DATO FALTANTE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">NO APLICA</span>;
    }
  };

  const getNombreRolLimpio = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador del Sistema';
      case 'coordinador': return 'Coordinador Académico';
      case 'infraestructura': return 'Infraestructura / Aulas';
      case 'decano': return 'Decano';
    }
  };

  return (
    <div className="bg-white dark:bg-[#26163d] rounded-xl border border-[#e2d9ee] dark:border-[#3b2259] shadow-sm overflow-hidden">
      
      {/* Banner de Enfoque según Rol */}
      <div className="bg-[#f4f0f9] dark:bg-[#211336] p-5 border-b border-[#e2d9ee] dark:border-[#3b2259] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-5 h-5 text-[#f57021]" />
          <div>
            <h3 className="font-bold text-base text-[#2c1547] dark:text-[#f5f0fb]">
              Bandeja de Entrada — Rol {getNombreRolLimpio(currentRole)}
            </h3>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc] mt-0.5">
              {currentRole === 'admin'
                ? 'Vista completa de todos los casos auditados del sistema.'
                : `Los casos enrutados hacia su área (${currentRole.toUpperCase()}) se muestran destacados.`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] bg-white dark:bg-[#26163d] px-3 py-1.5 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259]">
          <Filter className="w-4 h-4 text-[#f57021]" />
          <span>Filtro RBAC Activo</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#f4f0f9] dark:bg-[#211336] text-[#6e5987] dark:text-[#b7a7cc] font-semibold border-b border-[#e2d9ee] dark:border-[#3b2259]">
              <th className="p-3">Case ID</th>
              <th className="p-3">Período</th>
              <th className="p-3">Docente Principal</th>
              <th className="p-3">Estado Dictaminado</th>
              <th className="p-3">Origen Datos</th>
              <th className="p-3">Destino Enrutamiento</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2d9ee] dark:divide-[#3b2259]">
            {casos.map((caso, idx) => {
              const esDelRol = esCasoDelRol(caso.enrutamiento.destino);

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    esDelRol
                      ? 'bg-white dark:bg-[#26163d] hover:bg-[#f4f0f9]/60 dark:hover:bg-[#211336]/60'
                      : 'opacity-50 bg-gray-50/50 dark:bg-gray-950/20'
                  }`}
                >
                  <td className="p-3 font-mono font-bold text-[#2c1547] dark:text-[#f5f0fb]">
                    {caso.case_id}
                  </td>
                  <td className="p-3 font-semibold text-[#6e5987] dark:text-[#b7a7cc]">
                    {caso.periodo}
                  </td>
                  <td className="p-3 font-medium text-[#2c1547] dark:text-[#f5f0fb]">
                    {caso.docente || 'Varios / No especificado'}
                  </td>
                  <td className="p-3">
                    {getBadgeMini(caso.estado)}
                  </td>
                  <td className="p-3 text-[#6e5987] dark:text-[#b7a7cc]">
                    {caso.procesamiento.origen_datos}
                  </td>
                  <td className="p-3 font-bold text-[#f57021]">
                    {caso.enrutamiento.destino}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSeleccionarCaso(caso)}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-[#2c1547] dark:bg-[#8a4ed9] text-white rounded hover:bg-[#f57021] transition-colors font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Detalle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
