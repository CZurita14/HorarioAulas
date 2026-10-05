# Guía de despliegue en servidor propio

Para quien vaya a instalar esto en el servidor de la universidad. La app ya
está dockerizada y probada — este documento es el paso a paso para subirla.

## 1. Requisitos en el servidor

- Docker y Docker Compose instalados (`docker --version`, `docker compose version`).
- Acceso para clonar el repo de GitHub (`git clone` o llave SSH configurada).
- Un puerto libre para exponer la app (por defecto se usa el 8080, ver paso 4).

## 2. Traer el código

```bash
git clone https://github.com/CZurita14/HorarioAulas.git
cd HorarioAulas
```

Si ya estaba clonado antes, actualizar:

```bash
cd HorarioAulas
git pull origin main
```

## 3. Build de la imagen

```bash
docker compose build
```

Esto compila el frontend (React + Vite + TypeScript) leyendo los horarios de
las 37 aulas desde `back/data/*.json` y arma una imagen con nginx sirviendo
el resultado — no necesita Node.js instalado en el servidor, todo el build
pasa dentro del contenedor.

## 4. Levantar el contenedor

```bash
docker compose up -d
```

Por defecto queda escuchando en el puerto **8080** del servidor
(`docker-compose.yml`: `"8080:80"`). Si ese puerto ya está ocupado o el
equipo de TI pide otro, editar esa línea antes de levantar, por ejemplo:

```yaml
ports:
  - "3000:80"
```

## 5. Verificar que responde

Desde el propio servidor:

```bash
curl -I http://localhost:8080/
```

Debe devolver `HTTP/1.1 200 OK`. Desde un navegador, entrar a
`http://<IP-del-servidor>:8080/?aula=A4` y confirmar que carga el horario
real del Aula A4 (no un error ni una pantalla en blanco).

## 6. Dominio y HTTPS

Esto lo arma quien administre el dominio/DNS de la universidad. Lo que
necesitan saber:

- La app es un **sitio estático puro** servido por nginx dentro del
  contenedor — no requiere base de datos, backend aparte, ni variables de
  entorno.
- El contenedor escucha HTTP en el puerto 80 **dentro** de sí mismo (lo que
  se mapea a 8080 u otro puerto del host en el paso 4).
- Dos formas típicas de conectar el dominio:
  1. **Reverse proxy ya existente en el servidor** (nginx/Apache/Traefik a
     nivel de host): apuntar ese proxy a `http://127.0.0.1:8080` (o el
     puerto elegido) y manejar el certificado TLS ahí.
  2. **Sin proxy existente**: agregar uno (ej. Caddy, que gestiona HTTPS
     automático con Let's Encrypt) delante de este contenedor. Avisar si
     hace falta que prepare esa pieza también, una vez se sepa el dominio
     exacto.
- **Importante:** si el servidor solo es alcanzable desde la red interna
  del campus (no tiene IP pública ni DNS resuelto desde internet), los QR
  no van a funcionar para quien los escanee fuera de esa red — confirmar
  con TI que el dominio que van a dar resuelve y es alcanzable desde
  internet, no solo desde dentro del campus.

## 7. Actualizar en el futuro

Cuando haya cambios nuevos en `main` (más aulas, ajustes de diseño, etc.):

```bash
cd HorarioAulas
git pull origin main
docker compose up -d --build
```

Esto reconstruye la imagen con el código actualizado y reemplaza el
contenedor corriendo sin downtime perceptible.

## 8. Logs y diagnóstico

```bash
docker compose logs -f        # ver logs en vivo
docker compose ps             # estado del contenedor
docker compose down           # detener y quitar el contenedor
```

## 9. Agregar una aula nueva

No requiere redeploy especial del contenedor, solo:
1. Agregar `back/data/<ID>.json` con el horario (ver `back/README.md`).
2. Commit + push a `main`.
3. En el servidor: `git pull origin main && docker compose up -d --build`.
