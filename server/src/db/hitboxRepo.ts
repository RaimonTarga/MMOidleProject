import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { HitboxDef, HitboxRect } from '@mmo-idle/shared';
import { spriteHitboxMeta, spriteHitboxes } from './schema';
import type * as schema from './schema';

type DB = NodePgDatabase<typeof schema>;

export const HITBOX_META_KEY = 'atlas';

export interface HitboxRow {
  frameName: string;
  sourceW: number;
  sourceH: number;
  rects: HitboxRect[];
  coverage: number;
}

export async function getAtlasHash(db: DB): Promise<string | null> {
  const rows = await db
    .select()
    .from(spriteHitboxMeta)
    .where(eq(spriteHitboxMeta.key, HITBOX_META_KEY))
    .limit(1);
  return rows[0]?.atlasHash ?? null;
}

export async function replaceAllHitboxes(
  db: DB,
  rows: HitboxRow[],
  atlasHash: string,
): Promise<void> {
  const now = Date.now();
  await db.transaction(async (tx) => {
    await tx.delete(spriteHitboxes);
    for (const row of rows) {
      await tx.insert(spriteHitboxes).values({
        frameName: row.frameName,
        sourceW: row.sourceW,
        sourceH: row.sourceH,
        rectsJson: JSON.stringify(row.rects),
        coverage: Math.round(row.coverage * 10000),
      });
    }
    await tx.insert(spriteHitboxMeta)
      .values({ key: HITBOX_META_KEY, atlasHash, bakedAt: now })
      .onConflictDoUpdate({
        target: spriteHitboxMeta.key,
        set: { atlasHash, bakedAt: now },
      });
  });
}

export async function loadHitboxCache(db: DB): Promise<Map<string, HitboxDef>> {
  const cache = new Map<string, HitboxDef>();
  const rows = await db.select().from(spriteHitboxes);
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
