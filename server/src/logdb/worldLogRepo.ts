import { and, desc, eq, lt, or, type SQL } from 'drizzle-orm';
import type {
  AdminWorldLogEntry,
  AdminWorldLogQuery,
  WorldLogEvent,
} from '@mmo-idle/shared';
import { logDb } from './index';
import { logRetentionMs } from './repo';
import { worldLogEntries } from './schema';

const MAX_WORLD_LOG_QUERY_LIMIT = 500;
const DEFAULT_WORLD_LOG_QUERY_LIMIT = 200;

type WorldLogInsert = typeof worldLogEntries.$inferInsert;
type WorldLogRow = typeof worldLogEntries.$inferSelect;

export interface WorldLogInsertEntry {
  viewerId: string;
  viewerAccountId?: string;
  viewerCharacterId?: string;
  viewerName: string;
  event: WorldLogEvent;
}

export async function insertWorldLogEntries(
  entries: WorldLogInsertEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  const values: WorldLogInsert[] = entries.map((entry) => ({
    ts: entry.event.serverTime,
    tick: entry.event.tick,
    kind: entry.event.kind,
    nodeId: entry.event.nodeId,
    viewerId: entry.viewerId,
    viewerAccountId: entry.viewerAccountId ?? null,
    viewerCharacterId: entry.viewerCharacterId ?? null,
    viewerName: entry.viewerName,
    event: entry.event as unknown as Record<string, unknown>,
  }));
  await logDb.insert(worldLogEntries).values(values);
}

export async function queryWorldLogEntries(
  query: AdminWorldLogQuery,
): Promise<AdminWorldLogEntry[]> {
  const limit = Math.max(
    1,
    Math.min(
      MAX_WORLD_LOG_QUERY_LIMIT,
      Math.floor(query.limit ?? DEFAULT_WORLD_LOG_QUERY_LIMIT),
    ),
  );
  const clauses: SQL<unknown>[] = [];
  if (typeof query.beforeTs === 'number') clauses.push(lt(worldLogEntries.ts, query.beforeTs));
  if (query.viewerCharacterId) {
    clauses.push(eq(worldLogEntries.viewerCharacterId, query.viewerCharacterId));
  } else if (query.viewerId && query.viewerAccountId) {
    const viewerClause = or(
      eq(worldLogEntries.viewerId, query.viewerId),
      eq(worldLogEntries.viewerAccountId, query.viewerAccountId),
    );
    if (viewerClause) clauses.push(viewerClause);
  } else if (query.viewerId) {
    clauses.push(eq(worldLogEntries.viewerId, query.viewerId));
  } else if (query.viewerAccountId) {
    clauses.push(eq(worldLogEntries.viewerAccountId, query.viewerAccountId));
  }
  if (query.nodeId) clauses.push(eq(worldLogEntries.nodeId, query.nodeId));
  if (query.kind) clauses.push(eq(worldLogEntries.kind, query.kind));

  const whereClause = clauses.length > 0 ? and(...clauses) : undefined;
  const rows = whereClause
    ? await logDb
      .select()
      .from(worldLogEntries)
      .where(whereClause)
      .orderBy(desc(worldLogEntries.ts))
      .limit(limit)
    : await logDb
      .select()
      .from(worldLogEntries)
      .orderBy(desc(worldLogEntries.ts))
      .limit(limit);

  return rows.reverse().map(rowToEntry);
}

export async function pruneExpiredWorldLogEntries(now = Date.now()): Promise<void> {
  const cutoff = now - logRetentionMs();
  await logDb.delete(worldLogEntries).where(lt(worldLogEntries.ts, cutoff));
}

function rowToEntry(row: WorldLogRow): AdminWorldLogEntry {
  return {
    id: row.id,
    viewerId: row.viewerId,
    viewerAccountId: row.viewerAccountId ?? undefined,
    viewerCharacterId: row.viewerCharacterId ?? undefined,
    viewerName: row.viewerName,
    event: row.event as unknown as WorldLogEvent,
  };
}
