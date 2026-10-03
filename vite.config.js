import { defineConfig } from 'vite';

// El front vive en /front; back/ (datos) y consumos/ (integraciones
// externas) quedan fuera de ese root pero el front necesita poder
// importar back/data/*.json en build time (ver front/src/data.js).
export default defineConfig({
  root: 'front',
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
