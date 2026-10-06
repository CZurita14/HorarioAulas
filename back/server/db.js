// Pool de conexión a PostgreSQL. Solo se usa cuando DATA_SOURCE=bd — en
// modo "archivo" (el de la demo en Render) este módulo nunca se importa.
const { Pool } = require('pg');
const { sslConfigPara } = require('./pgSsl');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATA_SOURCE=bd requiere la variable de entorno DATABASE_URL.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: sslConfigPara(DATABASE_URL) });

module.exports = pool;
