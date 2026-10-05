import React, { useState } from 'react';
import { Upload, LogOut, ArrowLeft, CheckCircle, AlertTriangle, Clock, User } from 'lucide-react';
import { DatosAula } from '../services/aulaService';
import { previsualizarPdf, publicarAula, logout, PreviewResultado } from '../services/aulaAdminService';
import { DIAS_LABORABLES, DIAS_LABORABLES_LABEL, obtenerBloquesDia, agruparBloquesConsecutivos, formatearDetalle } from '../services/scheduleUtils';

interface AdminPanelProps {
  usuario: string;
  aulasDisponibles: string[];
  onCerrarSesion: () => void;
  onVolver: () => void;
  onPublicado: (aula: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ usuario, aulasDisponibles, onCerrarSesion, onVolver, onPublicado }) => {
  const [aulaSeleccionada, setAulaSeleccionada] = useState(aulasDisponibles[0] ?? '');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<PreviewResultado | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const handlePrevisualizar = async () => {
    if (!aulaSeleccionada || !archivo) return;
    setError(null);
    setMensajeExito(null);
    setResultado(null);
    setCargando(true);
    try {
      const res = await previsualizarPdf(aulaSeleccionada, archivo);
      setResultado(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo previsualizar el PDF.');
    } finally {
      setCargando(false);
    }
  };

  const handlePublicar = async () => {
    if (!resultado) return;
    setError(null);
    setPublicando(true);
    try {
      await publicarAula(aulaSeleccionada, resultado.datos);
      setMensajeExito(`Horario de ${aulaSeleccionada} publicado correctamente.`);
      setResultado(null);
      setArchivo(null);
      onPublicado(aulaSeleccionada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#2c1547] dark:text-[#f5f0fb]">Actualizar horario de un aula</h2>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc] mt-0.5">Sesión: {usuario}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onVolver}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#f57021]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a vista pública</span>
            </button>
            <button
              onClick={async () => { await logout(); onCerrarSesion(); }}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#6e5987] dark:text-[#b7a7cc] hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">Aula</label>
            <select
              value={aulaSeleccionada}
              onChange={(e) => { setAulaSeleccionada(e.target.value); setResultado(null); setMensajeExito(null); }}
              className="w-full px-3 py-2 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259] bg-[#f4f0f9] dark:bg-[#211336] text-[#2c1547] dark:text-[#f5f0fb] text-sm"
            >
              {aulasDisponibles.map((a) => (
                <option key={a} value={a}>Aula {a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">PDF "USO DE AULAS"</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); setMensajeExito(null); }}
              className="w-full text-xs text-[#2c1547] dark:text-[#f5f0fb] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#f4f0f9] dark:file:bg-[#211336] file:text-[#2c1547] dark:file:text-[#f5f0fb]"
            />
          </div>
        </div>

        <button
          onClick={handlePrevisualizar}
          disabled={!archivo || cargando}
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2.5 bg-[#2c1547] dark:bg-[#8a4ed9] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>{cargando ? 'Analizando PDF…' : 'Previsualizar'}</span>
        </button>

        {error && (
          <div className="mt-4 flex items-start space-x-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs whitespace-pre-wrap">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="mt-4 flex items-center space-x-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>{mensajeExito}</span>
          </div>
        )}
      </div>

      {resultado && (
        <div className="space-y-4">
          {resultado.advertencias.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>El parser tuvo que resolver {resultado.advertencias.length} caso(s) ambiguo(s) — revisa antes de publicar</span>
              </div>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc pl-5">
                {resultado.advertencias.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          <VistaPreviaHorario datos={resultado.datos} />

          <button
            onClick={handlePublicar}
            disabled={publicando}
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-[#f57021] hover:bg-[#e05e10] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{publicando ? 'Publicando…' : `Publicar horario de ${aulaSeleccionada}`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const VistaPreviaHorario: React.FC<{ datos: DatosAula }> = ({ datos }) => {
  const [dia, setDia] = useState(DIAS_LABORABLES[0]);
  const bloques = agruparBloquesConsecutivos(obtenerBloquesDia(datos.bloques, dia));

  return (
    <div className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb]">
        Vista previa — Aula {datos.aula} · Capacidad {datos.capacidad}
      </h3>
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {DIAS_LABORABLES.map((d) => (
          <button
            key={d}
            onClick={() => setDia(d)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dia === d ? 'bg-[#f57021] text-white' : 'bg-[#f4f0f9] dark:bg-[#211336] text-[#2c1547] dark:text-[#f5f0fb]'
            }`}
          >
            {DIAS_LABORABLES_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {bloques.length === 0 && (
          <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">Sin clases este día.</p>
        )}
        {bloques.map((b, i) => (
          <div key={i} className="p-3 rounded-xl border border-[#e2d9ee] dark:border-[#3b2259]">
            <span className="text-[11px] font-mono font-bold text-[#f57021] flex items-center space-x-1.5">
              <Clock className="w-3 h-3" />
              <span>{b.horaInicio} – {b.horaFin}</span>
            </span>
            <p className="text-sm font-bold text-[#2c1547] dark:text-[#f5f0fb] mt-0.5">{b.materia}</p>
            <p className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc] flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{b.docente}</span>
            </p>
            <p className="text-[10px] text-[#6e5987] dark:text-[#b7a7cc]">{formatearDetalle(b)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
