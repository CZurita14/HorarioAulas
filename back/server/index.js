const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

// back/data vive un nivel arriba de este archivo (back/server/index.js -> back/data).
// En Docker, DATA_DIR se puede sobreescribir para apuntar a un volumen persistente.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const PARSER_PATH = process.env.PARSER_PATH || path.join(__dirname, '..', '..', 'consumos', 'sharepoint', 'parse_pdf.py');
const PYTHON_BIN = process.env.PYTHON_BIN || 'python3';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: falta la variable de entorno ADMIN_PASSWORD. El servidor no puede arrancar sin ella.');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('ERROR: falta la variable de entorno JWT_SECRET. El servidor no puede arrancar sin ella.');
  process.exit(1);
}

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 15 * 1024 * 1024 } });

app.use(express.json());
app.use(cookieParser());

const DIAS_VALIDOS = new Set(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']);
const CAMPOS_BLOQUE = ['dia', 'horaInicio', 'horaFin', 'materia', 'docente', 'carrera', 'nivel', 'paralelo'];

function idAulaValido(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_]{1,20}$/.test(id);
}

function validarDatosAula(datos) {
  if (!datos || typeof datos !== 'object') return 'El JSON no es un objeto.';
  if (!datos.aula || typeof datos.aula !== 'string') return 'Falta el campo "aula".';
  if (!Array.isArray(datos.bloques)) return 'Falta el campo "bloques" (debe ser una lista).';
  for (const [i, b] of datos.bloques.entries()) {
    for (const campo of CAMPOS_BLOQUE) {
      if (!b || typeof b[campo] !== 'string' || !b[campo].trim()) {
        return `Bloque #${i + 1}: falta o está vacío el campo "${campo}".`;
      }
    }
    if (!DIAS_VALIDOS.has(b.dia)) return `Bloque #${i + 1}: día inválido "${b.dia}".`;
    if (b.horaInicio >= b.horaFin) return `Bloque #${i + 1}: horaInicio (${b.horaInicio}) no es anterior a horaFin (${b.horaFin}).`;
  }
  return null;
}

// --- Auth ---------------------------------------------------------------

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'No hay sesión activa.' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }
}

app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body || {};
  if (usuario !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ ok: true, usuario });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ usuario: req.admin.usuario });
});

// --- Datos públicos de aulas (los consume el front en vez del import.meta.glob) ---

app.get('/api/aulas', (req, res) => {
  const archivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  const ids = archivos
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')).aula;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort();
  res.json(ids);
});

app.get('/api/aulas/:id', (req, res) => {
  const { id } = req.params;
  if (!idAulaValido(id)) return res.status(400).json({ error: 'ID de aula inválido.' });
  const archivos = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const f of archivos) {
    try {
      const datos = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      if (datos.aula && datos.aula.toUpperCase() === id.toUpperCase()) {
        return res.json(datos);
      }
    } catch {
      // archivo corrupto, se ignora
    }
  }
  res.status(404).json({ error: 'Aula no encontrada.' });
});

// --- Admin: previsualizar un PDF sin publicarlo ---------------------------

app.post('/api/admin/preview', requireAdmin, upload.single('pdf'), (req, res) => {
  const aulaId = req.body && req.body.aula;
  if (!idAulaValido(aulaId)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'ID de aula inválido.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún PDF.' });
  }

  const proceso = spawn(PYTHON_BIN, [PARSER_PATH, req.file.path, aulaId]);
  let stdout = '';
  let stderr = '';
  proceso.stdout.on('data', (d) => (stdout += d));
  proceso.stderr.on('data', (d) => (stderr += d));
  proceso.on('close', (codigo) => {
    fs.unlink(req.file.path, () => {});
    if (codigo !== 0) {
      return res.status(422).json({ error: 'No se pudo parsear el PDF.', detalle: stderr.trim() });
    }
    let datos;
    try {
      datos = JSON.parse(stdout);
    } catch {
      return res.status(500).json({ error: 'El parser devolvió un resultado inválido.', detalle: stdout.slice(0, 500) });
    }
    const errorValidacion = validarDatosAula(datos);
    if (errorValidacion) {
      return res.status(422).json({ error: 'El horario resultante no es válido: ' + errorValidacion });
    }
    const advertencias = stderr
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('ADVERTENCIA:'));
    res.json({ datos, advertencias });
  });
});

// --- Admin: publicar un horario (ya revisado) -----------------------------

app.post('/api/admin/publicar', requireAdmin, (req, res) => {
  const { aula, datos } = req.body || {};
  if (!idAulaValido(aula)) return res.status(400).json({ error: 'ID de aula inválido.' });
  const errorValidacion = validarDatosAula(datos);
  if (errorValidacion) return res.status(422).json({ error: errorValidacion });
  if (datos.aula.toUpperCase() !== aula.toUpperCase()) {
    return res.status(400).json({ error: 'El aula del body no coincide con la de la URL.' });
  }

  const archivoDestino = path.join(DATA_DIR, `${aula}.json`);
  fs.writeFileSync(archivoDestino, JSON.stringify(datos, null, 2) + '\n', 'utf-8');
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend de Horarios Aula escuchando en el puerto ${PORT} (DATA_DIR=${DATA_DIR})`);
});
