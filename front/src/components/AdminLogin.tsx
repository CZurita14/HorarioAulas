import React, { useState } from 'react';
import { Lock, LogIn, X } from 'lucide-react';
import { login } from '../services/aulaAdminService';

interface AdminLoginProps {
  onLoggedIn: () => void;
  onCerrar: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoggedIn, onCerrar }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(usuario, password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white dark:bg-[#26163d] rounded-2xl border border-[#e2d9ee] dark:border-[#3b2259] p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center space-x-2 text-[#2c1547] dark:text-[#f5f0fb]">
            <Lock className="w-5 h-5 text-[#f57021]" />
            <h2 className="text-lg font-bold">Acceso administrador</h2>
          </div>
          <button onClick={onCerrar} className="text-[#6e5987] dark:text-[#b7a7cc] hover:text-[#f57021]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              required
              className="w-full px-3 py-2 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259] bg-[#f4f0f9] dark:bg-[#211336] text-[#2c1547] dark:text-[#f5f0fb] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6e5987] dark:text-[#b7a7cc] mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-[#e2d9ee] dark:border-[#3b2259] bg-[#f4f0f9] dark:bg-[#211336] text-[#2c1547] dark:text-[#f5f0fb] text-sm"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#f57021] hover:bg-[#e05e10] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{cargando ? 'Ingresando…' : 'Ingresar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
