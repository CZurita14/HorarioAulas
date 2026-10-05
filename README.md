# Horarios por Aula

Reemplaza el flujo QR → SharePoint → PDF por una página web que muestra automáticamente
la clase en curso y la siguiente en cada aula, más un horario completo navegable por día.

## Arquitectura

Monolito organizado en tres carpetas con responsabilidades claras:

```
/front       → la app web (React + Vite + TypeScript + Tailwind). Lo único que corre en el navegador.
/back        → los datos del horario (back/data/<ID>.json, uno por aula) y su esquema.
/consumos    → integraciones externas (hoy: el proceso de leer SharePoint).
```

Hoy el sitio se despliega como estático: en build time, `/front` importa
directamente los JSON de `/back/data` (ver `front/src/services/aulaService.ts`),
sin un servidor corriendo en producción. `/consumos` documenta cómo llegan esos
datos desde SharePoint (hoy manual; ver `consumos/sharepoint/README.md` para el
detalle y qué falta para automatizarlo).

## Desarrollo

```bash
cd front
npm install
npm run dev
```

## Build / Deploy (Render)

El servicio en Render debe construir desde la carpeta `front/`, no desde la raíz
del repo:

- **Root Directory:** `front`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

## Docker

```bash
docker compose up --build
```

Sirve la app en `http://localhost:8080`. El `Dockerfile` vive en la raíz (no en
`front/`) porque el build necesita ver `front/` y `back/` juntos — el front lee
`back/data/*.json` en build time. Es un build multi-stage: compila con Node y
sirve el resultado estático con nginx (`nginx.conf`).

## Datos

Cada aula tiene su propio archivo `back/data/<ID>.json` (mismo esquema), por ejemplo
`back/data/A4.json`. Agregar una aula nueva es agregar su JSON ahí — no hace falta
tocar código de front. Ver el esquema en
`docs/superpowers/specs/2026-10-03-horarios-aula-design.md` y el detalle en
`back/README.md`.

## Aulas, QR y letreros

La app es un solo sitio; cada aula se identifica con el parámetro `aula` en la URL:

- `https://horarioaulas.onrender.com/?aula=A4`
- `https://horarioaulas.onrender.com/?aula=B2`

Cada QR impreso debe apuntar a la URL de su propia aula. Una URL sin el parámetro
`aula` muestra el Aula A4 por defecto. Si el valor de `aula` no corresponde a
ningún archivo en `back/data/`, la app muestra "Aula no encontrada" junto con la
lista completa de aulas disponibles, en vez de una pantalla rota.

Hay dos sets de material imprimible con el QR de cada aula:
- `qr/`: tarjetas PNG genéricas, una por aula.
- `letreros_individuales/`: letreros en PDF con el logo y colores oficiales de la
  Universidad Indoamérica — son los que se deben imprimir y pegar en cada puerta.

## Estado

Multi-aula (37 aulas del campus Manuela Sáenz), datos cargados manualmente desde
SharePoint (ver `/consumos`) — sin panel administrativo, sin manejo de
cambios/suspensiones, sin backend corriendo en producción todavía. Ver el spec de
diseño para el alcance completo y lo diferido a fases futuras.
