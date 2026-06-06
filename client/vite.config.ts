import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Always bundle the shared package from TS source. The compiled CommonJS
      // `dist` build (used by the Node server) does not expose statically
      // analyzable named exports for rollup's production build.
      '@mmo-idle/shared': fileURLToPath(
        new URL('../shared/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
    hmr: {
      host: 'localhost',
      port: 3000,
    },
  },
  build: {
    outDir: 'dist',
  },
});
