# /consumos/sharepoint — Integración con SharePoint

Carpeta reservada para todo lo relacionado con leer el horario de cada aula
desde SharePoint (donde la universidad mantiene el PDF/Excel oficial por
aula) y convertirlo al esquema de `back/data/<ID>.json`.

## Estado actual: proceso manual

Hoy esta carpeta no tiene automatización corriendo (sin acceso a Azure AD,
ver más abajo). El flujo real es:

1. Alguien con acceso a SharePoint comparte el PDF del aula ("USO DE
   AULAS") fuera de este repo.
2. Se transforma ese PDF al esquema de `back/data/<ID>.json` con
   `parse_pdf.py` (ver abajo).
3. El JSON resultante se agrega/actualiza en `back/data/` y se publica.

## `parse_pdf.py`

```bash
pip install pdfplumber
python3 consumos/sharepoint/parse_pdf.py "AGR - AULA A1.pdf" A1 > back/data/A1.json
```

Lee la tabla del PDF (7 días x 2 sub-columnas por día) usando las líneas de
la grilla, no el texto plano (el texto plano sale desordenado cuando hay
columnas superpuestas). Imprime en `stderr` una `ADVERTENCIA:` por cada
caso ambiguo que tuvo que resolver con una regla arbitraria — en particular:

- **Sábado con varias sesiones en la misma hora nominal** (clases
  semipresenciales que el PDF apila en una sola celda sin indicar la
  subdivisión horaria real): se conserva solo la primera sesión encontrada
  y se descarta el resto, igual que se decidió a mano para A4.
- **Bloques que igual quedan solapados** después de lo anterior (aulas muy
  cargadas los sábados, como A1 y A5, donde el PDF reparte una misma fila
  en páginas con desalineos distintos): se conserva la primera sesión en
  el orden del documento y se descarta cualquier otra que se solape.
- **Domingo con contenido**: se descarta (la app no tiene día domingo en
  el selector) pero se avisa, por si en el futuro se decide agregarlo.

**Cualquier aula que dispare estas advertencias para sábado debe
verificarse a mano contra el PDF original** — el script garantiza que el
resultado no tenga clases solapadas, no que capture perfectamente cada
sesión cuando el PDF mismo es ambiguo.

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
