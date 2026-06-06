import { and, desc, eq, ilike, lt, or, type SQL } from 'drizzle-orm';
import type { AdminLogEntry, AdminLogLevel, AdminLogQuery } from '@mmo-idle/shared';
import { logDb } from './index';
import { logs } from './schema';

const MAX_LOG_QUERY_LIMIT = 500;
const DEFAULT_LOG_QUERY_LIMIT = 200;
const MAX_RETENTION_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type LogInsert = typeof logs.$inferInsert;
type LogRow = typeof logs.$inferSelect;

export function logRetentionMs(): number {
  const raw = Number(process.env.LOG_RETENTION_DAYS ?? MAX_RETENTION_DAYS);
  const days = Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_RETENTION_DAYS) : MAX_RETENTION_DAYS;
  return days * MS_PER_DAY;
}

export async function insertLogs(entries: AdminLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const values: LogInsert[] = entries.map((entry) => ({
    ts: entry.ts,
    level: entry.level,
    logger: entry.logger,
    message: entry.message,
    playerId: entry.playerId ?? null,
    accountId: entry.accountId ?? null,
    nodeId: entry.nodeId ?? null,
    action: entry.action ?? null,
    meta: entry.meta ?? null,
  }));
  await logDb.insert(logs).values(values);
}

export async function queryLogs(query: AdminLogQuery): Promise<AdminLogEntry[]> {
  const limit = Math.max(
    1,
    Math.min(
      MAX_LOG_QUERY_LIMIT,
      Math.floor(query.limit ?? DEFAULT_LOG_QUERY_LIMIT),
    ),
  );
  const clauses: SQL<unknown>[] = [];
  if (typeof query.beforeTs === 'number') clauses.push(lt(logs.ts, query.beforeTs));
  if (query.level) clauses.push(eq(logs.level, query.level));
  if (query.playerId) clauses.push(eq(logs.playerId, query.playerId));
  if (query.accountId) clauses.push(eq(logs.accountId, query.accountId));
  if (query.nodeId) clauses.push(eq(logs.nodeId, query.nodeId));
  if (query.search?.trim()) {
    const pattern = `%${query.search.trim()}%`;
    const searchClause = or(
      ilike(logs.message, pattern),
      ilike(logs.logger, pattern),
      ilike(logs.action, pattern),
    );
    if (searchClause) clauses.push(searchClause);
  }

  const whereClause = clauses.length > 0 ? and(...clauses) : undefined;
  const rows = whereClause
    ? await logDb.select().from(logs).where(whereClause).orderBy(desc(logs.ts)).limit(limit)
    : await logDb.select().from(logs).orderBy(desc(logs.ts)).limit(limit);
  return rows.reverse().map(rowToEntry);
}

export async function pruneExpiredLogs(now = Date.now()): Promise<void> {
  const cutoff = now - logRetentionMs();
  await logDb.delete(logs).where(lt(logs.ts, cutoff));
}

function rowToEntry(row: LogRow): AdminLogEntry {
  return {
    id: row.id,
    ts: row.ts,
    level: row.level as AdminLogLevel,
    logger: row.logger,
    message: row.message,
    playerId: row.playerId ?? undefined,
    accountId: row.accountId ?? undefined,
    nodeId: row.nodeId ?? undefined,
    action: row.action ?? undefined,
    meta: row.meta ?? undefined,
  };
}
