# Letreros oficiales por aula

Un letrero en PDF por aula, con el logo y colores oficiales de la
Universidad Indoamérica — son los que se deben imprimir y pegar en cada
puerta (a diferencia de `qr/`, que son tarjetas genéricas de referencia
rápida). Cada uno apunta a `http://horarios.indoamerica.edu.ec/?aula=<ID>`,
el dominio definitivo de la universidad.

El diseño (logo, colores, layout) no tiene un script de origen en este
repo — se recibió ya armado (plantilla oficial) y se actualiza solo el QR.
Para actualizar la URL sin rehacer el diseño, se reemplaza únicamente la
imagen del QR dentro de cada PDF, en el mismo lugar exacto:

```bash
pip install pymupdf qrcode pillow
python3 - <<'PY'
import pymupdf, qrcode, io, glob, os

# Posición del QR dentro de la página — es la misma en los 38 letreros.
QR_RECT = pymupdf.Rect(117.75, 241.25, 477.75, 601.25)
BASE_URL = "http://horarios.indoamerica.edu.ec"  # cambiar por la URL final

aulas = sorted(os.path.splitext(os.path.basename(f))[0] for f in glob.glob("back/data/*.json"))

for aula in aulas:
    path = f"letreros_individuales/Letrero_{aula}.pdf"
    url = f"{BASE_URL}/?aula={aula}"
    doc = pymupdf.open(path)
    page = doc[0]

    qr_img = qrcode.make(url, box_size=14, border=1).convert("RGB")
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)

    page.add_redact_annot(QR_RECT, fill=(1, 1, 1))  # tapa el QR viejo
    page.apply_redactions()
    page.insert_image(QR_RECT, stream=buf.read())    # pone el QR nuevo

    tmp_path = path + ".tmp"
    doc.save(tmp_path)
    doc.close()
    os.replace(tmp_path, path)

print(f"{len(aulas)} letreros actualizados")
PY
```

Para verificar que cada QR decodifica a la URL correcta después de
actualizar (no basta con mirarlo, hay que leerlo):

```bash
pip install pyzbar
python3 - <<'PY'
import pymupdf, glob, os, io
from pyzbar.pyzbar import decode
from PIL import Image

for path in sorted(glob.glob("letreros_individuales/Letrero_*.pdf")):
    aula = os.path.basename(path)[len("Letrero_"):-len(".pdf")]
    doc = pymupdf.open(path)
    pix = doc[0].get_pixmap(dpi=150)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    resultado = decode(img)
    print(aula, "->", resultado[0].data.decode() if resultado else "SIN QR LEGIBLE")
PY
```
