import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GameplayEvent } from '@mmo-idle/shared';
import { gameplayPlayerSlices } from './fixtures/gameplayPlayer';

/** Optional integration arm: only runs against an explicitly named disposable DB. */
async function main() {
  const url = process.env.TEST_GAMEPLAY_DATABASE_URL;
  if (!url) { console.log('gameplayPersistence.test.ts: skipped (set TEST_GAMEPLAY_DATABASE_URL for isolated PostgreSQL checks)'); return; }
  assert(new URL(url).pathname.startsWith('/codex_telemetry_test_'), 'Refusing a non-disposable database');
  process.env.LOG_DATABASE_URL = url;
  const { gameplayBuild } = await import('../src/analytics/gameplayRecorder');
  const { World } = await import('../src/world/World');
  const { logDb, logPool } = await import('../src/logdb/index');
  const { insertGameplayEvents, pruneGameplayEvents, queryGameplay } = await import('../src/logdb/gameplayRepo');
  const { telemetryIdentity, markTelemetryTest } = await import('../src/db/telemetryIdentity');
  const { sql } = await import('drizzle-orm');
  try {
    const tables = await logPool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    assert.equal(tables.rowCount, 0, 'Disposable database must be empty');
    await logPool.query(readFileSync(resolve('src/logdb/migrations/0004_gameplay_telemetry.sql'), 'utf8'));
    await logPool.query('CREATE TABLE characters (id text PRIMARY KEY)');
    await logPool.query("INSERT INTO characters VALUES ('private-character')");
    await logPool.query(readFileSync(resolve('src/db/migrations/0007_telemetry_identity.sql'), 'utf8'));
    const db = logDb as unknown as Parameters<typeof telemetryIdentity>[0];
    const identity = await telemetryIdentity(db, 'private-character');
    assert.notEqual(identity.id, 'private-character');
    assert.equal(identity.id, (await telemetryIdentity(db, 'private-character')).id);
    await markTelemetryTest(db, 'private-character');
    assert.equal((await telemetryIdentity(db, 'private-character')).cohort, 'test');
    const e: GameplayEvent = { id: randomUUID(), schemaVersion: 1, ts: Date.now(), gameVersion: 'integration', characterId: identity.id, sessionId: randomUUID(), sequence: 1, cohort: 'human', nodeId: 'node-5-5', classId: 'unselected', tier: 1, payload: { kind: 'exposure', durationMs: 1000, combatMs: 500 } };
    await insertGameplayEvents([e, e]);
    await insertGameplayEvents([e]);
    assert.equal((await logPool.query('SELECT * FROM gameplay_events')).rowCount, 1);
    assert.equal((await logPool.query("SELECT value FROM gameplay_daily WHERE metric='exposure-ms'")).rows[0].value, 1000, 'duplicate writes must not inflate aggregates');
    const valid = { ...e, id: randomUUID() };
    const invalid = { ...e, id: randomUUID(), tier: 1.5 };
    await assert.rejects(insertGameplayEvents([valid, invalid]));
    assert.equal((await logPool.query('SELECT * FROM gameplay_events')).rowCount, 1, 'failed batch must roll back entirely');
    await insertGameplayEvents([{ ...e, id: randomUUID(), cohort: 'test', payload: { kind: 'progression', milestone: 'player-tier', value: 2, sessionElapsedMs: 1000 } }]);
    const health = { queued: 0, inserted: 0, failedBatches: 0, dropped: 0, lastSuccessAt: null };
    const snapshot = await queryGameplay({ cohort: 'human', gameVersion: 'integration' }, health);
    assert.equal(snapshot.metrics.length, 2);
    assert.equal(snapshot.cohort, 'human');
    assert.equal(snapshot.gameVersion, 'integration');
    assert.deepEqual(snapshot.versions, ['integration']);
    assert.equal(snapshot.recent.length, 0, 'human filter excludes test events');
    assert.equal((await queryGameplay({ cohort: 'test' }, health)).recent.length, 1);
    assert(!JSON.stringify(snapshot).includes('private-character'));
    const world = new World();
    const build = gameplayBuild(world.attachPlayerEntity(gameplayPlayerSlices('fixture'), 'fixture'));
    const encounter = { ...e, classId: build.classId ?? 'unselected', tier: build.tier };
    for (const outcome of ['death', 'victory'] as const) await insertGameplayEvents([{ ...encounter, id: randomUUID(), payload: { kind: 'encounter-end', attemptId: randomUUID(), bossType: 'crag-behemoth', build, partySize: 1, outcome, previouslyCleared: false, durationMs: 1000, bossHpFraction: outcome === 'death' ? 0.5 : 0, damageDealt: 20, damageTaken: 10 } }]);
    const clears = (await queryGameplay({ cohort: 'human' }, health)).firstClears;
    assert.equal(clears.length, 1);
    assert.equal(clears[0].characters, 1);
    assert.equal(clears[0].meanAttempts, 2);
    await pruneGameplayEvents(Date.now() + 91 * 86_400_000);
    assert.equal((await logPool.query('SELECT * FROM gameplay_events')).rowCount, 0);
    assert((await logPool.query('SELECT * FROM gameplay_daily')).rowCount! > 0, 'daily totals outlive detailed data');
    await pruneGameplayEvents(Date.now() + 367 * 86_400_000);
    assert.equal((await logPool.query('SELECT * FROM gameplay_daily')).rowCount, 0);
    await logDb.execute(sql`SELECT 1`);
    console.log('gameplayPersistence.test.ts: ok');
  } finally { await logPool.end(); }
}
void main().catch(err => { console.error(err); process.exitCode = 1; });
