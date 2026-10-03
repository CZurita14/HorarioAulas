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
- **This plan was updated after the user approved an interactive mockup** (built as a Claude Artifact, not part of this repo). The approved mockup adds behavior beyond the original spec text; this plan's Tasks 3–6 reflect the approved mockup exactly. Key additions vs. the original spec:
  - A "Campus Manuela Sáenz" subtitle in the header, under "AULA A4".
  - A live clock badge in the header (current time, e.g. "08:42 am") to reinforce that the page reflects the exact moment of scanning.
  - The current-class card is labeled **"CLASE EN CURSO"** (not "CLASE ACTUAL" — chosen for a more formal/institutional tone since this will be reviewed by university staff) and shows a segmented progress bar (a row of small rounded blocks, filled proportionally to elapsed time) between the start and end time labels, instead of a countdown sentence.
  - A **"Resto del día de hoy"** section below "siguiente clase" lists the remaining classes for today as compact rows, so the common case (checking today) needs zero extra clicks — "Ver horario completo" is only needed for other days.
  - In the full-schedule view, each day chip shows the abbreviated day name and date number stacked (e.g. "VIE" / "3"), with a "HOY" tag under today's chip, plus a full-text date line above the chips (e.g. "Viernes 03 de octubre") — added after the user found the original single-word day chips ("Lun", "Mar"...) ambiguous. Day navigation stays unrestricted across the whole week (confirmed with the user — chips are not locked to a date range).

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
  obtenerLunesDeLaSemana,
  obtenerSegmentosLlenos,
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

describe('obtenerLunesDeLaSemana', () => {
  it('devuelve la misma fecha si ya es lunes', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-05T10:00:00'));
    expect(lunes.getFullYear()).toBe(2026);
    expect(lunes.getMonth()).toBe(9);
    expect(lunes.getDate()).toBe(5);
  });
  it('retrocede hasta el lunes cuando la fecha es un miércoles', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-07T10:00:00'));
    expect(lunes.getDate()).toBe(5);
  });
  it('retrocede a la semana anterior cuando la fecha es domingo', () => {
    const lunes = obtenerLunesDeLaSemana(new Date('2026-10-04T10:00:00'));
    expect(lunes.getMonth()).toBe(8);
    expect(lunes.getDate()).toBe(28);
  });
});

describe('obtenerSegmentosLlenos', () => {
  it('devuelve 0 antes de que empiece la clase', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('07:00'), 14)).toBe(0);
  });
  it('devuelve 0 exactamente al inicio', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('08:00'), 14)).toBe(0);
  });
  it('devuelve aproximadamente la mitad a mitad de la clase', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('09:00'), 14)).toBe(7);
  });
  it('devuelve el total exactamente al final', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('10:00'), 14)).toBe(14);
  });
  it('no excede el total después del final', () => {
    expect(obtenerSegmentosLlenos(bloquesLunes[0], parseHora('11:00'), 14)).toBe(14);
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

export function obtenerLunesDeLaSemana(fecha) {
  const resultado = new Date(fecha);
  const diaSemana = resultado.getDay();
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  resultado.setDate(resultado.getDate() + offset);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

export function obtenerSegmentosLlenos(bloque, minutosActuales, totalSegmentos = 14) {
  const inicio = parseHora(bloque.horaInicio);
  const fin = parseHora(bloque.horaFin);
  const duracion = fin - inicio;
  const transcurrido = Math.min(Math.max(minutosActuales - inicio, 0), duracion);
  return Math.round((transcurrido / duracion) * totalSegmentos);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/schedule.test.js`
Expected: PASS — all 19 tests green.

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
  "campus": "Manuela Sáenz",
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

Note: `campus` is a single string describing the whole classroom record (not per-block) — it goes alongside `aula` and `capacidad` at the top level.

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
  obtenerLunesDeLaSemana,
  obtenerSegmentosLlenos,
} from './schedule.js';

const TOTAL_SEGMENTOS = 14;

export function formatearDetalle(bloque) {
  return `${bloque.nivel}.º Nivel · ${bloque.carrera} · Paralelo ${bloque.paralelo}`;
}

export function formatearHora12(fecha) {
  let horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const sufijo = horas >= 12 ? 'pm' : 'am';
  horas = horas % 12 || 12;
  return `${horas.toString().padStart(2, '0')}:${minutos} ${sufijo}`;
}

export function renderBarraProgreso(bloque, minutosActuales) {
  const llenos = obtenerSegmentosLlenos(bloque, minutosActuales, TOTAL_SEGMENTOS);
  const segmentos = Array.from({ length: TOTAL_SEGMENTOS }, (_, i) =>
    `<div class="segmento ${i < llenos ? 'lleno' : ''}"></div>`
  ).join('');
  return `
    <div class="barra-progreso">${segmentos}</div>
    <div class="barra-horas">
      <span>${bloque.horaInicio}</span>
      <span>${bloque.horaFin}</span>
    </div>
  `;
}

export function renderVistaPrincipal(contenedor, datosAula, fecha = new Date()) {
  const dia = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = obtenerBloquesDia(datosAula.bloques, dia);
  const actual = obtenerClaseActual(bloquesDia, minutosActuales);
  const siguiente = obtenerClaseSiguiente(bloquesDia, minutosActuales);
  const restoDelDia = bloquesDia.filter((b) => b !== actual && b !== siguiente && b.horaInicio > (siguiente?.horaInicio ?? ''));

  const fechaTexto = fecha.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  contenedor.innerHTML = `
    <header class="encabezado">
      <div class="encabezado-top">
        <span class="universidad">Universidad Indoamérica</span>
        <span class="reloj-vivo"><span class="punto-vivo"></span>${formatearHora12(fecha)}</span>
      </div>
      <h1>AULA ${datosAula.aula}</h1>
      <p class="campus">Campus ${datosAula.campus}</p>
      <p class="fecha">${fechaTexto}</p>
    </header>

    <div class="seccion-titulo">Ahora mismo en esta aula</div>

    <section class="tarjeta tarjeta-actual ${actual ? 'en-curso' : 'vacia'}">
      <h2>${actual ? 'CLASE EN CURSO' : 'SIN CLASES EN ESTE MOMENTO'}</h2>
      ${
        actual
          ? `<p class="materia">${actual.materia}</p>
             <p class="detalle">${formatearDetalle(actual)}</p>
             <p class="docente">Docente: ${actual.docente}</p>
             ${renderBarraProgreso(actual, minutosActuales)}`
          : ''
      }
    </section>

    ${
      siguiente
        ? `<section class="tarjeta tarjeta-siguiente">
            <div>
              <h2>SIGUIENTE</h2>
              <p class="materia-chica">${siguiente.materia}</p>
              <p class="docente">Docente: ${siguiente.docente}</p>
            </div>
            <span class="hora-chip">${siguiente.horaInicio}</span>
          </section>`
        : ''
    }

    ${
      restoDelDia.length
        ? `<div class="seccion-titulo">Resto del día de hoy</div>
           ${restoDelDia
             .map(
               (b) => `
             <div class="fila-resto">
               <div>
                 <p class="materia-chica">${b.materia}</p>
                 <p class="docente">${b.docente}</p>
               </div>
               <span class="hora-chica">${b.horaInicio}</span>
             </div>`
             )
             .join('')}`
        : ''
    }

    <button id="btn-ver-completo" class="boton-secundario">Ver horario completo de la semana</button>
  `;
}
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

Append to `src/render.js`, after `renderVistaPrincipal`:

```js
const NOMBRES_DIA = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};

const ABREV_DIA = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb' };

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

function obtenerFechasSemana(fecha) {
  const lunes = obtenerLunesDeLaSemana(fecha);
  return DIAS_SEMANA.map((dia, i) => {
    const fechaDia = new Date(lunes);
    fechaDia.setDate(lunes.getDate() + i);
    return { dia, fechaDia };
  });
}

export function renderVistaCompleta(contenedor, datosAula, diaSeleccionado, fecha = new Date()) {
  const diaHoy = obtenerDiaActual(fecha);
  const minutosActuales = fecha.getHours() * 60 + fecha.getMinutes();
  const bloquesDia = obtenerBloquesDia(datosAula.bloques, diaSeleccionado);
  const actual = diaSeleccionado === diaHoy ? obtenerClaseActual(bloquesDia, minutosActuales) : null;
  const fechasSemana = obtenerFechasSemana(fecha);
  const fechaSeleccionada = fechasSemana.find((f) => f.dia === diaSeleccionado).fechaDia;

  const fechaSeleccionadaTexto = fechaSeleccionada.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const chips = fechasSemana
    .map(
      ({ dia, fechaDia }) => `
    <button class="chip ${dia === diaSeleccionado ? 'activo' : ''}" data-dia="${dia}">
      <span class="chip-dia">${ABREV_DIA[dia]}</span>
      <span class="chip-numero">${fechaDia.getDate()}</span>
      <span class="chip-hoy">${dia === diaHoy ? 'HOY' : ''}</span>
    </button>
  `
    )
    .join('');

  const tarjetas = bloquesDia.length
    ? bloquesDia
        .map(
          (b) => `
        <article class="tarjeta ${b === actual ? 'en-curso' : ''}">
          ${b === actual ? '<h2 class="etiqueta-en-curso">EN CURSO</h2>' : ''}
          <p class="materia">${b.materia}</p>
          <p class="detalle">${formatearDetalle(b)}</p>
          <p class="docente">Docente: ${b.docente}</p>
          ${b === actual ? renderBarraProgreso(b, minutosActuales) : `<span class="hora-chip">${b.horaInicio} – ${b.horaFin}</span>`}
        </article>
      `
        )
        .join('')
    : '<p class="vacio">Sin clases este día.</p>';

  contenedor.innerHTML = `
    <header class="encabezado">
      <div>
        <span class="universidad">Universidad Indoamérica</span>
        <h1>AULA ${datosAula.aula}</h1>
        <p class="campus">Campus ${datosAula.campus}</p>
      </div>
      <button id="btn-volver" class="boton-secundario boton-volver">&larr; Volver</button>
    </header>
    <p class="fecha-seleccionada">${fechaSeleccionadaTexto}</p>
    <div class="selector-dias">${chips}</div>
    <div class="lista-clases">${tarjetas}</div>
  `;
}
```

`renderBarraProgreso` and `formatearDetalle` are the helpers already defined earlier in this same file by Task 4 — no additional import needed.

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
  background: var(--color-azul);
  color: white;
  padding: 20px 16px 18px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.encabezado-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.universidad {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
}

.reloj-vivo {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  padding: 3px 9px 3px 7px;
  border-radius: 999px;
}

.punto-vivo {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5eeb8f;
  display: inline-block;
}

.encabezado h1 {
  margin: 0;
  font-size: 1.5rem;
}

.campus,
.fecha,
.fecha-seleccionada {
  margin: 2px 0 0;
  opacity: 0.85;
  font-size: 0.85rem;
}

.fecha {
  text-transform: capitalize;
}

.fecha-seleccionada {
  color: var(--color-texto);
  opacity: 1;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: capitalize;
  margin: 4px 2px 10px;
}

.seccion-titulo {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9298a6;
  margin: 4px 2px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tarjeta h2,
.etiqueta-en-curso {
  margin: 0 0 8px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-verde);
}

.tarjeta-siguiente h2 {
  color: var(--color-naranja);
}

.materia {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 6px;
}

.materia-chica {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.detalle {
  color: #5a6072;
  font-size: 0.9rem;
  margin: 0 0 2px;
}

.docente {
  font-size: 0.85rem;
  color: #5a6072;
  margin: 0 0 10px;
}

.hora-chip,
.hora-chica {
  display: inline-block;
  background: #eef0f4;
  color: #5a6072;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.barra-progreso {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.segmento {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #e7eae0;
}

.segmento.lleno {
  background: var(--color-verde);
}

.barra-horas {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #5a6072;
  font-weight: 600;
  margin-top: 6px;
}

.fila-resto {
  background: var(--color-tarjeta);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  opacity: 0.85;
}

.boton-secundario {
  width: 100%;
  padding: 12px;
  border: 1px solid #d6d9e0;
  border-radius: 12px;
  background: white;
  color: var(--color-azul);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}

.boton-volver {
  width: auto;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  align-self: flex-start;
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
  width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 7px;
  border-radius: 14px;
  border: 1px solid #d6d9e0;
  background: white;
  color: #5a6072;
  cursor: pointer;
}

.chip.activo {
  background: var(--color-azul);
  border-color: var(--color-azul);
  color: white;
}

.chip-dia {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.chip-numero {
  font-size: 1rem;
  font-weight: 700;
}

.chip-hoy {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #9fd6ff;
  min-height: 0.7em;
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

Confirm: header shows "Universidad Indoamérica", a live clock badge with the current time, "AULA A4", "Campus Manuela Sáenz", and today's date; either a "CLASE EN CURSO" card with a segmented progress bar (partially filled proportional to elapsed time, start/end hour labels at each side) or "SIN CLASES EN ESTE MOMENTO" shows depending on the real current time against the mock data in `data/A4.json`; a compact "SIGUIENTE" row appears when applicable; a "Resto del día de hoy" section lists any further classes today as compact rows; the "Ver horario completo de la semana" button is visible without excessive scrolling on a phone-width viewport.

- [ ] **Step 4: Verify the full schedule view**

Click "Ver horario completo de la semana". Confirm: a full-text date line (e.g. "Viernes 03 de octubre") shows above the day chips; each day chip shows an abbreviation and date number stacked (e.g. "VIE" / "3"), today's chip is marked "HOY" and pre-selected, and chips are not disabled for past/future days (free navigation, confirmed in the design); clicking a different day chip swaps the card list and updates the date line; the card matching the current time (only when today is selected) shows the "EN CURSO" tag and progress bar like the main view; clicking "Volver" returns to the main view.

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

- **Spec + mockup coverage:** vista principal with live clock, "CLASE EN CURSO" progress bar, and "resto del día" (Task 4/6); vista completa with date-labeled day chips and free day navigation (Task 5/6); campus field in the data model (Task 3); schedule logic including the new progress-bar and week-Monday helpers, all TDD'd with boundary cases (Task 2); mobile-first institutional styling for every new element (Task 6); manual visual verification updated to check the new elements (Task 7); mock data reemplazable (Task 3 + README). Excepciones, panel admin, backend, multi-aula, hosting público: still explicitly out of scope — not tasked here, by design.
- **Type consistency:** `bloque` fields (`dia`, `horaInicio`, `horaFin`, `materia`, `docente`, `carrera`, `nivel`, `paralelo`) are identical across `data/A4.json`, `schedule.js` tests, and `render.js`'s `formatearDetalle`/card markup. `datosAula` now consistently carries `aula`, `campus`, `capacidad`, `bloques` everywhere it's read (`data.js`, both render functions). Function names (`obtenerDiaActual`, `obtenerBloquesDia`, `obtenerClaseActual`, `obtenerClaseSiguiente`, `obtenerLunesDeLaSemana`, `obtenerSegmentosLlenos`, `obtenerDatosAula`, `renderVistaPrincipal`, `renderVistaCompleta`, `renderBarraProgreso`, `formatearDetalle`, `formatearHora12`) are used consistently across the files and tasks that reference them.
