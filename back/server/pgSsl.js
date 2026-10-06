// Config SSL para conectar a PostgreSQL. Local y el Postgres propio del
// docker-compose.yml NO usan SSL (no tiene sentido entre contenedores de
// la misma red) — pero un Postgres gestionado (Render, y probablemente el
// de cualquier proveedor cloud) lo exige y rechaza conexiones sin TLS.
// Se detecta solo por el host de DATABASE_URL, sin variable nueva que
// configurar a mano.
function sslConfigPara(databaseUrl) {
  if (!databaseUrl) return false;
  try {
    const host = new URL(databaseUrl).hostname;
    const requiereSsl = /\.render\.com$/.test(host) || /\.amazonaws\.com$/.test(host);
    // rejectUnauthorized:false porque el certificado de estos proveedores
    // no siempre está en la cadena de confianza por defecto de Node — es
    // la configuración que recomiendan Render y la mayoría de proveedores
    // gestionados para conexiones salientes como esta.
    return requiereSsl ? { rejectUnauthorized: false } : false;
  } catch {
    return false;
  }
}

module.exports = { sslConfigPara };
