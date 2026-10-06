// Elige la fuente de datos según DATA_SOURCE. Por defecto "archivo"
// (comportamiento actual, el que usa la demo en Render) — el servidor
// propio la cambia a "bd" por variable de entorno. Ver back/db/README.md.
const DATA_SOURCE = (process.env.DATA_SOURCE || 'archivo').toLowerCase();

if (!['archivo', 'bd'].includes(DATA_SOURCE)) {
  console.error(`ERROR: DATA_SOURCE="${DATA_SOURCE}" inválido — debe ser "archivo" o "bd".`);
  process.exit(1);
}

module.exports = DATA_SOURCE === 'bd' ? require('./datos.bd') : require('./datos.archivo');
module.exports.DATA_SOURCE = DATA_SOURCE;
