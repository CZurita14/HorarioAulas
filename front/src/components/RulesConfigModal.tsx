import React, { useState, useEffect } from 'react';
import { Settings, Save, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getConfiguracionReglas, updateConfiguracionReglas, ConfiguracionReglas } from '../services/api';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReglasGuardadas?: () => void;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({ isOpen, onClose, onReglasGuardadas }) => {
  const [config, setConfig] = useState<ConfiguracionReglas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      cargarConfiguracion();
    }
  }, [isOpen]);

  const cargarConfiguracion = async () => {
    setCargando(true);
    try {
      const data = await getConfiguracionReglas();
      setConfig(data);
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error al obtener la configuración de reglas' });
    } finally {
      setCargando(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setGuardando(true);
    setMensaje(null);
    try {
      await updateConfiguracionReglas(config);
      setMensaje({ tipo: 'exito', texto: '¡Configuración de reglas guardada correctamente!' });
      if (onReglasGuardadas) onReglasGuardadas();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message || 'Error al guardar la configuración' });
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#26163d] border border-[#e2d9ee] dark:border-[#3b2259] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transition-colors">
        
        {/* Header del Modal */}
        <div className="bg-[#2c1547] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Settings className="w-5 h-5 text-[#f57021]" />
            <h3 className="font-bold text-base">Ajuste Dinámico de Reglas Institucionales</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#b7a7cc] hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-xs text-[#6e5987] dark:text-[#b7a7cc] animate-pulse">
            Cargando parámetros institucionales...
          </div>
        ) : config ? (
          <form onSubmit={handleGuardar} className="p-6 space-y-6">
            
            {/* Sección de la Franja No Permitida */}
            <div className="p-4 rounded-lg bg-[#f4f0f9] dark:bg-[#211336] border border-[#e2d9ee] dark:border-[#3b2259] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-sm text-[#2c1547] dark:text-[#f5f0fb]">
                    Franja Institucional No Permitida (RN-09)
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.franja_no_permitida.activa}
                    onChange={(e) => setConfig({
                      ...config,
                      franja_no_permitida: {
                        ...config.franja_no_permitida,
                        activa: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f57021]"></div>
                </label>
              </div>

              <p className="text-xs text-[#6e5987] dark:text-[#b7a7cc]">
                Define el bloque horario prohibido para asignación de clases. Cualquier actividad que interseque esta franja se clasificará como incumplimiento.
              </p>

              {config.franja_no_permitida.activa && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">
                      Hora de Inicio (HH:MM)
                    </label>
                    <input
                      type="text"
                      value={config.franja_no_permitida.inicio}
                      onChange={(e) => setConfig({
                        ...config,
                        franja_no_permitida: {
                          ...config.franja_no_permitida,
                          inicio: e.target.value
                        }
                      })}
                      placeholder="10:00"
                      className="w-full px-3 py-2 bg-white dark:bg-[#150b24] border border-[#e2d9ee] dark:border-[#3b2259] rounded-md text-xs font-mono font-bold text-[#2c1547] dark:text-[#f5f0fb] focus:outline-none focus:border-[#f57021]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">
                      Hora de Fin (HH:MM)
                    </label>
                    <input
                      type="text"
                      value={config.franja_no_permitida.fin}
                      onChange={(e) => setConfig({
                        ...config,
                        franja_no_permitida: {
                          ...config.franja_no_permitida,
                          fin: e.target.value
                        }
                      })}
                      placeholder="10:30"
                      className="w-full px-3 py-2 bg-white dark:bg-[#150b24] border border-[#e2d9ee] dark:border-[#3b2259] rounded-md text-xs font-mono font-bold text-[#2c1547] dark:text-[#f5f0fb] focus:outline-none focus:border-[#f57021]"
                    />
                  </div>
                </div>
              )}
            </div>

            {mensaje && (
              <div className={`p-3 rounded-lg flex items-center space-x-2 text-xs font-medium ${
                mensaje.tipo === 'exito'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
              }`}>
                {mensaje.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{mensaje.texto}</span>
              </div>
            )}

            {/* Footer de Botones */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#e2d9ee] dark:border-[#3b2259]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-[#e2d9ee] dark:border-[#3b2259] text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] hover:bg-gray-100 dark:hover:bg-[#211336] transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-md bg-[#f57021] hover:bg-[#e05e10] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Ajustes'}</span>
              </button>
            </div>

          </form>
        ) : null}

      </div>
    </div>
  );
};
