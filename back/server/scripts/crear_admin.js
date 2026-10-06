/**
 * Crea (o actualiza la contraseña de) un usuario administrador.
 *
 * Uso:
 *   DATABASE_URL=postgres://... node back/server/scripts/crear_admin.js <usuario> <contraseña>
 *
 * Si el usuario ya existe, actualiza su contraseña y lo reactiva
 * (activo = true) en vez de fallar.
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const [, , usuario, password] = process.argv;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: falta DATABASE_URL.');
  process.exit(1);
}
if (!usuario || !password) {
  console.error('Uso: node back/db/crear_admin.js <usuario> <contraseña>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('ERROR: la contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const hash = await bcrypt.hash(password, 12);
  const r = await pool.query(
    `INSERT INTO usuario_admin (usuario, password_hash, activo)
     VALUES ($1, $2, true)
     ON CONFLICT (usuario) DO UPDATE SET password_hash = EXCLUDED.password_hash, activo = true
     RETURNING id, usuario`,
    [usuario, hash]
  );
  console.log(`Listo: usuario "${r.rows[0].usuario}" (id ${r.rows[0].id}) creado/actualizado.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Falló:', err.message);
  process.exit(1);
});
