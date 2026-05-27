import { db, runMigrations } from '../db/index';
import { initHitboxCache } from './cache';
import { getAtlasPaths } from './paths';

async function main(): Promise<void> {
  runMigrations();
  const { atlasPng, atlasJson } = getAtlasPaths();
  await initHitboxCache(db, atlasPng, atlasJson);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
