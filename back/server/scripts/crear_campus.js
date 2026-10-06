/**
 * Crea (o actualiza) un campus — para sumar una sede nueva, de Ambato o
 * de otra ciudad (ej. Quito, Latacunga), sin tocar la carga inicial de
 * migrar_json_a_bd.js.
 *
 * Uso:
 *   DATABASE_URL=postgres://... node back/server/scripts/crear_campus.js \
 *     "<nombre del campus>" "<ciudad>" <prefijo>
 *
 * Ejemplo:
 *   node back/server/scripts/crear_campus.js "Quito 1" "Quito" QT
 *   node back/server/scripts/crear_campus.js "Latacunga" "Latacunga" LTG
 *
 * El prefijo es el que debe llevar el codigo_qr de cada aula de este
 * campus para evitar choques con aulas de otros campus (ver
 * back/db/README.md) — ej. con prefijo "QT", el aula "A1" de Quito
 * debería cargarse con codigo_qr "QT-A1", no "A1".
 *
 * Si el campus ya existe (mismo nombre), actualiza su ciudad/prefijo en
 * vez de fallar.
 */
const { Pool } = require('pg');
const { sslConfigPara } = require('../pgSsl');

const [, , nombre, ciudad, prefijo] = process.argv;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: falta DATABASE_URL.');
  process.exit(1);
}
if (!nombre || !ciudad || !prefijo) {
  console.error('Uso: node back/server/scripts/crear_campus.js "<nombre>" "<ciudad>" <prefijo>');
  process.exit(1);
}
if (!/^[A-Za-z0-9]{1,10}$/.test(prefijo)) {
  console.error('ERROR: el prefijo debe ser alfanumérico, sin espacios, de hasta 10 caracteres (ej. "QT", "LTG").');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: sslConfigPara(DATABASE_URL) });
  try {
    const r = await pool.query(
      `INSERT INTO campus (nombre, ciudad, prefijo)
       VALUES ($1, $2, $3)
       ON CONFLICT (nombre) DO UPDATE SET ciudad = EXCLUDED.ciudad, prefijo = EXCLUDED.prefijo
       RETURNING id, nombre, ciudad, prefijo`,
      [nombre, ciudad, prefijo.toUpperCase()]
    );
    const c = r.rows[0];
    console.log(`Listo: campus "${c.nombre}" (${c.ciudad}, id ${c.id}) con prefijo "${c.prefijo}" creado/actualizado.`);
    console.log(`Las aulas que se carguen para este campus deben usar codigo_qr con el prefijo "${c.prefijo}-" si su nombre puede chocar con el de otro campus.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Falló:', err.message);
  process.exit(1);
});
