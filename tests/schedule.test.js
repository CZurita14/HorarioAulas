import { describe, it, expect } from 'vitest';
import {
  parseHora,
  obtenerDiaActual,
  obtenerBloquesDia,
  obtenerClaseActual,
  obtenerClaseSiguiente,
  obtenerLunesDeLaSemana,
  obtenerSegmentosLlenos,
} from '../src/schedule.js';

const bloquesLunes = [
  { dia: 'lunes', horaInicio: '08:00', horaFin: '10:00', materia: 'Ingeniería de Software', docente: 'A', carrera: 'TI', nivel: '6', paralelo: 'A' },
  { dia: 'lunes', horaInicio: '10:00', horaFin: '12:00', materia: 'Base de Datos', docente: 'B', carrera: 'TI', nivel: '6', paralelo: 'A' },
];

describe('parseHora', () => {
  it('convierte HH:MM a minutos desde medianoche', () => {
    expect(parseHora('08:00')).toBe(480);
    expect(parseHora('10:30')).toBe(630);
  });
});

describe('obtenerDiaActual', () => {
  it('mapea domingo a "domingo"', () => {
    expect(obtenerDiaActual(new Date('2026-10-04T12:00:00'))).toBe('domingo');
  });
  it('mapea lunes a "lunes"', () => {
    expect(obtenerDiaActual(new Date('2026-10-05T12:00:00'))).toBe('lunes');
  });
});

describe('obtenerBloquesDia', () => {
  it('filtra solo los bloques del día pedido y los ordena por hora', () => {
    const bloques = [
      { dia: 'martes', horaInicio: '09:00', horaFin: '11:00' },
      bloquesLunes[1],
      bloquesLunes[0],
    ];
    const resultado = obtenerBloquesDia(bloques, 'lunes');
    expect(resultado).toEqual([bloquesLunes[0], bloquesLunes[1]]);
  });
});

describe('obtenerClaseActual', () => {
  it('devuelve null antes de la primera clase', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('07:00'))).toBeNull();
  });
  it('devuelve la clase en curso entre su hora de inicio y fin', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('09:00'))).toEqual(bloquesLunes[0]);
  });
  it('en el minuto exacto de transición, la nueva clase ya está en curso', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('10:00'))).toEqual(bloquesLunes[1]);
  });
  it('devuelve null después de la última clase', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('13:00'))).toBeNull();
  });
});

describe('obtenerClaseSiguiente', () => {
  it('devuelve la primera clase si aún no empieza ninguna', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('07:00'))).toEqual(bloquesLunes[0]);
  });
  it('devuelve la siguiente clase mientras una está en curso', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('09:00'))).toEqual(bloquesLunes[1]);
  });
  it('devuelve null en el minuto exacto de transición a la última clase', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('10:00'))).toBeNull();
  });
  it('devuelve null después de la última clase', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('13:00'))).toBeNull();
  });
});

describe('obtenerLunesDeLaSemana', () => {
  it('devuelve la misma fecha si ya es lunes', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-05T10:00:00'));
    expect(lunes.getFullYear()).toBe(2026);
    expect(lunes.getMonth()).toBe(9);
    expect(lunes.getDate()).toBe(5);
  });
  it('retrocede hasta el lunes cuando la fecha es un miércoles', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-07T10:00:00'));
    expect(lunes.getDate()).toBe(5);
  });
  it('retrocede a la semana anterior cuando la fecha es domingo', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-04T10:00:00'));
    expect(lunes.getMonth()).toBe(8);
    expect(lunes.getDate()).toBe(28);
  });
});

describe('obtenerSegmentosLlenos', () => {
  it('devuelve 0 antes de que empiece la clase', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('07:00'), 14)).toBe(0);
  });
  it('devuelve 0 exactamente al inicio', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('08:00'), 14)).toBe(0);
  });
  it('devuelve aproximadamente la mitad a mitad de la clase', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('09:00'), 14)).toBe(7);
  });
  it('devuelve el total exactamente al final', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('10:00'), 14)).toBe(14);
  });
  it('no excede el total después del final', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('11:00'), 14)).toBe(14);
  });
});
