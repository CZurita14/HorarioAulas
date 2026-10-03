# Horarios Aula A4 (piloto)

Reemplaza el flujo QR → SharePoint → PDF por una página web que muestra automáticamente
la clase en curso y la siguiente en el Aula A4, más un horario completo navegable por día.

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

El horario vive en `data/A4.json`. Los datos actuales son de prueba (marcados con
"DATO DE PRUEBA" / "Por definir") — reemplázalos por el horario real del aula cuando
esté disponible, siguiendo el mismo esquema (ver
`docs/superpowers/specs/2026-10-03-horarios-aula-design.md`).

## Estado

Piloto v1 — una sola aula, sin panel administrativo, sin manejo de cambios/suspensiones.
Ver el spec de diseño para el alcance completo y lo diferido a fases futuras.
