# /back — Datos del horario

Esta es la capa de datos de la aplicación. Hoy no hay un servidor corriendo
en producción: `back/data/` contiene un archivo JSON por aula, con el
esquema documentado en `docs/superpowers/specs/2026-10-03-horarios-aula-design.md`,
y el front (`/front`) los lee directamente en build time (ver
`front/src/data.js`).

## Agregar una aula nueva

1. Crear `back/data/<ID>.json` siguiendo el mismo esquema que `A4.json`
   (mismo `aula`, `campus`, `capacidad`, lista de `bloques`).
2. No hace falta tocar código: el front detecta automáticamente cualquier
   archivo nuevo en esta carpeta.
3. El QR de esa aula debe apuntar a `?aula=<ID>` (ver README raíz).

## De dónde salen estos datos

Por ahora, de forma manual: alguien transforma el PDF/Excel de SharePoint de
esa aula a este esquema (ver `/consumos/sharepoint/README.md` para el
detalle del proceso y por qué todavía no está automatizado).

## Evolución futura

Si en algún momento se consigue acceso de administrador de Azure AD para
automatizar la lectura de SharePoint (ver `/consumos`), este directorio
pasaría a ser servido por un backend real (ej. Node/Express) en vez de
JSON estático importado en build time — el esquema de los bloques no
cambiaría, solo cómo llegan aquí.
