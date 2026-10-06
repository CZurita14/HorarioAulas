# /back — Datos del horario y backend

El backend puede leer y guardar los horarios de dos formas, elegidas con
la variable de entorno `DATA_SOURCE`:

- **`archivo`** (default): los archivos JSON de `back/data/`. Es la que
  usa la demo en Render — simple, no necesita base de datos.
- **`bd`**: PostgreSQL. Es la que usa (o debería usar) el servidor propio
  — ver `back/db/README.md` para el porqué y cómo migrar. En este modo,
  `back/data/` pasa a ser solo una copia de respaldo (cada publicación la
  actualiza igual, pero ya no es de ahí que se lee).

## `/back/data`

Un archivo JSON por aula, con el esquema documentado en
`docs/superpowers/specs/2026-10-03-horarios-aula-design.md`. En modo
`archivo` es la fuente de verdad; en modo `bd` es la copia de respaldo
(ver arriba). El front siempre la pide por `GET /api/aulas/:id`, sin
saber cuál de los dos modos hay detrás.

### Agregar una aula nueva

1. Crear `back/data/<ID>.json` siguiendo el mismo esquema que `A4.json`
   (mismo `aula`, `campus`, `capacidad`, lista de `bloques`). Se puede
   hacer a mano, o publicarlo desde el panel de administración (ver abajo).
2. El QR de esa aula debe apuntar a `?aula=<ID>` (ver README raíz).

## `/back/server` — backend de administración

Servidor Node/Express chico con tres responsabilidades:

1. **Servir los datos públicos** — `GET /api/aulas` (lista de IDs) y
   `GET /api/aulas/:id` (horario de una aula). Sin autenticación, los
   consume el front para cualquier visitante.
2. **Autenticar al admin** — `POST /api/admin/login` (usuario/contraseña
   contra `ADMIN_USER`/`ADMIN_PASSWORD`, variables de entorno), cookie de
   sesión firmada con `JWT_SECRET`. Todas las rutas `/api/admin/*` excepto
   login exigen esa cookie.
3. **Previsualizar y publicar un horario nuevo** — el admin sube el PDF
   "USO DE AULAS" de una aula (`POST /api/admin/preview`), el servidor lo
   manda a `consumos/sharepoint/parse_pdf.py` (como subproceso de Python)
   y devuelve el JSON resultante + advertencias para que el admin lo
   revise en el front antes de confirmar. Al confirmar
   (`POST /api/admin/publicar`), se sobreescribe `back/data/<ID>.json` —
   ese mismo archivo que ya leen `GET /api/aulas/:id` y (en el servidor)
   `git status`.

En modo `archivo`, el login (2) compara contra `ADMIN_USER`/`ADMIN_PASSWORD`
(variables de entorno, un solo admin fijo) — igual que antes. En modo `bd`,
compara contra la tabla `usuario_admin` (varias cuentas reales, contraseña
con hash) — ver `back/db/README.md`.

Variables de entorno: `JWT_SECRET` siempre requerida. En modo `archivo`,
además `ADMIN_PASSWORD` (`ADMIN_USER` opcional, default `admin`). En modo
`bd`, además `DATABASE_URL`. El servidor rehúsa arrancar si falta alguna
de las que correspondan al modo elegido.

### Desarrollo local

```bash
cd back/server
npm install
ADMIN_PASSWORD=algo JWT_SECRET=algo-largo npm run dev        # modo archivo (default)
```

```bash
# modo bd (necesita un PostgreSQL corriendo y el esquema ya aplicado,
# ver back/db/README.md)
DATA_SOURCE=bd DATABASE_URL=postgresql://... JWT_SECRET=algo-largo npm run dev
```

El front en modo `npm run dev` ya tiene un proxy a `http://localhost:3001`
configurado en `front/vite.config.ts` (variable `VITE_API_URL` para
apuntar a otro puerto/host).

## De dónde salen los datos originales

Por ahora, de forma manual: alguien consigue el PDF de SharePoint de esa
aula (ver `/consumos/sharepoint/README.md` para el detalle del proceso y
por qué todavía no está automatizado) y lo sube por el panel de admin, o
corre `consumos/sharepoint/parse_pdf.py` a mano.
