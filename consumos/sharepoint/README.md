# /consumos/sharepoint — Integración con SharePoint

Carpeta reservada para todo lo relacionado con leer el horario de cada aula
desde SharePoint (donde la universidad mantiene el PDF/Excel oficial por
aula) y convertirlo al esquema de `back/data/<ID>.json`.

## Estado actual: proceso manual

Hoy esta carpeta no tiene automatización corriendo. El flujo real es:

1. Alguien con acceso a SharePoint comparte el PDF/Excel del aula (o un
   link de SharePoint) fuera de este repo.
2. Se transforma manualmente ese archivo al esquema de `back/data/<ID>.json`
   (como se hizo para `A4.json`, parseando el PDF con `pdfplumber` contra
   las líneas de la grilla de la tabla).
3. El JSON resultante se agrega/actualiza en `back/data/` y se publica.

## Por qué no es automático todavía

Para que un backend lea SharePoint por su cuenta (sin que una persona lo
descargue a mano cada vez que cambia el horario) se necesita un **App
Registration en Azure AD** del tenant de la universidad, con permisos de
aplicación (`Sites.Read.All` o `Files.Read.All` de Microsoft Graph) y
admin consent de un administrador del tenant — no alcanza con la sesión de
OneDrive de una persona. Al día de hoy no se cuenta con ese acceso.

## Cuando se consiga ese acceso

Esta carpeta pasaría a tener:
- `client.js`: autenticación contra Microsoft Graph (client credentials
  flow) y descarga del archivo de cada aula.
- `parser.js`: la misma lógica de parseo que hoy se corre manualmente,
  convertida en función reutilizable.
- Un disparador (cron / endpoint en `/back`) que corra ese flujo
  periódicamente y actualice `back/data/<ID>.json`.

El esquema de salida (`back/data/<ID>.json`) no cambiaría — esto solo
reemplazaría el paso manual por uno automático.
