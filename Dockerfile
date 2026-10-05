# Imagen de producción del front (ver README.md para contexto del proyecto).
# El build context debe ser la raíz del repo (necesita ver nginx.conf.template).
# El front pide los datos en tiempo real a /api/* (ver front/src/services/) —
# no necesita ver back/ en build time.

FROM node:20-alpine AS build
WORKDIR /app

COPY front/package.json front/package-lock.json ./front/
RUN cd front && npm ci

COPY front ./front
RUN cd front && npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/front/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Dónde vive el backend al que /api/ hace de proxy. docker-compose.yml ya
# levanta un servicio llamado "api" en el puerto 3001 (este valor por
# defecto), así que no necesita configurarse ahí. Para desplegar el front y
# el backend como servicios separados (ej. Render), sobreescribir con la URL
# pública real del backend, ej. API_BASE_URL=https://horarios-api-xxxx.onrender.com
# (sin resolución DNS interna: la red privada de Render no se usa acá).
ENV API_BASE_URL=http://api:3001
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
