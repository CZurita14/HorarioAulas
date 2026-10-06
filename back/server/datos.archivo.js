// Fuente de datos "archivo": back/data/<AULA>.json — el comportamiento
// original, el que sigue usando la demo en Render (DATA_SOURCE=archivo,
// el valor por defecto).
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// Modo archivo no tiene tabla "campus" (no hay base de datos) — devuelve
// fijo los 3 campus de Ambato que son los únicos con aulas cargadas en
// este modo (el que usa la demo en Render). En modo "bd" esto sale de
// la tabla campus de verdad y puede crecer sin tocar código.
const CAMPUS_FIJOS = [
  { nombre: 'Manuela Sáenz', ciudad: 'Ambato', prefijo: 'MS' },
  { nombre: 'Simón Bolívar', ciudad: 'Ambato', prefijo: 'SB' },
  { nombre: 'Parque Tecnológico Santa Rosa', ciudad: 'Ambato', prefijo: 'PT' },
];

async function listarCampus() {
  return CAMPUS_FIJOS;
}

async function listarAulas() {
  const archivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  return archivos
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')).aula;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort();
}

async function obtenerAula(id) {
  const archivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const f of archivos) {
    try {
      const datos = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      if (datos.aula && datos.aula.toUpperCase() === id.toUpperCase()) {
        return datos;
      }
    } catch {
      // archivo corrupto, se ignora
    }
  }
  return null;
}

async function publicarAula(id, datos) {
  const archivoDestino = path.join(DATA_DIR, `${id}.json`);
  fs.writeFileSync(archivoDestino, JSON.stringify(datos, null, 2) + '\n', 'utf-8');
}

module.exports = { listarAulas, listarCampus, obtenerAula, publicarAula };
