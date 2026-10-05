# /back — Datos del horario y backend

## `/back/data`

Un archivo JSON por aula, con el esquema documentado en
`docs/superpowers/specs/2026-10-03-horarios-aula-design.md`. Es la fuente
de verdad que lee el backend (`/back/server`) y sirve al front en
`GET /api/aulas/:id` — el front ya no los importa en build time.

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

Variables de entorno requeridas: `ADMIN_USER` (opcional, default `admin`),
`ADMIN_PASSWORD`, `JWT_SECRET`. El servidor rehúsa arrancar sin
`ADMIN_PASSWORD`/`JWT_SECRET` definidas.

### Desarrollo local

```bash
cd back/server
npm install
ADMIN_PASSWORD=algo JWT_SECRET=algo-largo npm run dev
```

El front en modo `npm run dev` ya tiene un proxy a `http://localhost:3001`
configurado en `front/vite.config.ts` (variable `VITE_API_URL` para
apuntar a otro puerto/host).

## De dónde salen los datos originales

Por ahora, de forma manual: alguien consigue el PDF de SharePoint de esa
aula (ver `/consumos/sharepoint/README.md` para el detalle del proceso y
por qué todavía no está automatizado) y lo sube por el panel de admin, o
corre `consumos/sharepoint/parse_pdf.py` a mano.
