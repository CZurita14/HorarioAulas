/**
 * Migra los horarios de back/data/*.json a PostgreSQL, y crea el primer
 * usuario administrador a partir de ADMIN_USER/ADMIN_PASSWORD.
 *
 * Se puede correr más de una vez sin duplicar nada: si el aula ya existe
 * reemplaza sus bloques (no los acumula), y si el usuario ya existe no lo
 * toca.
 *
 * Uso:
 *   DATABASE_URL=postgres://... ADMIN_USER=admin ADMIN_PASSWORD=algo \
 *     node back/server/scripts/migrar_json_a_bd.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { sslConfigPara } = require('../pgSsl');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!DATABASE_URL) {
  console.error('ERROR: falta DATABASE_URL.');
  process.exit(1);
}

// Los 3 campus de la universidad en Ambato. Solo Manuela Sáenz tiene
// aulas cargadas hoy — los otros dos quedan listos para cuando lleguen
// sus horarios. Para sumar un campus de otra ciudad (Quito, Latacunga),
// usar back/server/scripts/crear_campus.js en vez de tocar esta lista —
// ésta es solo la carga inicial de los 3 de Ambato.
const CAMPUS = [
  { nombre: 'Manuela Sáenz', ciudad: 'Ambato', prefijo: 'MS' },
  { nombre: 'Simón Bolívar', ciudad: 'Ambato', prefijo: 'SB' },
  { nombre: 'Parque Tecnológico Santa Rosa', ciudad: 'Ambato', prefijo: 'PT' },
];

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: sslConfigPara(DATABASE_URL) });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creando los 3 campus (si no existen)...');
    const idCampusPorNombre = {};
    for (const c of CAMPUS) {
      const r = await client.query(
        `INSERT INTO campus (nombre, ciudad, prefijo) VALUES ($1, $2, $3)
         ON CONFLICT (nombre) DO UPDATE SET ciudad = EXCLUDED.ciudad
         RETURNING id`,
        [c.nombre, c.ciudad, c.prefijo]
      );
      idCampusPorNombre[c.nombre] = r.rows[0].id;
    }

    const archivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
    console.log(`Migrando ${archivos.length} aulas desde ${DATA_DIR}...`);

    let migradas = 0;
    for (const archivo of archivos) {
      const datos = JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivo), 'utf-8'));
      const campusId = idCampusPorNombre[datos.campus];
      if (!campusId) {
        console.warn(`  ! ${archivo}: campus "${datos.campus}" no reconocido, se omite.`);
        continue;
      }

      // Las aulas que ya existían (Manuela Sáenz) conservan su código tal
      // cual como codigo_qr — ya son únicas entre sí, no hace falta
      // prefijo. Esto es justamente lo que evita tener que reimprimir los
      // QR ya hechos.
      const codigoQr = datos.aula;

      const rAula = await client.query(
        `INSERT INTO aula (campus_id, nombre, codigo_qr, capacidad)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo_qr) DO UPDATE SET capacidad = EXCLUDED.capacidad
         RETURNING id`,
        [campusId, datos.aula, codigoQr, datos.capacidad ?? null]
      );
      const aulaId = rAula.rows[0].id;

      await client.query('DELETE FROM bloque_horario WHERE aula_id = $1', [aulaId]);
      for (const b of datos.bloques) {
        await client.query(
          `INSERT INTO bloque_horario
             (aula_id, dia, hora_inicio, hora_fin, materia, docente, carrera, nivel, paralelo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [aulaId, b.dia, b.horaInicio, b.horaFin, b.materia, b.docente, b.carrera, b.nivel, b.paralelo]
        );
      }
      migradas++;
    }
    console.log(`${migradas} aulas migradas correctamente.`);

    if (ADMIN_USER && ADMIN_PASSWORD) {
      const existe = await client.query('SELECT id FROM usuario_admin WHERE usuario = $1', [ADMIN_USER]);
      if (existe.rows.length === 0) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await client.query(
          'INSERT INTO usuario_admin (usuario, password_hash) VALUES ($1, $2)',
          [ADMIN_USER, hash]
        );
        console.log(`Usuario administrador "${ADMIN_USER}" creado.`);
      } else {
        console.log(`Usuario administrador "${ADMIN_USER}" ya existía, no se modificó.`);
      }
    } else {
      console.log('ADMIN_USER/ADMIN_PASSWORD no definidos — no se creó ningún usuario administrador.');
      console.log('Podés crear uno a mano con back/db/crear_admin.js.');
    }

    await client.query('COMMIT');
    console.log('Listo.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Falló la migración, no se guardó nada:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
