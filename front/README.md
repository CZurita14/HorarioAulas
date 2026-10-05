# /front — App web (Horarios por Aula)

React + Vite + TypeScript + Tailwind, con el diseño institucional de la
Universidad Tecnológica Indoamérica (UTI). No importa los datos en build
time — los pide en tiempo real al backend (`/back/server`, ver
`src/services/aulaService.ts`).

## Componentes

- **`App.tsx`**: raíz de la app. Decide entre la vista pública de una aula
  y el panel de admin (`vistaRaiz`), carga los datos del aula activa de
  forma asíncrona.
- **`Navbar.tsx`**: encabezado institucional (logo, nombre, switch de tema).
- **`AulaHeader.tsx`**: identidad del aula activa + selector para cambiar de aula.
- **`AulaVistaPrincipal.tsx`**: clase en curso / siguiente / resto del día.
- **`AulaVistaCompleta.tsx`**: horario completo navegable por día.
- **`AulaNoEncontrada.tsx`**: pantalla cuando `?aula=` no existe, con la
  lista de las aulas disponibles.
- **`AdminLogin.tsx`** / **`AdminPanel.tsx`**: login y flujo de
  subir PDF → previsualizar → publicar, detrás del botón "Admin" del pie
  de página. Nunca aparece para un visitante normal.

Los componentes `CaseDetail.tsx`, `CaseHistoryTable.tsx`,
`HealthStatusCard.tsx`, `RulesConfigModal.tsx`, `ScheduleGrid.tsx` y
`UploadZone.tsx` vinieron de la plantilla institucional genérica de la
que se partió, pero **no los usa esta app** (pertenecen a un sistema de
cruce de horarios distinto). Se pueden borrar sin afectar nada, o
quedarse como referencia de estilo para pantallas futuras.

## Servicios (`src/services/`)

- **`aulaService.ts`**: fetch de los datos públicos (`GET /api/aulas`,
  `GET /api/aulas/:id`).
- **`aulaAdminService.ts`**: login/logout/sesión y el flujo de
  previsualizar + publicar un PDF (`/api/admin/*`).
- **`scheduleUtils.ts`**: lógica pura de horario (clase actual/siguiente,
  fusión de bloques consecutivos) — sin dependencias de React.

## Paleta de colores institucional UTI

### Modo claro (default)
- Brand (morado principal): `#2c1547`
- Highlight (naranja acento): `#f57021`
- Fondo general: `#f4f0f9`
- Superficie / cards: `#ffffff`
- Texto principal: `#2c1547`
- Texto mudo: `#6e5987`
- Bordes: `#e2d9ee`

### Modo oscuro (`.dark`)
- Fondo: `#150b24`
- Superficie: `#26163d`
- Brand: `#8a4ed9`
- Highlight: `#f57021`
- Texto: `#f5f0fb`

## Desarrollo

```bash
npm install
npm run dev
```

Necesita el backend corriendo en paralelo (`back/server`, puerto 3001 por
defecto) — ver `back/README.md`. El proxy de `/api` está configurado en
`vite.config.ts`.
