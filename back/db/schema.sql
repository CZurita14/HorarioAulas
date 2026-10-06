-- Esquema de base de datos del Sistema de Horarios por Aula.
-- Reemplaza, para quien lo despliegue con DATA_SOURCE=bd, los archivos
-- back/data/<AULA>.json como fuente de los horarios.
--
-- Diseño pensado para que la Universidad Indoamérica replique esto en
-- varias ciudades, no solo Ambato (hoy: Ambato — Manuela Sáenz, Simón
-- Bolívar y Parque Tecnológico Santa Rosa — más Quito y Latacunga, cada
-- una con su propio campus). Ver back/db/README.md para cómo aplicarlo,
-- migrar los datos actuales y sumar un campus/ciudad nueva.

CREATE TABLE IF NOT EXISTS campus (
  id       SERIAL PRIMARY KEY,
  nombre   TEXT NOT NULL UNIQUE,
  -- Ciudad donde está el campus (ej. "Ambato", "Quito", "Latacunga").
  -- No es única por sí sola (varios campus pueden compartir ciudad,
  -- como pasa hoy con los 3 de Ambato) — solo agrupa/filtra en el admin.
  ciudad   TEXT NOT NULL,
  -- Prefijo corto del campus (ej. "MS", "SB", "PT", "QT", "LTG"). Se usa
  -- solo cuando un aula nueva choca de nombre con una de otro campus (ver
  -- codigo_qr en la tabla aula) — las aulas de Manuela Sáenz ya cargadas
  -- NO lo necesitan, conservan su código actual tal cual.
  prefijo  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS aula (
  id         SERIAL PRIMARY KEY,
  campus_id  INTEGER NOT NULL REFERENCES campus(id),
  -- Nombre del aula tal como la conoce el campus (ej. "A1"). Puede
  -- repetirse ENTRE campus distintos (cada campus tiene su propia A1),
  -- pero no dos veces dentro del mismo campus.
  nombre     TEXT NOT NULL,
  -- Código que lleva el QR de la puerta (?aula=<codigo_qr>). Es ÚNICO EN
  -- TODA LA UNIVERSIDAD — la base de datos lo exige con UNIQUE, así que
  -- es imposible que dos aulas de campus distintos terminen compartiendo
  -- QR por accidente, aunque tengan el mismo nombre visible.
  codigo_qr  TEXT NOT NULL UNIQUE,
  capacidad  INTEGER,
  UNIQUE (campus_id, nombre)
);

CREATE TABLE IF NOT EXISTS bloque_horario (
  id           SERIAL PRIMARY KEY,
  aula_id      INTEGER NOT NULL REFERENCES aula(id) ON DELETE CASCADE,
  dia          TEXT NOT NULL CHECK (dia IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  materia      TEXT NOT NULL,
  docente      TEXT NOT NULL,
  carrera      TEXT NOT NULL,
  nivel        TEXT NOT NULL,
  paralelo     TEXT NOT NULL,
  CHECK (hora_inicio < hora_fin)
);

CREATE INDEX IF NOT EXISTS idx_bloque_horario_aula     ON bloque_horario(aula_id);
CREATE INDEX IF NOT EXISTS idx_bloque_horario_aula_dia ON bloque_horario(aula_id, dia);

-- Cuentas de administrador. Reemplaza el ADMIN_USER/ADMIN_PASSWORD fijo
-- por variable de entorno — cada persona puede tener la suya.
CREATE TABLE IF NOT EXISTS usuario_admin (
  id             SERIAL PRIMARY KEY,
  usuario        TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT true,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_acceso  TIMESTAMPTZ
);

-- Auditoría: quién publicó qué horario y cuándo.
CREATE TABLE IF NOT EXISTS publicacion_log (
  id                SERIAL PRIMARY KEY,
  usuario_admin_id  INTEGER REFERENCES usuario_admin(id),
  aula_id           INTEGER NOT NULL REFERENCES aula(id),
  publicado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre_pdf        TEXT
);
