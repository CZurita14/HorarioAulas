# Horarios por Aula

Reemplaza el flujo QR → SharePoint → PDF por una página web que muestra automáticamente
la clase en curso y la siguiente en cada aula, más un horario completo navegable por día.

## Desarrollo

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Datos

Cada aula tiene su propio archivo `data/<ID>.json` (mismo esquema), por ejemplo
`data/A4.json`. Agregar una aula nueva es agregar su JSON a `data/` — no hace falta
tocar código. Ver el esquema en
`docs/superpowers/specs/2026-10-03-horarios-aula-design.md`.

## Aulas y QR

La app es un solo sitio; cada aula se identifica con el parámetro `aula` en la URL:

- `https://horarioaulas.onrender.com/?aula=A4`
- `https://horarioaulas.onrender.com/?aula=B2`

Cada QR impreso debe apuntar a la URL de su propia aula. Una URL sin el parámetro
`aula` (QR antiguo que apunta a la raíz) sigue funcionando y muestra el Aula A4 por
defecto. Si el valor de `aula` no corresponde a ningún archivo en `data/`, se muestra
un mensaje de "Aula no encontrada" en vez de una pantalla rota.

## Estado

Multi-aula — sin panel administrativo, sin manejo de cambios/suspensiones.
Ver el spec de diseño para el alcance completo y lo diferido a fases futuras.
