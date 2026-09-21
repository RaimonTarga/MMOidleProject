import { sql } from 'drizzle-orm';
import type { DB } from './playerRepo';
import type { GameplayCohort } from '@mmo-idle/shared';

/** Identity mapping stays in the game DB; logdb receives only a random ID. */
export async function telemetryIdentity(db: DB, characterId: string): Promise<{ id: string; cohort: GameplayCohort }> {
  const result = await db.execute(sql`SELECT telemetry_id, telemetry_cohort FROM characters WHERE id = ${characterId}`);
  const row = result.rows[0];
  if (!row) throw new Error('Character missing during telemetry initialization');
  return { id: String(row.telemetry_id), cohort: row.telemetry_cohort === 'test' ? 'test' : 'human' };
}
export async function markTelemetryTest(db: DB, characterId: string): Promise<void> {
  await db.execute(sql`UPDATE characters SET telemetry_cohort = 'test' WHERE id = ${characterId}`);
}
