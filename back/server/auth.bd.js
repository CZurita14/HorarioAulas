// Autenticación "bd": varias cuentas de administrador, en la tabla
// usuario_admin (contraseña con hash bcrypt). Ver back/db/crear_admin.js
// para dar de alta una cuenta nueva.
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function verificarCredenciales(usuario, password) {
  const r = await pool.query(
    'SELECT id, usuario, password_hash FROM usuario_admin WHERE usuario = $1 AND activo = true',
    [usuario]
  );
  if (r.rows.length === 0) return null;

  const fila = r.rows[0];
  const coincide = await bcrypt.compare(password, fila.password_hash);
  if (!coincide) return null;

  pool.query('UPDATE usuario_admin SET ultimo_acceso = now() WHERE id = $1', [fila.id]).catch(() => {});

  return { usuario: fila.usuario, id: fila.id };
}

module.exports = { verificarCredenciales };
