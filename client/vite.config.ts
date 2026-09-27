import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Packed atlases keep their names across `art:pack`; stamp each one's content
// hash into the bundle so a repack busts the browser cache (see packedAssetUrl.ts).
const PACKED_ASSETS = [
  'sprites.json', 'sprites.png', 'shadows.json',
  'icons.json', 'icons.png', 'UI_icons.json', 'UI_icons.png',
];
function packedAssetHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of PACKED_ASSETS) {
    const file = fileURLToPath(new URL(`./public/assets/${name}`, import.meta.url));
    if (!existsSync(file)) continue;
    out[`/assets/${name}`] = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 10);
  }
  return out;
}

export default defineConfig({
  plugins: [react()],
  define: {
    __PACKED_ASSET_HASHES__: JSON.stringify(packedAssetHashes()),
  },
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
