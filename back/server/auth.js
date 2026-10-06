// Elige el módulo de autenticación según DATA_SOURCE — mismo criterio que
// datos.js. En modo "archivo", un solo admin fijo; en modo "bd", varias
// cuentas reales en la tabla usuario_admin.
const DATA_SOURCE = (process.env.DATA_SOURCE || 'archivo').toLowerCase();

module.exports = DATA_SOURCE === 'bd' ? require('./auth.bd') : require('./auth.archivo');
