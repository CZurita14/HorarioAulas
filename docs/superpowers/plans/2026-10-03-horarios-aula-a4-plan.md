# Horarios Aula A4 (piloto) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first static web page for Aula A4 that, on load, automatically shows the class currently in session and the next one, plus a "full schedule" view with a day selector and cards — replacing the current QR → SharePoint PDF flow for this one classroom.

**Architecture:** Static site with no backend. A single JSON file (`data/A4.json`) holds the classroom's schedule blocks. All "current class / next class" logic runs client-side using pure, independently-testable functions (`src/schedule.js`). Two render functions (`src/render.js`) toggle between the main view and the full-schedule view inside one `#app` container — no router needed for a single-classroom pilot.

**Tech Stack:** Vite (dev server + static build), vanilla JavaScript (ES modules), Vitest (unit tests for the scheduling logic only — UI is verified manually in-browser per the spec).

---

## Context for the implementing engineer

- Design spec (read this first): [docs/superpowers/specs/2026-10-03-horarios-aula-design.md](../specs/2026-10-03-horarios-aula-design.md)
- Repo root for this project is `C:\Users\Chris\Desktop\CIA\Horarios` (its own git repo, remote `origin` → `https://github.com/CZurita14/HorarioAulas.git`, branch `main`). Do not touch anything outside this folder.
- Out of scope for this plan (confirmed with the user, deferred to a later phase): exceptions/room changes/cancellations, admin panel, auth, multiple classrooms, live SharePoint integration, public hosting/domain decisions.
- The real schedule for Aula A4 has not been provided yet. This plan ships with clearly-fake placeholder data in `data/A4.json` (named classes, "Por definir" as teacher) so the UI can be built and tested now. Swapping in the real data later is a one-file edit, not a code change.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.js` (placeholder content, filled in Task 6)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "horarios-aula-a4",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 3: Create `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Horario Aula A4 — Universidad Indoamérica</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Create a placeholder `src/main.js`**

```js
document.getElementById('app').innerHTML = '<p>Cargando horario...</p>';
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`, exits with code 0.

- [ ] **Step 6: Verify the dev server starts**

Run: `npm run dev -- --port 5173` (start it, confirm it prints a `Local:` URL, then stop it with Ctrl+C — or use the Browser pane's `preview_start` against this project to check `#app` renders "Cargando horario...")
Expected: no errors in the terminal/console; the page shows "Cargando horario..."

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore index.html src/main.js package-lock.json
git commit -m "chore: scaffold Vite project for aula horarios pilot"
```

---

## Task 2: Core scheduling logic (TDD)

This is the only module with unit tests — it's pure logic (no DOM), so it's cheap to test exhaustively, and it's the part most likely to have off-by-one bugs at class-transition boundaries.

**Files:**
- Create: `src/schedule.js`
- Test: `tests/schedule.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/schedule.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  parseHora,
  obtenerDiaActual,
  obtenerBloquesDia,
  obtenerClaseActual,
  obtenerClaseSiguiente,
} from '../src/schedule.js';

const bloquesLunes = [
  { dia: 'lunes', horaInicio: '08:00', horaFin: '10:00', materia: 'Ingeniería de Software', docente: 'A', carrera: 'TI', nivel: '6', paralelo: 'A' },
  { dia: 'lunes', horaInicio: '10:00', horaFin: '12:00', materia: 'Base de Datos', docente: 'B', carrera: 'TI', nivel: '6', paralelo: 'A' },
];

describe('parseHora', () => {
  it('convierte HH:MM a minutos desde medianoche', () => {
    expect(parseHora('08:00')).toBe(480);
    expect(parseHora('10:30')).toBe(630);
  });
});

describe('obtenerDiaActual', () => {
  it('mapea domingo a "domingo"', () => {
    expect(obtenerDiaActual(new Date('2026-10-04T12:00:00'))).toBe('domingo');
  });
  it('mapea lunes a "lunes"', () => {
    expect(obtenerDiaActual(new Date('2026-10-05T12:00:00'))).toBe('lunes');
  });
});

describe('obtenerBloquesDia', () => {
  it('filtra solo los bloques del día pedido y los ordena por hora', () => {
    const bloques = [
      { dia: 'martes', horaInicio: '09:00', horaFin: '11:00' },
      bloquesLunes[1],
      bloquesLunes[0],
    ];
    const resultado = obtenerBloquesDia(bloques, 'lunes');
    expect(resultado).toEqual([bloquesLunes[0], bloquesLunes[1]]);
  });
});

describe('obtenerClaseActual', () => {
  it('devuelve null antes de la primera clase', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('07:00'))).toBeNull();
  });
  it('devuelve la clase en curso entre su hora de inicio y fin', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('09:00'))).toEqual(bloquesLunes[0]);
  });
  it('en el minuto exacto de transición, la nueva clase ya está en curso', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('10:00'))).toEqual(bloquesLunes[1]);
  });
  it('devuelve null después de la última clase', () => {
    expect(obtenerClaseActual(bloquesLunes, parseHora('13:00'))).toBeNull();
  });
});

describe('obtenerClaseSiguiente', () => {
  it('devuelve la primera clase si aún no empieza ninguna', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('07:00'))).toEqual(bloquesLunes[0]);
  });
  it('devuelve la siguiente clase mientras una está en curso', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('09:00'))).toEqual(bloquesLunes[1]);
  });
  it('devuelve null en el minuto exacto de transición a la última clase', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('10:00'))).toBeNull();
  });
  it('devuelve null después de la última clase', () => {
    expect(obtenerClaseSiguiente(bloquesLunes, parseHora('13:00'))).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/schedule.test.js`
Expected: FAIL — `Failed to resolve import "../src/schedule.js"` (file doesn't exist yet).

- [ ] **Step 3: Implement `src/schedule.js`**

```js
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function obtenerDiaActual(fecha = new Date()) {
  return DIAS[fecha.getDay()];
}

export function parseHora(horaStr) {
  const [horas, minutos] = horaStr.split(':').map(Number);
  return horas * 60 + minutos;
}

export function obtenerBloquesDia(bloques, dia) {
  return bloques
    .filter((b) => b.dia === dia)
    .slice()
    .sort((a, b) => parseHora(a.horaInicio) - parseHora(b.horaInicio));
}

export function obtenerClaseActual(bloquesDia, minutosActuales) {
  return (
    bloquesDia.find(
      (b) => parseHora(b.horaInicio) <= minutosActuales && minutosActuales < parseHora(b.horaFin)
    ) ?? null
  );
}

export function obtenerClaseSiguiente(bloquesDia, minutosActuales) {
  const futuros = bloquesDia.filter((b) => parseHora(b.horaInicio) > minutosActuales);
  if (futuros.length === 0) return null;
  return futuros.reduce((masCercana, b) =>
    parseHora(b.horaInicio) < parseHora(masCercana.horaInicio) ? b : masCercana
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/schedule.test.js`
Expected: PASS — all 11 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/schedule.js tests/schedule.test.js
git commit -m "feat: add schedule logic (current/next class detection)"
```

---

## Task 3: Mock data and data loader

**Files:**
- Create: `data/A4.json`
- Create: `src/data.js`

- [ ] **Step 1: Create placeholder mock data `data/A4.json`**

This is clearly-fake data (to be replaced once the user shares the real schedule for Aula A4):

```json
{
  "aula": "A4",
  "capacidad": 30,
  "bloques": [
    { "dia": "lunes", "horaInicio": "08:00", "horaFin": "10:00", "materia": "Ingeniería de Software (DATO DE PRUEBA)", "docente": "Por definir", "carrera": "TI", "nivel": "6", "paralelo": "A" },
    { "dia": "lunes", "horaInicio": "10:00", "horaFin": "12:00", "materia": "Base de Datos (DATO DE PRUEBA)", "docente": "Por definir", "carrera": "TI", "nivel": "6", "paralelo": "A" },
    { "dia": "martes", "horaInicio": "14:00", "horaFin": "16:00", "materia": "Redes de Computadoras (DATO DE PRUEBA)", "docente": "Por definir", "carrera": "Software", "nivel": "4", "paralelo": "B" },
    { "dia": "miercoles", "horaInicio": "08:00", "horaFin": "11:00", "materia": "Cálculo Integral (DATO DE PRUEBA)", "docente": "Por definir", "carrera": "TI", "nivel": "2", "paralelo": "A" },
    { "dia": "viernes", "horaInicio": "16:00", "horaFin": "18:00", "materia": "Gestión de Proyectos (DATO DE PRUEBA)", "docente": "Por definir", "carrera": "Software", "nivel": "7", "paralelo": "A" }
  ]
}
```

- [ ] **Step 2: Create `src/data.js`**

```js
import aulaA4 from '../data/A4.json';

export function obtenerDatosAula() {
  return aulaA4;
}
```

- [ ] **Step 3: Verify the JSON import resolves**

Run: `node -e "import('./data/A4.json', { assert: { type: 'json' } }).then((m) => console.log(m.default.aula))"`
Expected: prints `A4`. (This just confirms the JSON file is syntactically valid; Vite handles the actual import differently at build/dev time and is checked in Task 6's manual verification.)

- [ ] **Step 4: Commit**

```bash
git add data/A4.json src/data.js
git commit -m "feat: add placeholder schedule data and data loader"
```

---

## Task 4: Render module — main view (current/next class)

**Files:**
- Create: `src/render.js`

- [ ] **Step 1: Implement the shared formatting helper and main-view renderer**

Create `src/render.js`:

```js
import {
  obtenerDiaActual,
  obtenerBloquesDia,
  obtenerClaseActual,
  obtenerClaseSiguiente,
} from './schedule.js';

function formatearBloque(bloque) {
  return `${bloque.materia}<br><span class="detalle">${bloque.nivel}.º Nivel - ${bloque.carrera} · Paralelo ${bloque.paralelo}</span><br><span class="detalle">Docente: ${bloque.docente}</span><br><span class="hora">${bloque.horaInicio} - ${bloque.horaFin}</span>`;
}

export function renderVistaPrincipal(contenedor, datosAula, fecha = new Date()) {
  const dia = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = obtenerBloquesDia(datosAula.bloques, dia);
  const actual = obtenerClaseActual(bloquesDia, minutosActuales);
  const siguiente = obtenerClaseSiguiente(bloquesDia, minutosActuales);

  const fechaTexto = fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  contenedor.innerHTML = `
    <header class="encabezado">
      <h1>AULA ${datosAula.aula}</h1>
      <p class="fecha">${fechaTexto}</p>
    </header>
    <section class="tarjeta tarjeta-actual ${actual ? 'en-curso' : 'vacia'}">
      <h2>${actual ? '🟢 CLASE ACTUAL' : 'SIN CLASES EN ESTE MOMENTO'}</h2>
      ${actual ? `<p>${formatearBloque(actual)}</p>` : ''}
    </section>
    ${
      siguiente
        ? `<section class="tarjeta tarjeta-siguiente">
            <h2>🔵 SIGUIENTE CLASE</h2>
            <p>${formatearBloque(siguiente)}</p>
          </section>`
        : ''
    }
    <button id="btn-ver-completo" class="boton-secundario">Ver horario completo</button>
  `;
}

export { formatearBloque };
```

- [ ] **Step 2: Commit**

```bash
git add src/render.js
git commit -m "feat: render main view with current/next class cards"
```

---

## Task 5: Render module — full schedule view

**Files:**
- Modify: `src/render.js`

- [ ] **Step 1: Add the full-schedule renderer**

Append to `src/render.js` (after `renderVistaPrincipal`, before the `export { formatearBloque }` line — fold that export into the main `export function` declarations instead):

```js
const NOMBRES_DIA = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function renderVistaCompleta(contenedor, datosAula, diaSeleccionado, fecha = new Date()) {
  const diaHoy = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = obtenerBloquesDia(datosAula.bloques, diaSeleccionado);
  const actual = diaSeleccionado === diaHoy ? obtenerClaseActual(bloquesDia, minutosActuales) : null;

  const chips = DIAS_SEMANA.map(
    (dia) => `
    <button class="chip ${dia === diaSeleccionado ? 'activo' : ''}" data-dia="${dia}">
      ${NOMBRES_DIA[dia]}${dia === diaHoy ? ' (Hoy)' : ''}
    </button>
  `
  ).join('');

  const tarjetas = bloquesDia.length
    ? bloquesDia
        .map(
          (b) => `
        <article class="tarjeta ${b === actual ? 'en-curso' : ''}">
          <p>${formatearBloque(b)}</p>
        </article>
      `
        )
        .join('')
    : '<p class="vacio">Sin clases este día.</p>';

  contenedor.innerHTML = `
    <header class="encabezado">
      <h1>AULA ${datosAula.aula}</h1>
      <button id="btn-volver" class="boton-secundario">&larr; Volver</button>
    </header>
    <div class="selector-dias">${chips}</div>
    <div class="lista-clases">${tarjetas}</div>
  `;
}
```

Remove the standalone `export { formatearBloque };` line from Task 4 and instead change its declaration from `function formatearBloque` to `export function formatearBloque` at the top of the file, so both renderers can use it without a duplicate export statement.

- [ ] **Step 2: Commit**

```bash
git add src/render.js
git commit -m "feat: render full schedule view with day selector"
```

---

## Task 6: Wire up main.js and styling

**Files:**
- Modify: `src/main.js`
- Create: `src/styles.css`

- [ ] **Step 1: Replace `src/main.js` with the real app bootstrap**

```js
import { obtenerDatosAula } from './data.js';
import { obtenerDiaActual } from './schedule.js';
import { renderVistaPrincipal, renderVistaCompleta } from './render.js';
import './styles.css';

const app = document.getElementById('app');
const datosAula = obtenerDatosAula();

let vista = 'principal';
let diaSeleccionado = obtenerDiaActual();

function render() {
  if (vista === 'principal') {
    renderVistaPrincipal(app, datosAula);
    document.getElementById('btn-ver-completo').addEventListener('click', () => {
      vista = 'completa';
      render();
    });
  } else {
    renderVistaCompleta(app, datosAula, diaSeleccionado);
    document.getElementById('btn-volver').addEventListener('click', () => {
      vista = 'principal';
      render();
    });
    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        diaSeleccionado = chip.dataset.dia;
        render();
      });
    });
  }
}

render();
setInterval(() => {
  if (vista === 'principal') render();
}, 60000);
```

- [ ] **Step 2: Create `src/styles.css`**

```css
:root {
  --color-azul: #2b3a67;
  --color-naranja: #e8622c;
  --color-fondo: #f4f5f7;
  --color-texto: #1f2430;
  --color-verde: #2e9e4f;
  --color-tarjeta: #ffffff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: var(--color-fondo);
  color: var(--color-texto);
}

#app {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-azul);
  color: white;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.encabezado h1 {
  margin: 0;
  font-size: 1.5rem;
}

.fecha {
  margin: 4px 0 0;
  text-transform: capitalize;
  opacity: 0.85;
}

.tarjeta {
  background: var(--color-tarjeta);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 6px solid transparent;
}

.tarjeta-actual.en-curso,
.tarjeta.en-curso {
  border-left-color: var(--color-verde);
}

.tarjeta-siguiente {
  border-left-color: var(--color-naranja);
}

.tarjeta h2 {
  margin: 0 0 8px;
  font-size: 1rem;
}

.detalle {
  color: #5a6072;
  font-size: 0.9rem;
}

.hora {
  display: inline-block;
  margin-top: 8px;
  font-weight: 600;
}

.boton-secundario {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: var(--color-naranja);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 8px;
}

.selector-dias {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.chip {
  flex: 0 0 auto;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-azul);
  background: white;
  color: var(--color-azul);
  cursor: pointer;
  white-space: nowrap;
}

.chip.activo {
  background: var(--color-azul);
  color: white;
}

.vacio {
  text-align: center;
  color: #5a6072;
  padding: 24px 0;
}
```

- [ ] **Step 3: Run the full unit test suite**

Run: `npm test`
Expected: PASS — all tests from Task 2 still green (this task doesn't add new unit tests; UI is verified manually in Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/main.js src/styles.css
git commit -m "feat: wire up view toggling and mobile-first styling"
```

---

## Task 7: Manual browser verification

The spec requires manual visual verification of both views on a mobile viewport — this is not a unit-testable concern.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server in the Browser pane**

Use `preview_start` with `name` pointing at a `.claude/launch.json` dev entry (create one if missing):

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "horarios-dev",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 5173
    }
  ]
}
```

- [ ] **Step 2: Emulate a mobile viewport**

Use the Browser pane's resize tool with the `mobile` preset (375x812).

- [ ] **Step 3: Verify the main view**

Confirm: header shows "AULA A4" and today's date; either a green "CLASE ACTUAL" card or "SIN CLASES EN ESTE MOMENTO" shows depending on the real current time against the mock data in `data/A4.json`; a "SIGUIENTE CLASE" card appears when applicable; the "Ver horario completo" button is visible without scrolling on a phone-width viewport.

- [ ] **Step 4: Verify the full schedule view**

Click "Ver horario completo". Confirm: day chips for Lunes–Sábado render, today's chip is marked "(Hoy)" and pre-selected; clicking a different day chip swaps the card list; clicking "Volver" returns to the main view.

- [ ] **Step 5: Fix any visual issues found, then re-verify**

If something looks wrong (overflow, unreadable text, misaligned cards), fix it in `src/styles.css` or `src/render.js` and repeat Steps 3–4 until both views look correct on the mobile viewport.

- [ ] **Step 6: Commit `.claude/launch.json` if created**

```bash
git add .claude/launch.json
git commit -m "chore: add dev server launch config for browser preview"
```

---

## Task 8: README and final push

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Horarios Aula A4 (piloto)

Reemplaza el flujo QR → SharePoint → PDF por una página web que muestra automáticamente
la clase en curso y la siguiente en el Aula A4, más un horario completo navegable por día.

## Desarrollo

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tests

\`\`\`bash
npm test
\`\`\`

## Datos

El horario vive en \`data/A4.json\`. Los datos actuales son de prueba (marcados con
"DATO DE PRUEBA" / "Por definir") — reemplázalos por el horario real del aula cuando
esté disponible, siguiendo el mismo esquema (ver
\`docs/superpowers/specs/2026-10-03-horarios-aula-design.md\`).

## Estado

Piloto v1 — una sola aula, sin panel administrativo, sin manejo de cambios/suspensiones.
Ver el spec de diseño para el alcance completo y lo diferido a fases futuras.
```

- [ ] **Step 2: Commit and push**

```bash
git add README.md
git commit -m "docs: add project README"
git push origin main
```

---

## Plan self-review notes

- **Spec coverage:** vista principal (Task 4/6), vista completa (Task 5/6), modelo de datos (Task 3), lógica clase actual/siguiente con casos límite (Task 2), estilo mobile-first institucional (Task 6), verificación visual manual (Task 7), datos mock reemplazables (Task 3 + README). Excepciones, panel admin, backend, multi-aula, hosting público: explicitly out of scope per spec section 2 and 8 — not tasked here, by design.
- **Type consistency:** `bloque` fields (`dia`, `horaInicio`, `horaFin`, `materia`, `docente`, `carrera`, `nivel`, `paralelo`) are identical across `data/A4.json`, `schedule.js` tests, and `render.js`'s `formatearBloque`. Function names (`obtenerDiaActual`, `obtenerBloquesDia`, `obtenerClaseActual`, `obtenerClaseSiguiente`, `obtenerDatosAula`, `renderVistaPrincipal`, `renderVistaCompleta`, `formatearBloque`) are used consistently across the files that import them.
