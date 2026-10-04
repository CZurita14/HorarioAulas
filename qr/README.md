# Códigos QR por aula

Un QR listo para imprimir por cada aula, con el mismo estilo visual de la
app (fondo azul institucional, "AULA <ID>", Campus Manuela Sáenz). Cada
uno apunta a `https://horarioaulas.onrender.com/?aula=<ID>` — ver
`back/README.md` para cómo se arma esa URL por aula.

- `QR_<ID>.png`: tarjeta individual de cada aula, lista para imprimir y
  pegar en la puerta. Una por cada archivo en `back/data/` — las 37 aulas
  del campus Manuela Sáenz (A1-A5, B1,B3-B9, C1-C9, D1-D13, Taller_3,
  Taller_4).
- `tabla_qr_aulas.png`: todas las tarjetas juntas en una sola hoja, para
  revisar todas de un vistazo.

Al agregar una aula nueva en `back/data/<ID>.json`, generar su QR con el
mismo estilo:

```bash
pip install qrcode pillow
python3 - <<'PY'
import qrcode
from PIL import Image, ImageDraw, ImageFont

AULA = 'A6'  # cambiar por el ID nuevo
URL = f'https://horarioaulas.onrender.com/?aula={AULA}'
AZUL, NARANJA = (43, 58, 103), (232, 98, 44)
FONT_DIR = '/usr/share/fonts/truetype/liberation/'
f_bold = lambda s: ImageFont.truetype(FONT_DIR + 'LiberationSans-Bold.ttf', s)
f_reg = lambda s: ImageFont.truetype(FONT_DIR + 'LiberationSans-Regular.ttf', s)

W, H, header_h = 1000, 1400, 300
card = Image.new('RGB', (W, H), 'white')
draw = ImageDraw.Draw(card)
draw.rectangle([0, 0, W, header_h], fill=AZUL)

def center(y, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    draw.text(((W - (bbox[2]-bbox[0])) / 2, y), text, font=font, fill=fill)

center(50, 'UNIVERSIDAD INDOAMÉRICA', f_reg(28), (200, 207, 224))
center(100, f'AULA {AULA}', f_bold(80), 'white')
center(210, 'Campus Manuela Sáenz', f_reg(30), (200, 207, 224))

qr = qrcode.make(URL, box_size=14, border=3).convert('RGB').resize((700, 700))
qx, qy = (W - 700) // 2, header_h + 60
card.paste(qr, (qx, qy))
draw.rectangle([qx-3, qy-3, qx+703, qy+703], outline=NARANJA, width=6)
center(qy + 750, 'Escanea para ver el horario de esta aula', f_bold(32), (30, 36, 48))
center(qy + 800, URL.replace('https://', ''), f_reg(22), (120, 126, 140))

card.save(f'qr/QR_{AULA}.png')
PY
```
