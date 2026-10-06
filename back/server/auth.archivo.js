// Autenticación "archivo": un único admin fijo por variable de entorno —
// el comportamiento original, el que sigue usando la demo en Render.
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: falta la variable de entorno ADMIN_PASSWORD. El servidor no puede arrancar sin ella.');
  process.exit(1);
}

async function verificarCredenciales(usuario, password) {
  if (usuario === ADMIN_USER && password === ADMIN_PASSWORD) {
    return { usuario };
  }
  return null;
}

module.exports = { verificarCredenciales };
