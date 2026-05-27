import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { FrozenNodeSnapshot } from '@mmo-idle/shared';
import { nodeStates } from './schema';
import type * as schema from './schema';

type DB = BetterSQLite3Database<typeof schema>;

export function saveNodeSnapshot(db: DB, snapshot: FrozenNodeSnapshot): void {
  const now = Date.now();
  db.insert(nodeStates)
    .values({
      nodeId:       snapshot.nodeId,
      snapshotJson: JSON.stringify(snapshot),
      updatedAt:    now,
    })
    .onConflictDoUpdate({
      target: nodeStates.nodeId,
      set: {
        snapshotJson: JSON.stringify(snapshot),
        updatedAt:    now,
      },
    })
    .run();
}

export function loadNodeSnapshot(db: DB, nodeId: string): FrozenNodeSnapshot | null {
  const row = db.select().from(nodeStates).where(eq(nodeStates.nodeId, nodeId)).get();
  if (!row) return null;
  try {
    return JSON.parse(row.snapshotJson) as FrozenNodeSnapshot;
  } catch {
    console.warn(`[nodeRepo] corrupt snapshot for ${nodeId}`);
    return null;
  }
}

export function deleteNodeSnapshot(db: DB, nodeId: string): void {
  db.delete(nodeStates).where(eq(nodeStates.nodeId, nodeId)).run();
}
