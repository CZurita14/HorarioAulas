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

## 3. Configurar las credenciales

Antes de levantar nada, crear un archivo `.env` en la raíz del repo (no se
sube a git) con:

```bash
ADMIN_USER=admin
ADMIN_PASSWORD=<una contraseña fuerte, elegida por ustedes>
JWT_SECRET=<una cadena larga y aleatoria, ej. salida de 'openssl rand -hex 32'>
POSTGRES_USER=horarios
POSTGRES_PASSWORD=<otra contraseña fuerte, distinta a la del admin>
POSTGRES_DB=horarios_aulas
```

Las dos primeras protegen el panel de administración (`/admin`, sin ningún
enlace visible en la página pública) donde se sube un horario nuevo para
un aula — `ADMIN_USER`/`ADMIN_PASSWORD` solo se usan para crear la primera
cuenta de administrador en el paso 5.1; después de eso, los administradores
reales viven en la base de datos (ver `back/db/README.md` para sumar más
cuentas). Las tres últimas son las credenciales del contenedor de
PostgreSQL que guarda los horarios. Sin estas variables el backend se
niega a arrancar.

## 4. Build de las imágenes

```bash
docker compose build
```

Esto compila dos imágenes (la tercera, `postgres`, se descarga ya lista,
no hay nada que compilar ahí):
- **`front`**: el frontend (React + Vite + TypeScript) con nginx sirviéndolo.
- **`api`**: el backend (Node/Express) que sirve los datos, autentica a los
  administradores y procesa los PDF subidos (necesita Python/pdfplumber, ya
  incluido en su imagen — no hace falta instalar nada aparte en el servidor).

No necesita Node ni Python instalados en el servidor, todo el build pasa
dentro de los contenedores.

## 5. Levantar los contenedores

```bash
docker compose up -d
```

Por defecto el sitio queda escuchando en el puerto **8080** del servidor
(`docker-compose.yml`, servicio `front`: `"8080:80"`). Si ese puerto ya está
ocupado o el equipo de TI pide otro, editar esa línea antes de levantar.

## 5.1. Cargar los horarios en la base de datos (solo la primera vez)

El contenedor `postgres` arranca con las tablas ya creadas, pero vacías.
Este paso trae los 37 horarios que ya están en `back/data/` y crea el
primer usuario administrador (con lo que se puso en `ADMIN_USER`/
`ADMIN_PASSWORD` en el paso 3):

```bash
docker compose exec api node scripts/migrar_json_a_bd.js
```

Se puede correr de nuevo sin problema si algo falla a medias — no duplica
datos. Para sumar más administradores después (cada persona con su propia
cuenta), ver `back/db/README.md`.

## 6. Verificar que responde

Desde el propio servidor:

```bash
curl -I http://localhost:8080/
curl http://localhost:8080/api/aulas
```

El primero debe devolver `200 OK`; el segundo, la lista de las 37 aulas en
JSON. Desde un navegador, entrar a `http://<IP-del-servidor>:8080/?aula=A4`
y confirmar que carga el horario real.

Para probar el panel de admin: entrar a `/admin`, loguearse con lo
definido en el paso 3, elegir campus y aula, subir su PDF y confirmar que
la vista previa se ve bien antes de publicar.

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

La base de datos (PostgreSQL) es la fuente real de los horarios. Dos
respaldos, por las dudas:

**Copia en git** (automática): cada publicación desde el panel también
actualiza `back/data/<ID>.json` — montado como volumen en el contenedor
`api`, así que ese archivo se escribe directamente en el servidor. Para
subir esa copia a git de vez en cuando:

```bash
cd HorarioAulas
git status back/data/     # ver qué aulas cambiaron desde el último commit
git add back/data/
git commit -m "Actualizar horarios publicados desde el panel de admin"
git push origin produccion
```

**Respaldo completo de la base de datos** (recomendado, ej. semanal):

```bash
docker compose exec postgres pg_dump -U horarios horarios_aulas > respaldo-$(date +%Y%m%d).sql
```

## 11. Agregar un aula nueva, o un campus nuevo

1. Si es un campus que todavía no existe (otra sede de Ambato, o una
   ciudad nueva como Quito o Latacunga), crearlo primero con
   `scripts/crear_campus.js` (ver "Agregar un campus nuevo" en
   `back/db/README.md`) — el panel de admin lo toma solo, sin redeploy.
2. Desde el panel de admin, publicar su PDF por primera vez — el backend
   crea el aula sola, en la base de datos, la primera vez que se publica
   para ese código.
3. Si el nombre del aula choca con una ya existente de otro campus, la
   base de datos va a rechazar la publicación — hay que darle un código
   distinto, normalmente con el prefijo de su campus (ver "Agregar un
   campus con un aula que choca de nombre" en `back/db/README.md`). Para
   las aulas de Manuela Sáenz esto no pasa, ya están todas cargadas y son
   únicas entre sí; para un campus en una ciudad nueva, usar el prefijo
   desde el principio evita este problema.
4. Generar su QR (ver `qr/README.md`) y su letrero (ver
   `letreros_individuales/`) — **solo para esta aula nueva**, nunca
   regenerar los de aulas/campus ya existentes.
5. Respaldar (paso 10).

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

## Demo de pruebas en Render, con base de datos (rama `base-datos-postgres`)

Para probar el feature de base de datos (multi-campus, Quito, Latacunga)
en una URL pública, sin tocar la demo de arriba ni el servidor real de la
universidad. Es un proyecto Render totalmente aparte — se puede borrar
cuando se termine de probar.

1. En el [dashboard de Render](https://dashboard.render.com), **New +** →
   **Blueprint**.
2. Conectar el repo `CZurita14/HorarioAulas` y elegir la rama
   `base-datos-postgres`. Render detecta `render.yaml` y propone 3
   recursos: la base `horarios-pruebas-db` (Postgres) y los servicios
   `horarios-api-pruebas` / `horarios-front-pruebas`.
3. Antes de confirmar, Render pide `ADMIN_PASSWORD` — escribir una. Dejar
   `API_BASE_URL` vacío por ahora (se completa en el paso 6).
4. **Deploy Blueprint**. A diferencia de Docker Compose (que aplica
   `schema.sql` solo al arrancar), la Postgres de Render queda **vacía** —
   `horarios-api-pruebas` va a quedar Live pero sin datos hasta el paso 5.
5. Entrar a **`horarios-pruebas-db`** → **Connect** → copiar el
   **External Database URL** (`postgresql://...`). Desde una máquina con
   `psql`/Node (puede ser esta misma sesión), aplicar el esquema y migrar
   los datos de prueba:
   ```bash
   psql "<External Database URL>" -f back/db/schema.sql
   DATABASE_URL="<External Database URL>" ADMIN_USER=admin ADMIN_PASSWORD="<la del paso 3>" \
     node back/server/scripts/migrar_json_a_bd.js
   # Para probar Quito/Latacunga:
   DATABASE_URL="<External Database URL>" node back/server/scripts/crear_campus.js "Quito 1" "Quito" QT
   DATABASE_URL="<External Database URL>" node back/server/scripts/crear_campus.js "Latacunga" "Latacunga" LTG
   ```
6. Entrar a **`horarios-api-pruebas`**, copiar su URL pública. Entrar a
   **`horarios-front-pruebas`** → **Environment** → pegar esa URL en
   `API_BASE_URL` → **Save Changes** (dispara un redeploy).
7. Cuando `horarios-front-pruebas` diga **Live**, abrir su URL — ahí se
   puede entrar a `/admin`, ver el selector de campus agrupado por ciudad,
   y publicar un horario de prueba para Quito o Latacunga.

**No genera ni modifica ningún QR real** — esto es solo para validar que
el panel de admin y la base de datos funcionan antes de usarlos de verdad.
Mismas limitaciones de plan gratuito que la demo de arriba (duerme tras
~15 min, sin disco persistente — acá no importa, los datos viven en
`horarios-pruebas-db`, no en archivos).
