import React from 'react';

// Pantalla que se muestra cuando se entra al sitio SIN un ?aula= en la URL
// (ej. alguien escribe el dominio directo, sin escanear ningún QR) — antes
// esto caía de forma automática al Aula A4, lo cual era confuso para
// cualquiera que no haya escaneado el QR de esa aula puntual.
export const BienvenidaInicio: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface motion-safe:transition-colors motion-safe:duration-700 rounded-2xl border border-border overflow-hidden shadow-sm">
        <img
          src="/bienvenida-clases.jpg"
          alt="Bienvenidos a clases — Universidad Indoamérica"
          className="w-full h-auto"
        />
        <div className="p-6 text-center space-y-1.5">
          <h2 className="text-lg font-bold text-text">Sistema de Horarios por Aula</h2>
          <p className="text-sm text-text-muted">
            Escanea el código QR de la puerta de tu aula para ver su horario.
          </p>
        </div>
      </div>
    </div>
  );
};
