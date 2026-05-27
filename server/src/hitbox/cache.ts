import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { HitboxDef } from '@mmo-idle/shared';
import type * as schema from '../db/schema';
import { loadHitboxCache } from '../db/hitboxRepo';
import { bakeSpriteHitboxes, sha256File } from './bake/index';

type DB = BetterSQLite3Database<typeof schema>;

let cache: Map<string, HitboxDef> = new Map();

export async function initHitboxCache(
  db: DB,
  atlasPngPath: string,
  atlasJsonPath: string,
): Promise<Map<string, HitboxDef>> {
  const hash = sha256File(atlasPngPath);
  console.log('[hitbox] rebaking from atlas…');
  const t0 = Date.now();
  const count = await bakeSpriteHitboxes(db, atlasPngPath, atlasJsonPath, hash);
  console.log(`[hitbox] baked ${count} frames in ${Date.now() - t0}ms`);

  cache = loadHitboxCache(db);
  console.log(`[hitbox] loaded ${cache.size} frame hitboxes`);
  return cache;
}

export function getHitboxDef(frameName: string): HitboxDef | undefined {
  return cache.get(frameName);
}

export function getHitboxCache(): Map<string, HitboxDef> {
  return cache;
}
