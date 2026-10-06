// Pruebas (npm test). Aparte de vite.config.js para no cargar el plugin de la PWA. Corren en Node;
// las que usan los ajustes (document, localStorage) piden happy-dom en su primera línea.
// fake-indexeddb da una base de datos en memoria para probar Dexie sin navegador.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    setupFiles: ['fake-indexeddb/auto'],
  },
});
