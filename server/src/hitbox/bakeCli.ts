/**
 * Default: refresh the development database cache and client shadows.
 * --artifact-only: bake the source runtime artifact without a database or client writes.
 * The build CLI separately bakes the production artifact into dist/hitbox.
 */
import { db, runMigrations } from '../db/index';
import { initHitboxCache, writeHitboxArtifact } from './cache';
import { getAtlasPaths } from './paths';

async function main(): Promise<void> {
  if (process.argv.includes('--artifact-only')) {
    console.log(`Wrote ${await writeHitboxArtifact(undefined, false)}`);
    return;
  }
  await runMigrations();
  const { atlasPng, atlasJson } = getAtlasPaths();
  await initHitboxCache(db, atlasPng, atlasJson);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
