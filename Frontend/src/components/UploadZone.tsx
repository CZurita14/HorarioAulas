import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, Play, AlertCircle } from 'lucide-react';
import { uploadDocumento, validarCasoPayload, ResultadoJSON, RegistroHorario } from '../services/api';

interface UploadZoneProps {
  onCasoProcesado: (resultado: ResultadoJSON) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onCasoProcesado }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await procesarArchivo(e.target.files[0]);
    }
  };

  const procesarArchivo = async (file: File) => {
    setCargando(true);
    setError(null);
    try {
      const res = await uploadDocumento(file);
      onCasoProcesado(res);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };

  const ejecutarCasoPruebaSintetico = async (tcId: string, registros: RegistroHorario[], esNoAplica: boolean = false) => {
    setCargando(true);
    setError(null);
    try {
      const res = await validarCasoPayload(`CASE-${tcId}`, registros, esNoAplica);
      onCasoProcesado(res);
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar caso sintético');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Carga Principal por Arrastre */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#f57021] bg-[#rgba(245,112,33,0.08)] scale-[1.01]'
            : 'border-[#e2d9ee] dark:border-[#3b2259] bg-white dark:bg-[#26163d] hover:border-[#2c1547] dark:hover:border-[#8a4ed9]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.xlsx,.xls,.csv,.txt"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-[#f4f0f9] dark:bg-[#211336] rounded-full text-[#2c1547] dark:text-[#8a4ed9]">
            <Upload className="w-10 h-10 text-[#f57021]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2c1547] dark:text-[#f5f0fb]">
              Subir Distributivo Académico Docente
            </h3>
            <p className="text-sm text-[#6e5987] dark:text-[#b7a7cc] mt-1">
              Arrastra y suelta tu archivo PDF, Excel (.xlsx, .csv) o documento de texto aquí
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-[#6e5987] dark:text-[#b7a7cc]">
            <span className="flex items-center space-x-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Soporta Excel (.xlsx)</span>
            </span>
            <span className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Soporta PDF (.pdf)</span>
            </span>
          </div>

          {cargando && (
            <div className="flex items-center space-x-2 text-[#f57021] font-semibold text-sm animate-pulse">
              <div className="w-4 h-4 border-2 border-[#f57021] border-t-transparent rounded-full animate-spin"></div>
              <span>Analizando documento y ejecutando Core Determinístico...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center space-x-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selector Rápido de Casos de Prueba Sintéticos */}
      <div className="bg-white dark:bg-[#26163d] p-6 rounded-xl border border-[#e2d9ee] dark:border-[#3b2259] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-sm text-[#2c1547] dark:text-[#f5f0fb] flex items-center space-x-2">
              <Play className="w-4 h-4 text-[#f57021]" />
              <span>Ejecutar Casos de Prueba del SPEC (Demostración Inmediata)</span>
            </h4>
            <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">
              Prueba la detección del Core determinístico con los casos sintéticos validados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC01", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "08:00", hora_fin: "09:00", asignatura: "MATEMATICA", aula: "A1" },
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "09:00", hora_fin: "10:00", asignatura: "FISICA", aula: "A1" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">TC-01 — SIN CRUCE</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Horarios secuenciales OK</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC02", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:30", hora_fin: "11:30", asignatura: "MATEMATICA", aula: "A1" },
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "11:30", hora_fin: "12:30", asignatura: "FISICA", aula: "A1" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">TC-02 — BLOQUES CONTIGUOS</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">10:30-11:30 y 11:30-12:30</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC03", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:30", hora_fin: "11:30", asignatura: "MATEMATICA", aula: "A1" },
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:45", hora_fin: "11:15", asignatura: "FISICA", aula: "B1" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">TC-03 — CRUCE DOCENTE</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Docente solapado en 2 aulas</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC04", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:30", hora_fin: "11:30", asignatura: "MATEMATICA", aula: "B4" },
              { docente: "DOCENTE B", dia: "Lunes", hora_inicio: "10:45", hora_fin: "11:15", asignatura: "FISICA", aula: "B4" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">TC-04 — CRUCE AULA</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Misma aula B4 solapada</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC05", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:30", hora_fin: "11:30", asignatura: "MATEMATICA", aula: "B4" },
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:45", hora_fin: "11:15", asignatura: "FISICA", aula: "B4" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">TC-05 — DOCENTE Y AULA</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Cruce simultáneo total</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC06", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "10:00", hora_fin: "10:30", asignatura: "MATEMATICA", aula: "A1" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">TC-06 — FRANJA 10:00-10:30</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Uso de franja prohibida</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC08", [
              { docente: "DOCENTE A", dia: "Lunes", hora_inicio: "11:30", hora_fin: "12:30", asignatura: "MATEMATICA", aula: "" }
            ])}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 block">TC-08 — DATO FALTANTE</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Falta especificar aula</span>
          </button>

          <button
            onClick={() => ejecutarCasoPruebaSintetico("TC09", [], true)}
            disabled={cargando}
            className="p-3 text-left border border-[#e2d9ee] dark:border-[#3b2259] rounded-lg hover:border-[#f57021] transition-all bg-[#f4f0f9]/50 dark:bg-[#211336]/50"
          >
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block">TC-09 — NO APLICA</span>
            <span className="text-[11px] text-[#6e5987] dark:text-[#b7a7cc]">Documento ajeno / Acta</span>
          </button>
        </div>
      </div>

    </div>
  );
};
