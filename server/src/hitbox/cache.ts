import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { HitboxDef } from '@mmo-idle/shared';
import type * as schema from '../db/schema';
import type { HitboxRow } from '../db/hitboxRepo';
import { loadHitboxCache, replaceAllHitboxes } from '../db/hitboxRepo';
import { getAtlasPaths, getVoidOverlordPaths } from './paths';

type DB = NodePgDatabase<typeof schema>;

const HITBOX_ARTIFACT_FILE = 'baked-hitboxes.json';

interface HitboxArtifact {
  atlasHash: string;
  bakedAt: number;
  rows: HitboxRow[];
}

let cache: Map<string, HitboxDef> = new Map();

function artifactPath(): string {
  return path.join(__dirname, HITBOX_ARTIFACT_FILE);
}

function rowsToCache(rows: HitboxRow[]): Map<string, HitboxDef> {
  const next = new Map<string, HitboxDef>();
  for (const row of rows) {
    next.set(row.frameName, {
      frameName: row.frameName,
      sourceW: row.sourceW,
      sourceH: row.sourceH,
      rects: row.rects,
      coverage: row.coverage,
    });
  }
  return next;
}

async function bakeHitboxRows(
  atlasPngPath: string,
  atlasJsonPath: string,
): Promise<HitboxArtifact> {
  const { createHash } = await import('crypto');
  const {
    bakeSpriteHitboxes,
    bakeVoidOverlordHitboxes,
    sha256File,
    writeShadowDefsFile,
  } = await import('./bake/index');

  const mainHash = sha256File(atlasPngPath);
  const voidPaths = getVoidOverlordPaths();
  const voidHash = sha256File(voidPaths.png);
  const atlasHash = createHash('sha256')
    .update(mainHash)
    .update(voidHash)
    .digest('hex');

  const main = await bakeSpriteHitboxes(atlasPngPath, atlasJsonPath);
  const voidBaked = await bakeVoidOverlordHitboxes(voidPaths.png);
  const rows = [...main.rows, ...voidBaked.rows];
  const shadowDefs = { ...main.shadowDefs, ...voidBaked.shadowDefs };

  writeShadowDefsFile(atlasJsonPath, atlasHash, shadowDefs);

  return { atlasHash, bakedAt: Date.now(), rows };
}

export async function initHitboxCache(
  db: DB,
  atlasPngPath: string,
  atlasJsonPath: string,
): Promise<Map<string, HitboxDef>> {
  const artifact = await bakeHitboxRows(atlasPngPath, atlasJsonPath);
  await replaceAllHitboxes(db, artifact.rows, artifact.atlasHash);

  cache = await loadHitboxCache(db);
  return cache;
}

export async function writeHitboxArtifact(outPath = artifactPath()): Promise<string> {
  const { atlasPng, atlasJson } = getAtlasPaths();
  const artifact = await bakeHitboxRows(atlasPng, atlasJson);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact)}\n`, 'utf8');
  return outPath;
}

export function hydrateHitboxCacheFromArtifact(): number {
  const filePath = artifactPath();
  if (!existsSync(filePath)) return 0;
  const artifact = JSON.parse(readFileSync(filePath, 'utf8')) as HitboxArtifact;
  cache = rowsToCache(artifact.rows);
  return cache.size;
}

/**
 * Load already-baked hitbox rows from the DB into the in-memory cache WITHOUT
 * rebaking. Returns the number of frames loaded. Used by the bench harness so
 * the simulation resolves the same baked hitboxes the live server uses, without
 * paying for a full atlas rebake on every bench process. Returns 0 if the DB has
 * never been baked (the caller should then fall back to `initHitboxCache`).
 */
export async function hydrateHitboxCacheFromDb(db: DB): Promise<number> {
  cache = await loadHitboxCache(db);
  return cache.size;
}

export function getHitboxDef(frameName: string): HitboxDef | undefined {
  return cache.get(frameName);
}

export function getHitboxCache(): Map<string, HitboxDef> {
  return cache;
}
