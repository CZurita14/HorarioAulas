# /back/db — Base de datos (PostgreSQL)

Por qué existe esto, además de los archivos JSON de `back/data/`:

1. **Varios administradores reales.** Antes había un solo usuario/contraseña
   fijo por variable de entorno. Con la base de datos, cada persona tiene su
   propia cuenta (tabla `usuario_admin`), todas con el mismo permiso
   (publicar en cualquier aula/campus).
2. **El QR nunca puede apuntar al aula equivocada.** La universidad va a
   replicar este sistema en varios campus — hoy 3 en Ambato (Manuela Sáenz,
   Simón Bolívar, Parque Tecnológico Santa Rosa), y se están sumando uno en
   Quito y otro en Latacunga. Si dos campus tuvieran, por ejemplo, cada
   uno su propia aula "A1", guardar eso en archivos (`back/data/A1.json`)
   haría que el segundo campus cargado **sobrescriba silenciosamente** los
   datos del primero. La tabla `aula` tiene una restricción `UNIQUE` real
   sobre `codigo_qr` — la base de datos impide crear dos aulas con el mismo
   código, en vez de confiar en que nadie se equivoque al nombrar un archivo.
3. Consultas que hoy exigirían leer los 37 archivos uno por uno (ej. "¿qué
   clases da este docente en toda la universidad?") pasan a ser una sola
   consulta SQL.

No usa `pgvector` ni ninguna otra extensión — es PostgreSQL normal. Ver el
esquema completo y comentado en `schema.sql`.

## Esquema (resumen)

```
campus            — cada sede (nombre, ciudad, prefijo)
aula              — campus_id, nombre (único por campus), codigo_qr (único
                     en TODA la universidad — esto es lo que lleva el QR)
bloque_horario    — una fila por clase: aula_id, día, horas, materia,
                     docente, carrera, nivel, paralelo
usuario_admin     — cuentas de administrador (usuario, contraseña con hash)
publicacion_log   — quién publicó qué aula y cuándo (auditoría)
```

`campus.ciudad` agrupa sedes de una misma ciudad (hoy Ambato tiene 3) — no
es única por sí sola, solo sirve para que el panel de admin muestre los
campus agrupados por ciudad a medida que se suman más. `campus.prefijo` sí
es único y es lo que define el prefijo del `codigo_qr` cuando hace falta
(ver más abajo).

Las 37 aulas de Manuela Sáenz que ya existen conservan su `codigo_qr` tal
cual (`A1`, `B3`, ...) — no hace falta reimprimir ningún QR ya hecho. La
restricción de unicidad global entra a jugar recién cuando se carguen aulas
de otro campus (Simón Bolívar, Parque Tecnológico, o los nuevos de Quito o
Latacunga): si alguna choca de nombre con una ya existente, hay que darle
un código distinto en ese momento (ver más abajo).

> **Regla importante al sumar un campus/ciudad nueva:** nunca se tocan los
> QR/letreros ya impresos de los campus existentes — eso ya apunta al
> dominio final y no cambia. Solo se generan QR/letreros **nuevos**, para
> las aulas del campus que se está agregando.

## Puesta en marcha (una sola vez)

Necesita un PostgreSQL ya levantado y accesible por `DATABASE_URL`
(`docker compose up` ya lo deja listo si se usa el `docker-compose.yml`
del repo — el contenedor `postgres` aplica `schema.sql` solo, la primera
vez que arranca).

Migrar los horarios ya cargados en `back/data/*.json` y crear el primer
administrador:

```bash
DATABASE_URL=postgresql://usuario:clave@localhost:5432/horarios_aulas \
ADMIN_USER=admin \
ADMIN_PASSWORD='la-contraseña-de-ese-admin' \
node back/server/scripts/migrar_json_a_bd.js
```

Con Docker Compose (el contenedor `api` ya tiene esas variables definidas
por `.env`):

```bash
docker compose exec api node scripts/migrar_json_a_bd.js
```

Se puede correr más de una vez sin duplicar nada: si un aula ya existe
reemplaza sus bloques (no los acumula), y si el usuario ya existe no lo
toca.

## Sumar más administradores

```bash
docker compose exec api node scripts/crear_admin.js <usuario> <contraseña>
```

Si el usuario ya existe, esto actualiza su contraseña (y lo reactiva si
estaba desactivado) en vez de fallar. Para desactivar una cuenta sin
borrarla (por ejemplo, alguien que deja la universidad):

```bash
docker compose exec postgres psql -U horarios -d horarios_aulas \
  -c "UPDATE usuario_admin SET activo = false WHERE usuario = '<usuario>';"
```

## Agregar un campus nuevo (otra sede, u otra ciudad)

```bash
docker compose exec api node scripts/crear_campus.js "<nombre del campus>" "<ciudad>" <prefijo>

# Ejemplos:
docker compose exec api node scripts/crear_campus.js "Quito 1" "Quito" QT
docker compose exec api node scripts/crear_campus.js "Latacunga" "Latacunga" LTG
```

El panel de admin lo toma solo (pide la lista a `GET /api/campus`, agrupada
por ciudad) — no hace falta tocar ni redeployar el front. El `prefijo`
elegido acá es el que define el `codigo_qr` de las aulas de ese campus
cuando haga falta distinguirlas (ver la sección de abajo); para un campus
en una ciudad nueva (como Quito o Latacunga), donde no hay aulas previas
con las que pueda chocar, usar el prefijo desde el principio en todas sus
aulas es más simple que esperar a que choque algo — por ejemplo, todas las
aulas de Quito con `codigo_qr` tipo `QT-A1`, `QT-B2`, etc.

Una vez cargadas las aulas de ese campus (paso 1 de "Agregar un aula
nueva, o un campus nuevo" en `DEPLOY.md`), generar sus QR/letreros nuevos
— nunca tocar los de un campus ya existente (ver la nota más arriba).

## Agregar un campus con un aula que choca de nombre

Si al cargar un campus nuevo aparece una aula con el mismo nombre que una
ya existente en otro campus, la base de datos va a rechazar el `INSERT`
(`duplicate key value violates unique constraint "aula_codigo_qr_key"`) en
vez de pisar la otra silenciosamente. En ese caso, dale a esa aula nueva un
`codigo_qr` distinto — con el prefijo de su campus (columna `prefijo` de la
tabla `campus`): `SB-A1` en vez de `A1`. Ese código es el que va a llevar
su QR.

## Respaldo

Cada publicación desde el panel de administrador actualiza también el
archivo correspondiente en `back/data/` (la base de datos es la fuente
real; el archivo es copia de seguridad legible y versionable con git — ver
el paso 10 de `DEPLOY.md`). Para un respaldo completo de la base en sí,
usar las herramientas propias de PostgreSQL:

```bash
docker compose exec postgres pg_dump -U horarios horarios_aulas > respaldo.sql
```
