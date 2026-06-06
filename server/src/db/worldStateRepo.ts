import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { worldState } from './schema';
import type * as schema from './schema';

type DB = NodePgDatabase<typeof schema>;

/**
 * Server-global key/value persistence for state that outlives any single node
 * lifecycle (freeze/thaw) and survives restarts — e.g. the Void Overlord
 * respawn cooldown.
 */
export async function readWorldState(db: DB, key: string): Promise<string | null> {
  const rows = await db.select().from(worldState).where(eq(worldState.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function writeWorldState(db: DB, key: string, value: string): Promise<void> {
  await db.insert(worldState)
    .values({ key, value, updatedAt: Date.now() })
    .onConflictDoUpdate({
      target: worldState.key,
      set: { value, updatedAt: Date.now() },
    });
}

export async function clearWorldState(db: DB, key: string): Promise<void> {
  await db.delete(worldState).where(eq(worldState.key, key));
}
