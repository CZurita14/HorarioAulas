# Build context: raíz del repo (necesita ver back/server y consumos/sharepoint
# juntos). Ver docker-compose.yml.

FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip \
    && pip install --break-system-packages --no-cache-dir pdfplumber

WORKDIR /app
COPY back/server/package.json back/server/package-lock.json ./
RUN npm ci --omit=dev

COPY back/server ./
COPY consumos/sharepoint/parse_pdf.py ./parser/parse_pdf.py

ENV PARSER_PATH=/app/parser/parse_pdf.py
EXPOSE 3001
CMD ["node", "index.js"]
