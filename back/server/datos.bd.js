// Fuente de datos "bd": PostgreSQL (DATA_SOURCE=bd) — pensada para el
// servidor propio. Cada publicación además exporta el mismo JSON a
// back/data/ (igual que el modo archivo) como respaldo legible en git,
// por si la base de datos fallara — la BD es la fuente real, el archivo
// es solo copia de seguridad.
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

async function listarAulas() {
  const r = await pool.query('SELECT codigo_qr FROM aula ORDER BY codigo_qr');
  return r.rows.map((f) => f.codigo_qr);
}

async function listarCampus() {
  const r = await pool.query('SELECT nombre, ciudad, prefijo FROM campus ORDER BY ciudad, nombre');
  return r.rows;
}

async function listarAulasConCampus() {
  const r = await pool.query(
    `SELECT a.codigo_qr AS aula, c.nombre AS campus
     FROM aula a JOIN campus c ON c.id = a.campus_id
     ORDER BY a.codigo_qr`
  );
  return r.rows;
}

async function obtenerAula(id) {
  const rAula = await pool.query(
    `SELECT a.id, a.codigo_qr AS aula, a.capacidad, c.nombre AS campus
     FROM aula a JOIN campus c ON c.id = a.campus_id
     WHERE UPPER(a.codigo_qr) = UPPER($1)`,
    [id]
  );
  if (rAula.rows.length === 0) return null;
  const aula = rAula.rows[0];

  const rBloques = await pool.query(
    `SELECT dia, hora_inicio, hora_fin, materia, docente, carrera, nivel, paralelo
     FROM bloque_horario WHERE aula_id = $1
     ORDER BY dia, hora_inicio`,
    [aula.id]
  );

  return {
    aula: aula.aula,
    campus: aula.campus,
    capacidad: aula.capacidad,
    bloques: rBloques.rows.map((b) => ({
      dia: b.dia,
      // PostgreSQL devuelve TIME como "HH:MM:SS" — el resto de la app
      // (front y parser) trabaja en "HH:MM".
      horaInicio: b.hora_inicio.slice(0, 5),
      horaFin: b.hora_fin.slice(0, 5),
      materia: b.materia,
      docente: b.docente,
      carrera: b.carrera,
      nivel: b.nivel,
      paralelo: b.paralelo,
    })),
  };
}

async function publicarAula(id, datos, usuarioAdminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const rCampus = await client.query('SELECT id FROM campus WHERE nombre = $1', [datos.campus]);
    if (rCampus.rows.length === 0) {
      throw new Error(`Campus "${datos.campus}" no existe en la base de datos.`);
    }
    const campusId = rCampus.rows[0].id;

    // El UNIQUE de la base evita que dos aulas DISTINTAS terminen con el
    // mismo codigo_qr, pero no evita que un "ON CONFLICT DO UPDATE" sin
    // más reasigne silenciosamente una aula ya existente a otro campus —
    // justo el caso que preocupa al sumar campus nuevos (ej. un admin de
    // Quito publica "A1" por error, sin su prefijo, y pisaría el aula A1
    // real de Manuela Sáenz). Por eso se verifica a mano antes: solo se
    // permite el upsert si el codigo_qr no existe todavía, o si ya
    // pertenece a ESTE MISMO campus (republicar el horario de esa aula).
    const rExistente = await client.query(
      `SELECT a.id, a.campus_id, a.nombre, c.nombre AS campus_nombre
       FROM aula a JOIN campus c ON c.id = a.campus_id
       WHERE a.codigo_qr = $1`,
      [id]
    );
    if (rExistente.rows.length > 0 && rExistente.rows[0].campus_id !== campusId) {
      const existente = rExistente.rows[0];
      throw new Error(
        `El código "${id}" ya pertenece al aula "${existente.nombre}" del campus "${existente.campus_nombre}". ` +
        `Si es una aula distinta, usar un codigo_qr que no choque (ej. con el prefijo del campus "${datos.campus}").`
      );
    }

    const rAula = await client.query(
      `INSERT INTO aula (campus_id, nombre, codigo_qr, capacidad)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (codigo_qr) DO UPDATE SET capacidad = EXCLUDED.capacidad, campus_id = EXCLUDED.campus_id
       RETURNING id`,
      [campusId, datos.aula, id, datos.capacidad ?? null]
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

    await client.query(
      'INSERT INTO publicacion_log (usuario_admin_id, aula_id) VALUES ($1, $2)',
      [usuarioAdminId ?? null, aulaId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Respaldo en JSON, fuera de la transacción: si esto falla no debe
  // deshacer la publicación ya confirmada en la base de datos.
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(datos, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error(`Advertencia: se publicó ${id} en la base de datos pero falló el respaldo en JSON:`, err.message);
  }
}

module.exports = { listarAulas, listarAulasConCampus, listarCampus, obtenerAula, publicarAula };
