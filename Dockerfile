# Imagen de producción de la app (ver README.md para contexto del proyecto).
# El build context debe ser la raíz del repo (no front/), porque el front
# lee back/data/*.json en build time vía import.meta.glob — necesita ver
# ambas carpetas juntas, igual que en Render.

FROM node:20-alpine AS build
WORKDIR /app

COPY front/package.json front/package-lock.json ./front/
RUN cd front && npm ci

COPY front ./front
COPY back ./back
RUN cd front && npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/front/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
