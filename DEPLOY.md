# Guía de despliegue en servidor propio

Para quien vaya a instalar esto en el servidor de la universidad. La app ya
está dockerizada y probada — este documento es el paso a paso para subirla.

> **¿Solo quieres ver la app funcionando en una URL ya?** Ver la sección
> [Demo rápida en Render](#demo-rápida-en-render-blueprint) al final — no
> reemplaza este despliegue, es para probar mientras se gestiona el servidor.

## 1. Requisitos en el servidor

- Docker y Docker Compose instalados (`docker --version`, `docker compose version`).
- Acceso para clonar el repo de GitHub (`git clone` o llave SSH configurada).
- Un puerto libre para exponer la app (por defecto se usa el 8080, ver paso 4).

## 2. Traer el código

**Importante:** este servidor debe correr la rama `produccion`, no `main`.
`main` es la versión sin backend/panel de admin que sigue sirviendo el QR
ya impreso desde Render — no tiene las variables de entorno ni el
backend que este documento configura, así que no funciona para esto.

```bash
git clone -b produccion https://github.com/CZurita14/HorarioAulas.git
cd HorarioAulas
```

Si ya estaba clonado antes, actualizar:

```bash
cd HorarioAulas
git checkout produccion
git pull origin produccion
```

## 3. Configurar las credenciales del admin

Antes de levantar nada, crear un archivo `.env` en la raíz del repo (no se
sube a git) con:

```bash
ADMIN_USER=admin
ADMIN_PASSWORD=<una contraseña fuerte, elegida por ustedes>
JWT_SECRET=<una cadena larga y aleatoria, ej. salida de 'openssl rand -hex 32'>
```

Esto protege el panel de administración (`/` → botón "Admin" al pie de la
página) donde se sube un horario nuevo para un aula. Sin estas variables el
backend se niega a arrancar.

## 4. Build de las imágenes

```bash
docker compose build
```

Esto compila dos servicios:
- **`front`**: el frontend (React + Vite + TypeScript) con nginx sirviéndolo.
- **`api`**: el backend (Node/Express) que sirve los datos, autentica al
  admin y procesa los PDF subidos (necesita Python/pdfplumber, ya incluido
  en su imagen — no hace falta instalar nada aparte en el servidor).

No necesita Node ni Python instalados en el servidor, todo el build pasa
dentro de los contenedores.

## 5. Levantar los contenedores

```bash
docker compose up -d
```

Por defecto el sitio queda escuchando en el puerto **8080** del servidor
(`docker-compose.yml`, servicio `front`: `"8080:80"`). Si ese puerto ya está
ocupado o el equipo de TI pide otro, editar esa línea antes de levantar.

## 6. Verificar que responde

Desde el propio servidor:

```bash
curl -I http://localhost:8080/
curl http://localhost:8080/api/aulas
```

El primero debe devolver `200 OK`; el segundo, la lista de las 38 aulas en
JSON. Desde un navegador, entrar a `http://<IP-del-servidor>:8080/?aula=A4`
y confirmar que carga el horario real.

Para probar el panel de admin: ir al botón "Admin" del pie de página,
loguearse con lo definido en el paso 3, elegir un aula, subir su PDF y
confirmar que la vista previa se ve bien antes de publicar.

## 7. Dominio y HTTPS

Esto lo arma quien administre el dominio/DNS de la universidad. Lo que
necesitan saber:

- El contenedor `front` escucha HTTP en el puerto 80 **dentro** de sí mismo
  (mapeado a 8080 u otro puerto del host en el paso 5) y hace de proxy
  hacia `api` internamente — no hace falta exponer el puerto del backend
  (3001) hacia afuera, solo el 8080/443 de `front`.
- Dos formas típicas de conectar el dominio:
  1. **Reverse proxy ya existente en el servidor** (nginx/Apache/Traefik a
     nivel de host): apuntar ese proxy a `http://127.0.0.1:8080` (o el
     puerto elegido) y manejar el certificado TLS ahí.
  2. **Sin proxy existente**: agregar uno (ej. Caddy, que gestiona HTTPS
     automático con Let's Encrypt) delante de este contenedor.
- **Importante:** si el servidor solo es alcanzable desde la red interna
  del campus (no tiene IP pública ni DNS resuelto desde internet), los QR
  no van a funcionar para quien los escanee fuera de esa red — confirmar
  con TI que el dominio que van a dar resuelve y es alcanzable desde
  internet, no solo desde dentro del campus.

## 8. Actualizar en el futuro

Cuando haya cambios nuevos en `produccion` (código, diseño, etc. — **no**
hace falta esto para los horarios que suba el admin desde el panel, eso
ya queda guardado sin redeploy):

```bash
cd HorarioAulas
git pull origin produccion
docker compose up -d --build
```

## 9. Logs y diagnóstico

```bash
docker compose logs -f           # ver logs en vivo (los dos servicios)
docker compose logs -f api       # solo el backend
docker compose ps                # estado de los contenedores
docker compose down              # detener y quitar los contenedores
```

## 10. Respaldar los horarios que publique el admin

`back/data/` está montado como volumen dentro del contenedor `api`
(`docker-compose.yml`), así que cualquier horario que el admin publique
desde el panel se escribe directamente en esa carpeta **en el servidor**,
no solo dentro del contenedor. Para no perder esos cambios si el servidor
se reinstala:

```bash
cd HorarioAulas
git status back/data/     # ver qué aulas cambiaron desde el último commit
git add back/data/
git commit -m "Actualizar horarios publicados desde el panel de admin"
git push origin produccion
```

Conviene hacerlo cada tanto (ej. semanal) o después de una actualización
importante.

## 11. Agregar una aula nueva desde cero

No requiere redeploy especial del contenedor:
1. Desde el panel de admin, publicar su PDF por primera vez (el backend
   crea `back/data/<ID>.json` si no existía), **o** agregarlo a mano.
2. Generar su QR (ver `qr/README.md`) y su letrero (ver
   `letreros_individuales/`).
3. Respaldar con git (paso 10).

## Demo rápida en Render (Blueprint)

Para ver la app funcionando en una URL pública sin esperar al servidor del
campus. No usa el dominio final ni reemplaza el paso a paso de arriba — es
solo para mirarla funcionando.

1. En el [dashboard de Render](https://dashboard.render.com), **New +** →
   **Blueprint**.
2. Conectar el repo `CZurita14/HorarioAulas` y elegir la rama `produccion`.
   Render detecta automáticamente `render.yaml` (en la raíz del repo) y
   propone crear dos servicios: `horarios-api` y `horarios-front`.
3. Antes de confirmar, Render pide un valor para `ADMIN_PASSWORD` (la
   contraseña del panel de admin para esta demo) — escribir una. Dejar
   `API_BASE_URL` vacío por ahora (se completa en el paso 5). El
   `JWT_SECRET` se genera solo.
4. **Deploy Blueprint**. Render construye las dos imágenes Docker (tarda
   unos minutos). `horarios-api` debería quedar **Live**; `horarios-front`
   va a fallar al arrancar — es esperado, falta el paso siguiente.
5. Entrar al servicio **`horarios-api`** y copiar su URL pública (arriba
   del todo, algo como `https://horarios-api-xxxx.onrender.com`). Entrar a
   **`horarios-front`** → pestaña **Environment** → pegar esa URL completa
   (con `https://`, sin `/` al final) en la variable `API_BASE_URL` →
   **Save Changes**. Esto dispara un redeploy automático de `horarios-front`.
6. Cuando `horarios-front` diga **Live**, abrir su URL (arriba de su
   página, algo como `https://horarios-front.onrender.com`) — ahí está la
   app funcionando.

**Limitaciones de esta demo** (por ser plan gratuito de Render, no por la
app en sí):
- Los servicios gratuitos de Render "duermen" tras ~15 min sin tráfico; la
  primera visita después de eso tarda más en responder (arranca de nuevo).
- `horarios-api` no tiene disco persistente en el plan gratuito: un horario
  publicado desde el panel de admin se pierde si el servicio se reinicia o
  se redespliega (vuelve a los datos del último commit en `back/data/`).
  Para que lo publicado quede permanente hace falta un disco (plan pago de
  Render) o el servidor propio del paso a paso de arriba.
