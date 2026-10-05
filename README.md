# Horarios por Aula

Reemplaza el flujo QR → SharePoint → PDF por una página web que muestra automáticamente
la clase en curso y la siguiente en cada aula, más un horario completo navegable por día.
Un administrador puede subir un horario actualizado (PDF) para una aula puntual sin
tocar código ni esperar un redeploy; los estudiantes nunca ven ningún login.

## Arquitectura

Monolito organizado en carpetas con responsabilidades claras:

```
/front        → la app web (React + Vite + TypeScript + Tailwind). Corre en el navegador.
/back/data    → los datos del horario (back/data/<ID>.json, uno por aula) y su esquema.
/back/server  → backend (Node/Express): sirve los datos, autentica al admin, recibe PDFs.
/consumos     → integraciones externas (hoy: el proceso de leer SharePoint).
```

El front ya **no** importa los JSON en build time: los pide en tiempo real a
`/api/aulas` y `/api/aulas/:id` (ver `front/src/services/aulaService.ts`). Esto
significa que la app **necesita un servidor corriendo** (ya no es un sitio 100%
estático) — ver `/back/README.md` para el backend y `DEPLOY.md` para producción.

## Panel de administrador

En el pie de página hay un botón discreto "Admin" (invisible para el flujo normal
de un estudiante, que nunca necesita loguearse). Lleva a un login
usuario/contraseña; una vez dentro, el admin elige un aula, sube su PDF "USO DE
AULAS", revisa una vista previa del horario que resulta (con cualquier
advertencia del parser) y confirma para publicarlo — se actualiza al instante
para cualquiera que abra esa aula, sin redeploy. Detalle técnico en
`/back/README.md`.

## Desarrollo

```bash
# Backend
cd back/server
npm install
ADMIN_PASSWORD=algo JWT_SECRET=algo-largo npm run dev

# Front (otra terminal)
cd front
npm install
npm run dev
```

## Docker / Producción

```bash
docker compose up --build
```

Levanta dos servicios: `api` (backend, puerto 3001 interno) y `front` (nginx
sirviendo la app compilada + proxy a `/api`), expuestos juntos en
`http://localhost:8080`. Requiere las variables `ADMIN_PASSWORD` y `JWT_SECRET`
(ver `docker-compose.yml`). Guía completa de despliegue en servidor propio en
`DEPLOY.md`.

**Nota sobre Render:** el deploy anterior en Render (`Root Directory: front`,
build estático) ya no sirve el panel de admin — Render como "Static Site" no
puede correr el backend. Mientras no se mueva a un Web Service con backend,
Render solo sirve para ver horarios (sin poder publicar actualizaciones desde
ahí).

## Datos

Cada aula tiene su propio archivo `back/data/<ID>.json` (mismo esquema), por ejemplo
`back/data/A4.json`. Se puede agregar/actualizar a mano o desde el panel de admin.
Ver el esquema en `docs/superpowers/specs/2026-10-03-horarios-aula-design.md` y el
detalle en `back/README.md`.

## Aulas, QR y letreros

Cada aula se identifica con el parámetro `aula` en la URL, ej. `?aula=A4`. El QR
de cada aula debe apuntar a su propia URL — y **no cambia** aunque el admin
actualice el horario de esa aula (la URL es siempre la misma, solo cambia el
contenido). Una URL sin `aula` muestra el Aula A4 por defecto; un `aula`
inexistente muestra "Aula no encontrada" con la lista completa de aulas.

Hay dos sets de material imprimible con el QR de cada aula:
- `qr/`: tarjetas PNG genéricas, una por aula.
- `letreros_individuales/`: letreros en PDF con el logo y colores oficiales de la
  Universidad Indoamérica — son los que se deben imprimir y pegar en cada puerta.

## Estado

Multi-aula (37 aulas del campus Manuela Sáenz) con panel de administrador para
actualizar horarios individuales. Datos originales cargados manualmente desde
SharePoint (ver `/consumos`). Sin manejo de cambios/suspensiones puntuales (solo
reemplazo de horario completo por aula). Ver el spec de diseño para el alcance
completo y lo diferido a fases futuras.
