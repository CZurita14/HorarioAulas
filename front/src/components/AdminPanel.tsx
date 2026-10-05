import React, { useState } from 'react';
import { Upload, LogOut, ArrowLeft, CheckCircle, AlertTriangle, Clock, User, ChevronDown } from 'lucide-react';
import { DatosAula } from '../services/aulaService';
import { previsualizarPdf, publicarAula, logout, PreviewResultado } from '../services/aulaAdminService';
import { DIAS_LABORABLES, DIAS_LABORABLES_LABEL, obtenerBloquesDia, agruparBloquesConsecutivos, formatearDetalle } from '../services/scheduleUtils';

// De momento todas las aulas existentes son del campus Manuela Sáenz. Al
// agregar aulas de los otros dos campus, este selector ya queda listo —
// falta filtrar "Aula" por campus y crear aulas nuevas desde acá (hoy el
// combo "Aula" solo lista las que ya existen).
const CAMPUS = ['Manuela Sáenz', 'Simón Bolívar', 'Parque Tecnológico Santa Rosa'];

interface AdminPanelProps {
  usuario: string;
  aulasDisponibles: string[];
  onCerrarSesion: () => void;
  onVolver: () => void;
  onPublicado: (aula: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ usuario, aulasDisponibles, onCerrarSesion, onVolver, onPublicado }) => {
  const [campusSeleccionado, setCampusSeleccionado] = useState(CAMPUS[0]);
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
      // El parser no sabe de qué campus es el PDF (hoy solo existe uno) —
      // el campus que se publica es el que elige el admin acá.
      res.datos.campus = campusSeleccionado;
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
      <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Actualizar horario de un aula</h2>
            <p className="text-xs text-text-muted mt-0.5">Sesión: {usuario}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onVolver}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-text-muted hover:text-accent"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a vista pública</span>
            </button>
            <button
              onClick={async () => { await logout(); onCerrarSesion(); }}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-text-muted hover:text-rose-600 dark:hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Campus</label>
            <div className="relative">
              <select
                value={campusSeleccionado}
                onChange={(e) => { setCampusSeleccionado(e.target.value); setResultado(null); setMensajeExito(null); }}
                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-border bg-bg-soft text-text text-sm"
              >
                {CAMPUS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">Aula</label>
            <div className="relative">
              <select
                value={aulaSeleccionada}
                onChange={(e) => { setAulaSeleccionada(e.target.value); setResultado(null); setMensajeExito(null); }}
                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-border bg-bg-soft text-text text-sm"
              >
                {aulasDisponibles.map((a) => (
                  <option key={a} value={a}>Aula {a}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-muted mb-1">PDF "USO DE AULAS"</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); setMensajeExito(null); }}
              className="w-full text-xs text-text file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-bg-soft file:text-text"
            />
          </div>
        </div>

        <button
          onClick={handlePrevisualizar}
          disabled={!archivo || cargando}
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2.5 bg-brand hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
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
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-accent hover:bg-accent-strong disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
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
    <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-text">
        Vista previa — Aula {datos.aula} · Capacidad {datos.capacidad}
      </h3>
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {DIAS_LABORABLES.map((d) => (
          <button
            key={d}
            onClick={() => setDia(d)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dia === d ? 'bg-accent text-white' : 'bg-bg-soft text-text'
            }`}
          >
            {DIAS_LABORABLES_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {bloques.length === 0 && (
          <p className="text-xs text-text-muted">Sin clases este día.</p>
        )}
        {bloques.map((b, i) => (
          <div key={i} className="p-3 rounded-xl border border-border">
            <span className="text-[11px] font-mono font-bold text-accent flex items-center space-x-1.5">
              <Clock className="w-3 h-3" />
              <span>{b.horaInicio} – {b.horaFin}</span>
            </span>
            <p className="text-sm font-bold text-text mt-0.5">{b.materia}</p>
            <p className="text-[11px] text-text-muted flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{b.docente}</span>
            </p>
            <p className="text-[10px] text-text-muted">{formatearDetalle(b)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
