/**
 * A minion refills out of combat on the SAME clock as its owner.
 *
 * `runMinionRegen` only ever runs out of combat, but the rate it spends came from
 * the owner's IN-COMBAT Recovery stat scaled by pool share. Two things were wrong
 * with that, and the comment above it claimed neither:
 *
 *   1. The player's out-of-combat rule is `maxHp × OOC_RECOVERY_PCT` — a fixed 10%
 *      of the pool per second, independent of the Recovery stat, because downtime is
 *      meant to be a constant 10 s at every tier (design bible §15). A naked T1
 *      summoner's bodies refilled at the owner's in-combat rate instead, which is
 *      `baseRecoveryForTier(1) / pool` ≈ 5%/s — half the owner's.
 *   2. Phase 0b made Recovery a gear stat, so charms and passives then bought a
 *      faster downtime clock for the summons, which is exactly what the fixed
 *      out-of-combat rate exists to prevent.
 *
 * The rate is now a share of the minion's own pool, so this pins both halves: the
 * clock matches the owner's, and Recovery gear does not move it.
 *
 * Run: node --conditions=development --import tsx test/minionOocRegen.test.ts
 */
import { GAME_CONFIG, baseRecoveryForTier } from '@mmo-idle/shared';
import { minionRecoveryFor } from '../src/systems/classes/archetypes/summoner/spawn';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const OOC = GAME_CONFIG.OOC_RECOVERY_PCT;

// 1. Empty-to-full takes the same wall time for a minion as for its owner, at every
//    body size — which is what "the same clock" means.
const expectedSeconds = 1 / OOC;
for (const pool of [12, 40, 130, 400, 1_000]) {
  const rate = minionRecoveryFor(pool);
  const seconds = pool / rate;
  assert(
    Math.abs(seconds - expectedSeconds) < 0.5,
    `a ${pool} HP body should refill in ~${expectedSeconds}s like its owner, got ${seconds.toFixed(1)}s`,
  );
}

// 2. A body one third the size heals a third as many HP per second.
const whole = minionRecoveryFor(300);
const third = minionRecoveryFor(100);
assert(
  Math.abs(third * 3 - whole) < 0.05,
  `a third-size body should heal a third as fast: ${third} x 3 against ${whole}`,
);

// 3. The rate does NOT read the owner's Recovery stat, so Recovery gear cannot buy a
//    faster downtime clock. The signature no longer admits an owner at all, so this
//    asserts the consequence: the same pool gives the same rate regardless of what a
//    summoner's own rate happens to be.
const minionPool = 40;
const rate = minionRecoveryFor(minionPool);
assert(
  rate === Math.round(minionPool * OOC * 100) / 100,
  `the rate should be ${minionPool} x ${OOC} = ${minionPool * OOC}, got ${rate}`,
);

// 4. And the old behaviour really was different — otherwise this test proves nothing.
// A naked T1 summoner: the owner's in-combat rate over its own pool, which is the
// share the minion used to inherit.
const t1Pool = GAME_CONFIG.RECOVERY_REFERENCE_POOL_BY_TIER[1]!;
const oldShareOfPool = baseRecoveryForTier(1) / t1Pool;
assert(
  oldShareOfPool < OOC * 0.75,
  `fixture: the old in-combat share (${(oldShareOfPool * 100).toFixed(1)}%/s) should be well under ` +
    `the out-of-combat rate (${OOC * 100}%/s), or the finding was not real`,
);

console.log('minionOocRegen.test.ts: ok');
