const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function obtenerDiaActual(fecha = new Date()) {
  return DIAS[fecha.getDay()];
}

export function parseHora(horaStr) {
  const [horas, minutos] = horaStr.split(':').map(Number);
  return horas * 60 + minutos;
}

export function obtenerBloquesDia(bloques, dia) {
  return bloques
    .filter((b) => b.dia === dia)
    .slice()
    .sort((a, b) => parseHora(a.horaInicio) - parseHora(b.horaInicio));
}

export function obtenerClaseActual(bloquesDia, minutosActuales) {
  return (
    bloquesDia.find(
      (b) => parseHora(b.horaInicio) <= minutosActuales && minutosActuales < parseHora(b.horaFin)
    ) ?? null
  );
}

export function obtenerClaseSiguiente(bloquesDia, minutosActuales) {
  const futuros = bloquesDia.filter((b) => parseHora(b.horaInicio) > minutosActuales);
  if (futuros.length === 0) return null;
  return futuros.reduce((masCercana, b) =>
    parseHora(b.horaInicio) < parseHora(masCercana.horaInicio) ? b : masCercana
  );
}

export function obtenerLunesDeLaSemana(fecha) {
  const resultado = new Date(fecha);
  const diaSemana = resultado.getDay();
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  resultado.setDate(resultado.getDate() + offset);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

export function obtenerSegmentosLlenos(bloque, minutosActuales, totalSegmentos = 14) {
  const inicio = parseHora(bloque.horaInicio);
  const fin = parseHora(bloque.horaFin);
  const duracion = fin - inicio;
  const transcurrido = Math.min(Math.max(minutosActuales - inicio, 0), duracion);
  return Math.round((transcurrido / duracion) * totalSegmentos);
}
