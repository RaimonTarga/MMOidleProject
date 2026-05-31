import { createHash } from 'crypto';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { HitboxDef } from '@mmo-idle/shared';
import type * as schema from '../db/schema';
import { loadHitboxCache, replaceAllHitboxes } from '../db/hitboxRepo';
import {
  bakeSpriteHitboxes,
  bakeVoidOverlordHitboxes,
  sha256File,
  writeShadowDefsFile,
} from './bake/index';
import { getAtlasPaths, getVoidOverlordPaths } from './paths';

type DB = BetterSQLite3Database<typeof schema>;

let cache: Map<string, HitboxDef> = new Map();

export async function initHitboxCache(
  db: DB,
  atlasPngPath: string,
  atlasJsonPath: string,
): Promise<Map<string, HitboxDef>> {
  const mainHash = sha256File(atlasPngPath);
  const voidPaths = getVoidOverlordPaths();
  const voidHash = sha256File(voidPaths.png);
  const compositeHash = createHash('sha256')
    .update(mainHash)
    .update(voidHash)
    .digest('hex');

  console.log('[hitbox] rebaking from atlas + void overlord sheet…');
  const t0 = Date.now();

  const main = await bakeSpriteHitboxes(atlasPngPath, atlasJsonPath);
  const voidBaked = await bakeVoidOverlordHitboxes(voidPaths.png);
  const rows = [...main.rows, ...voidBaked.rows];
  const shadowDefs = { ...main.shadowDefs, ...voidBaked.shadowDefs };

  replaceAllHitboxes(db, rows, compositeHash);
  writeShadowDefsFile(atlasJsonPath, compositeHash, shadowDefs);

  console.log(
    `[hitbox] baked ${main.rows.length} main + ${voidBaked.rows.length} void frames in ${Date.now() - t0}ms`,
  );
  console.log(`[hitbox] wrote ${Object.keys(shadowDefs).length} frame shadow defs`);

  cache = loadHitboxCache(db);
  console.log(`[hitbox] loaded ${cache.size} frame hitboxes`);
  return cache;
}

/**
 * Load already-baked hitbox rows from the DB into the in-memory cache WITHOUT
 * rebaking. Returns the number of frames loaded. Used by the bench harness so
 * the simulation resolves the same baked hitboxes the live server uses, without
 * paying for a full atlas rebake on every bench process. Returns 0 if the DB has
 * never been baked (the caller should then fall back to `initHitboxCache`).
 */
export function hydrateHitboxCacheFromDb(db: DB): number {
  cache = loadHitboxCache(db);
  return cache.size;
}

export function getHitboxDef(frameName: string): HitboxDef | undefined {
  return cache.get(frameName);
}

export function getHitboxCache(): Map<string, HitboxDef> {
  return cache;
}
