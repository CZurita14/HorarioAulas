# Sistema de consulta de horarios por aula — Diseño v1 (piloto Aula A4)

Fecha: 2026-10-03
Estado: aprobado para plan de implementación

## 1. Contexto y problema

La Universidad Indoamérica tiene códigos QR impresos en cada aula (ej. "HORARIO AULA – A4"). Al escanear, el QR abre un documento PDF en SharePoint (carpeta personal de OneDrive de personal académico, sin fuente estructurada detrás) con una tabla institucional de 4 páginas, organizada por día/hora, que el usuario debe interpretar manualmente para encontrar su clase.

Investigación del SharePoint real (carpeta compartida `Escritorio/VD2026/Horarios A26/A4/`) confirmó:
- Un solo archivo por aula: `AGR - AULA A4.pdf`, mantenido manualmente.
- No hay Excel/Lista de SharePoint accesible como fuente estructurada ni API disponible.
- No hay acceso a la carpeta padre (`VD2026`), por lo que no se puede confirmar estructura para otras aulas.

Conclusión: la fuente de datos real es manual. El sistema a construir no debe asumir integración en vivo con SharePoint; debe aceptar datos provistos manualmente por la institución (vía el usuario, Christian) y transformarlos a un formato estructurado propio.

## 2. Objetivo de v1 (piloto)

Reemplazar, para el **aula A4 únicamente**, el flujo QR → SharePoint → PDF denso por: QR → página web propia que muestra automáticamente la clase en curso y la siguiente, con opción de ver el horario completo de la semana en un formato de tarjetas, no de tabla.

Fuera de alcance para v1 (diferido a fase 2, explícitamente acordado con el usuario):
- Excepciones/eventos: cambio de aula, suspensión de clase, evento institucional.
- Panel administrativo de edición.
- Autenticación, roles y permisos.
- Más de un aula.
- Integración en vivo con SharePoint/Excel/API.
- Hosting/dominio público definitivo (dueño/operador del sistema aún no decidido por el usuario).

## 3. Experiencia de usuario

### Vista principal (al escanear el QR / entrar a `/aula/a4`)

- Encabezado: `AULA A4` + fecha de hoy.
- Si hay una clase en curso en el momento exacto de la consulta: tarjeta "🟢 CLASE ACTUAL" con materia, docente, carrera, nivel, paralelo, horario.
- Tarjeta "🔵 SIGUIENTE CLASE" debajo (si existe una después, el mismo día).
- Si no hay clase en curso: mensaje "Sin clases en este momento" + próxima clase del día si la hay.
- El aula puede recibir materias de carreras distintas a lo largo del día/semana; el sistema no filtra por carrera, solo muestra lo que corresponde a esa aula en ese momento exacto.
- Botón/tab visible hacia "Ver horario completo".

### Vista horario completo

- Selector de días en chips (Lunes–Sábado), con el día actual preseleccionado.
- Lista de tarjetas (no tabla) del día seleccionado, ordenadas por hora: materia, docente, carrera/nivel, paralelo, horario.
- La tarjeta correspondiente a la clase en curso (si el día seleccionado es hoy) se distingue visualmente (ej. borde/indicador verde), reutilizando la misma lógica de estado de la vista principal.

### Diseño visual

- Mobile-first (se consulta desde el celular tras escanear), poco scroll, tipografía grande y legible.
- Colores institucionales Universidad Indoamérica (azul/naranja observados en el cartel QR).
- Sin tablas densas, sin PDF embebido, sin menús innecesarios.

## 4. Modelo de datos

Un archivo JSON por aula (para v1, solo `A4.json`), con esta forma:

```json
{
  "aula": "A4",
  "capacidad": 30,
  "bloques": [
    {
      "dia": "lunes",
      "horaInicio": "08:00",
      "horaFin": "10:00",
      "materia": "Ingeniería de Software",
      "docente": "Nombre Apellido",
      "carrera": "TI",
      "nivel": "6",
      "paralelo": "A"
    }
  ]
}
```

Reglas:
- `dia`: minúsculas, sin tildes (`lunes`...`sabado`).
- `horaInicio`/`horaFin`: formato 24h `HH:MM`, para comparación directa con la hora actual.
- Un aula puede tener N bloques sin restricción de carrera/nivel — se ordenan solo por día/hora.
- El esquema está diseñado para escalar a múltiples aulas (un archivo por aula, mismo formato) sin cambios al frontend.
- No incluye campos de excepciones en v1 (se añadirán en fase 2 sin romper este esquema base, ej. como una lista `excepciones` separada referenciando fecha + bloque).

## 5. Arquitectura y stack

- **Frontend**: app web estática ligera (HTML/CSS/JS, framework liviano tipo Astro o vanilla JS — se decide en fase de implementación), responsive, una sola plantilla de "página de aula" parametrizada por identificador de aula.
- **Cálculo de estado (clase actual/siguiente)**: 100% en el cliente, usando la hora del dispositivo del usuario. Sin cron, sin servidor.
- **Datos**: archivo(s) JSON estático(s) dentro del propio repo/build, leídos por el frontend.
- **Backend**: ninguno en v1. Sin base de datos, sin autenticación, sin API.
- **QR**: apunta a una URL estable (`/aula/a4` o equivalente) — no se reemplaza al cambiar el horario, solo se actualizan los datos y se vuelve a publicar.
- **Hosting**: estático, desplegable en cualquier proveedor gratuito (Vercel/Netlify/GitHub Pages) o donde el usuario decida una vez definido el dueño/operador institucional. Para v1, validación en navegador local antes de cualquier publicación pública.

## 6. Carga de datos para A4

- El usuario (Christian) provee el horario real del aula A4 (Excel/PDF/texto) fuera de este flujo de código.
- Se transforma manualmente a `A4.json` siguiendo el esquema de la sección 4.
- Mientras no se reciban los datos reales, se usan datos de ejemplo (mock) con la misma estructura para construir y validar la UI, reemplazándolos antes de considerar la v1 completa.

## 7. Testing

- Pruebas unitarias de la lógica de "clase actual/siguiente" cubriendo: antes de la primera clase del día, entre dos clases, después de la última clase del día, exactamente en el minuto de transición entre clases.
- Verificación visual manual en navegador con viewport móvil emulado, de ambas vistas (principal y horario completo), antes de dar la v1 por completa.

## 8. Camino de escalabilidad (no implementado en v1, solo para no bloquear el diseño)

- Múltiples aulas: agregar más archivos `<AULA>.json` con el mismo esquema; el router/plantilla ya está parametrizado por aula.
- Excepciones: añadir una colección separada de excepciones (fecha + referencia a bloque + tipo de cambio) consultada junto al horario base, sin modificar los bloques existentes.
- Panel admin + backend: se añaden como capa encima de este mismo modelo de datos cuando se decida el dueño/operador institucional.
