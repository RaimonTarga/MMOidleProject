import { sql } from 'drizzle-orm';
import type { GameplayEvent, GameplayMetric, GameplayQuery, GameplaySnapshot, GameplayWriterHealth } from '@mmo-idle/shared';
import { logDb } from './index';
import { gameplayMetrics } from '../analytics/gameplayMetrics';

export async function insertGameplayEvents(events: GameplayEvent[]): Promise<void> {
  if (!events.length) return;
  const uniqueEvents = [...new Map(events.map(e => [e.id, e])).values()];
  await logDb.transaction(async tx => {
    await tx.execute(sql`SET LOCAL statement_timeout = '4000ms'`);
    await tx.execute(sql`SET LOCAL lock_timeout = '1000ms'`);
    // Returning only newly inserted IDs prevents retrying a committed batch from
    // double-counting its daily aggregates (including ambiguous network failures).
    const result = await tx.execute(sql`
      INSERT INTO gameplay_events (id, ts, game_version, character_id, session_id, cohort, node_id, class_id, tier, kind, event)
      VALUES ${sql.join(uniqueEvents.map(e => sql`(${e.id}, ${e.ts}, ${e.gameVersion}, ${e.characterId}, ${e.sessionId}, ${e.cohort}, ${e.nodeId}, ${e.classId}, ${e.tier}, ${e.payload.kind}, ${JSON.stringify(e)}::jsonb)`), sql`, `)}
      ON CONFLICT (id) DO NOTHING RETURNING id`);
    const inserted = new Set(result.rows.map(row => row.id));
    const metrics = new Map<string, GameplayMetric>();
    for (const e of uniqueEvents) if (inserted.has(e.id)) for (const m of gameplayMetrics(e)) {
      const key = JSON.stringify([m.day, m.gameVersion, m.cohort, m.nodeId, m.classId, m.tier, m.metric, m.dimension]);
      const existing = metrics.get(key);
      if (existing) { existing.count += m.count; existing.value += m.value; }
      else metrics.set(key, m);
    }
    const rows = [...metrics.values()];
    if (rows.length) await tx.execute(sql`
      INSERT INTO gameplay_daily (day, game_version, cohort, node_id, class_id, tier, metric, dimension, count, value)
      VALUES ${sql.join(rows.map(m => sql`(${m.day}::date, ${m.gameVersion}, ${m.cohort}, ${m.nodeId}, ${m.classId}, ${m.tier}, ${m.metric}, ${m.dimension}, ${m.count}, ${m.value})`), sql`, `)}
      ON CONFLICT (day, game_version, cohort, node_id, class_id, tier, metric, dimension)
      DO UPDATE SET count = gameplay_daily.count + EXCLUDED.count, value = gameplay_daily.value + EXCLUDED.value`);
  });
}
export async function pruneGameplayEvents(now = Date.now()): Promise<void> {
  await logDb.execute(sql`DELETE FROM gameplay_events WHERE ts < ${now - 90 * 86_400_000}`);
  await logDb.execute(sql`DELETE FROM gameplay_daily WHERE day < ${new Date(now - 365 * 86_400_000).toISOString().slice(0, 10)}::date`);
}
export async function queryGameplay(query: GameplayQuery, writer: GameplayWriterHealth): Promise<GameplaySnapshot> {
  const days = typeof query?.days === 'number' && Number.isFinite(query.days) ? Math.max(1, Math.min(365, Math.floor(query.days))) : 30;
  const cohort = query?.cohort === 'test' ? 'test' : 'human';
  const version = typeof query?.gameVersion === 'string' ? query.gameVersion.slice(0, 128) : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const start = Date.parse(today) - (days - 1) * 86_400_000;
  const versionClause = version ? sql`AND game_version = ${version}` : sql``;
  const [metrics, recent, versions, firstClears] = await Promise.all([
    logDb.execute(sql`SELECT day::text, game_version AS "gameVersion", cohort, node_id AS "nodeId", class_id AS "classId", tier, metric, dimension, count::float8, value FROM gameplay_daily WHERE day >= ${new Date(start).toISOString().slice(0, 10)}::date AND cohort = ${cohort} ${versionClause} ORDER BY day DESC`),
    logDb.execute(sql`SELECT event FROM gameplay_events WHERE ts >= ${start} AND cohort = ${cohort} ${versionClause} AND kind IN ('death','encounter-end','decision','progression') ORDER BY ts DESC, (event->>'sequence')::bigint DESC LIMIT 200`),
    logDb.execute(sql`SELECT DISTINCT game_version FROM gameplay_daily ORDER BY game_version`),
    logDb.execute(sql`WITH attempts AS (
      SELECT character_id, class_id, tier, event->'payload'->>'bossType' AS boss,
        event->'payload'->>'outcome' AS outcome
      FROM gameplay_events WHERE ts >= ${Math.max(start, Date.now() - 90 * 86_400_000)} AND cohort = ${cohort} ${versionClause}
        AND kind = 'encounter-end' AND event->'payload'->>'previouslyCleared' = 'false'
        AND event->'payload'->>'outcome' IN ('victory', 'death', 'retreat')
    ), cleared AS (
      SELECT character_id, boss, class_id, tier, count(*) AS attempts
      FROM attempts GROUP BY character_id, boss, class_id, tier HAVING bool_or(outcome = 'victory')
    ) SELECT boss AS "bossType", class_id AS "classId", tier, count(*)::float8 AS characters,
      avg(attempts)::float8 AS "meanAttempts" FROM cleared GROUP BY boss, class_id, tier ORDER BY boss`),
  ]);
  return { generatedAt: Date.now(), days, cohort, gameVersion: version ?? null, versions: versions.rows.map(r => String(r.game_version)), metrics: metrics.rows as unknown as GameplayMetric[], recent: recent.rows.map(r => r.event as GameplayEvent), writer, firstClears: firstClears.rows as unknown as GameplaySnapshot['firstClears'] };
}
