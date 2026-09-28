import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  css: {
    postcss: {},
  },
  worker: {
    /*
     * Bundlear los Web Workers como módulos ES.
     *
     * Esto es coherente con el { type: 'module' }
     * que usa ChunkWorkerClient al instanciar Workers.
     */
    format: 'es',
  },
});
