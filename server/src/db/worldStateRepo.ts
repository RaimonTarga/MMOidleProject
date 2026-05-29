import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { worldState } from './schema';
import type * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

/**
 * Server-global key/value persistence for state that outlives any single node
 * lifecycle (freeze/thaw) and survives restarts — e.g. the Void Overlord
 * respawn cooldown.
 */
export function readWorldState(db: DB, key: string): string | null {
  const row = db.select().from(worldState).where(eq(worldState.key, key)).get();
  return row?.value ?? null;
}

export function writeWorldState(db: DB, key: string, value: string): void {
  db.insert(worldState)
    .values({ key, value, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: worldState.key,
      set: { value, updatedAt: Date.now() },
    })
    .run();
}

export function clearWorldState(db: DB, key: string): void {
  db.delete(worldState).where(eq(worldState.key, key)).run();
}
