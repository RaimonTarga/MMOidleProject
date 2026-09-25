import { z } from 'zod';

const text = z.string().min(1).max(128);
export const filterShape = {
  from: z.iso.datetime().describe('Inclusive UTC timestamp.'),
  to: z.iso.datetime().describe('Exclusive UTC timestamp; keep fixed while paging.'),
  cohort: z.enum(['human', 'test']).default('human'),
  gameVersion: text.optional(), classId: text.optional(),
  tier: z.number().int().min(1).max(100).optional(), nodeId: text.optional(),
};
export const eventShape = {
  ...filterShape, kind: text.optional(), characterId: text.optional(),
  limit: z.number().int().min(1).max(200).default(100),
  after: z.object({ ts: z.number().int().nonnegative(), id: text }).optional(),
};
export const dailyShape = {
  ...filterShape, metric: text.optional(),
  limit: z.number().int().min(1).max(500).default(200),
  offset: z.number().int().min(0).max(100000).default(0),
};

function where(args, daily = false) {
  const from = Date.parse(args.from), to = Date.parse(args.to);
  if (to <= from || to - from > (daily ? 365 : 90) * 86400000) throw new Error('Invalid time window');
  if (daily && (from % 86400000 || to % 86400000)) throw new Error('Daily windows must use UTC midnight boundaries');
  const values = [daily ? args.from.slice(0, 10) : from, daily ? args.to.slice(0, 10) : to, args.cohort];
  const clauses = [daily ? 'day >= $1::date AND day < $2::date' : 'ts >= $1 AND ts < $2', 'cohort = $3'];
  for (const [key, column] of Object.entries({ gameVersion: 'game_version', classId: 'class_id', tier: 'tier', nodeId: 'node_id', ...(daily ? { metric: 'metric' } : { kind: 'kind', characterId: 'character_id' }) })) {
    if (args[key] !== undefined) { values.push(args[key]); clauses.push(`${column} = $${values.length}`); }
  }
  return { values, clauses };
}

export function eventQuery(input) {
  const args = z.object(eventShape).strict().parse(input);
  const { values, clauses } = where(args);
  if (args.after) { values.push(args.after.ts, args.after.id); clauses.push(`(ts, id) > ($${values.length - 1}, $${values.length})`); }
  values.push(args.limit + 1);
  return { text: `SELECT ts::float8 AS ts, id, event FROM public.gameplay_events WHERE ${clauses.join(' AND ')} ORDER BY ts, id LIMIT $${values.length}`, values, args };
}
export function dailyQuery(input) {
  const args = z.object(dailyShape).strict().parse(input);
  const { values, clauses } = where(args, true);
  values.push(args.limit + 1, args.offset);
  return { text: `SELECT day::text, game_version, cohort, node_id, class_id, tier, metric, dimension, count::text, value FROM public.gameplay_daily WHERE ${clauses.join(' AND ')} ORDER BY day, game_version, cohort, node_id, class_id, tier, metric, dimension LIMIT $${values.length - 1} OFFSET $${values.length}`, values, args };
}
export function coverageQuery(input) {
  const args = z.object(filterShape).strict().parse(input);
  const { values, clauses } = where(args);
  return { text: `SELECT game_version, kind, count(*)::text AS events, min(ts)::float8 AS first_ts, max(ts)::float8 AS last_ts FROM public.gameplay_events WHERE ${clauses.join(' AND ')} GROUP BY game_version, kind ORDER BY game_version, kind LIMIT 501`, values, args };
}

export async function readQuery(pool, query) {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query("SET LOCAL lock_timeout = '1s'");
    const result = await client.query(query.text, query.values);
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { discard = true; }
    throw error;
  } finally { client.release(discard); }
}
