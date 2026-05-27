import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { HitboxDef, HitboxRect } from '@mmo-idle/shared';
import { spriteHitboxMeta, spriteHitboxes } from './schema';
import type * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

export const HITBOX_META_KEY = 'atlas';

export interface HitboxRow {
  frameName: string;
  sourceW: number;
  sourceH: number;
  rects: HitboxRect[];
  coverage: number;
}

export function getAtlasHash(db: DB): string | null {
  const row = db
    .select()
    .from(spriteHitboxMeta)
    .where(eq(spriteHitboxMeta.key, HITBOX_META_KEY))
    .get();
  return row?.atlasHash ?? null;
}

export function replaceAllHitboxes(
  db: DB,
  rows: HitboxRow[],
  atlasHash: string,
): void {
  const now = Date.now();
  db.transaction((tx) => {
    tx.delete(spriteHitboxes).run();
    for (const row of rows) {
      tx.insert(spriteHitboxes).values({
        frameName: row.frameName,
        sourceW: row.sourceW,
        sourceH: row.sourceH,
        rectsJson: JSON.stringify(row.rects),
        coverage: Math.round(row.coverage * 10000),
      }).run();
    }
    tx.insert(spriteHitboxMeta)
      .values({ key: HITBOX_META_KEY, atlasHash, bakedAt: now })
      .onConflictDoUpdate({
        target: spriteHitboxMeta.key,
        set: { atlasHash, bakedAt: now },
      })
      .run();
  });
}

export function loadHitboxCache(db: DB): Map<string, HitboxDef> {
  const cache = new Map<string, HitboxDef>();
  const rows = db.select().from(spriteHitboxes).all();
  for (const row of rows) {
    cache.set(row.frameName, {
      frameName: row.frameName,
      sourceW: row.sourceW,
      sourceH: row.sourceH,
      rects: JSON.parse(row.rectsJson) as HitboxRect[],
      coverage: row.coverage / 10000,
    });
  }
  return cache;
}
