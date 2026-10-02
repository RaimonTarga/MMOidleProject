/**
 * The Phase 0 Recovery bench must run its own DEFAULT arm.
 *
 * `PHASE0_MODEL` defaults to `new` and `PHASE0_ARM` to `charm`, and that
 * combination used to die on `AssertionError: no pre-0b value for
 * plains-charm-t1` — the pre-0b charm table is only loaded for the `old` model, but
 * the lookup sat one line ABOVE the `model === 'old'` guard, so it ran for every
 * arm. The bench's primary arm was unrunnable, and nothing said so until someone
 * tried it.
 *
 * The guard now lives inside `oldModelRecovery`, which returns `null` when there is
 * no pre-0b rate to pin. These assertions are the regression: the `new` model must
 * never read the table, and the `old` model must still reproduce the percentage
 * arithmetic exactly.
 */
import { oldModelRecovery, type OldCharmPct } from '../bench/phase0RecoveryModel';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** The shape loaded from reports/progression-phase0/old-charm-pct.json. */
const CHARMS: Record<string, OldCharmPct> = {
  'plains-charm-t1': { base: 2, steps: [1, 1, 2, 2, 3] },
};

// The default arm: `new` + a charm, with the table EMPTY exactly as the bench
// leaves it. Nothing to pin, and above all no throw.
assert(
  oldModelRecovery({ model: 'new', maxHp: 200, charmId: 'plains-charm-t1', plus: 5, oldCharms: {} }) === null,
  'the new model must not ask for a pre-0b rate',
);
// Not even for a charm the table does know about: `new` never reads it at all.
assert(
  oldModelRecovery({ model: 'new', maxHp: 200, charmId: 'plains-charm-t1', plus: 5, oldCharms: CHARMS }) === null,
  'the new model must leave hasHealth.recovery alone',
);
assert(
  oldModelRecovery({ model: 'new', maxHp: 200, charmId: undefined, plus: 0, oldCharms: {} }) === null,
  'the new model must not pin a rate on the naked arm either',
);

// The `old` model still reproduces the pre-0b percentage: base 5 (Phase 0a's naked
// rate) + the charm's base + one step per `+N`, as a fraction of max HP.
const naked = oldModelRecovery({ model: 'old', maxHp: 200, charmId: undefined, plus: 5, oldCharms: CHARMS });
assert(naked === 200 * 5 / 100, `old naked rate should be 5% of the pool, got ${naked}`);

const plus0 = oldModelRecovery({ model: 'old', maxHp: 200, charmId: 'plains-charm-t1', plus: 0, oldCharms: CHARMS });
assert(plus0 === 200 * 7 / 100, `old +0 charm rate should be 5% + base 2%, got ${plus0}`);

const plus3 = oldModelRecovery({ model: 'old', maxHp: 200, charmId: 'plains-charm-t1', plus: 3, oldCharms: CHARMS });
assert(plus3 === 200 * 11 / 100, `old +3 charm rate should be 5% + 2% + 1+1+2, got ${plus3}`);

const plus5 = oldModelRecovery({ model: 'old', maxHp: 200, charmId: 'plains-charm-t1', plus: 5, oldCharms: CHARMS });
assert(plus5 === 200 * 16 / 100, `old +5 charm rate should be 5% + 2% + 9, got ${plus5}`);

// A charm the `old` table does not know about is still a loud failure — that guard
// is the point of the assert, and moving it must not have removed it.
let threw = false;
try {
  oldModelRecovery({ model: 'old', maxHp: 200, charmId: 'unknown-charm', plus: 1, oldCharms: CHARMS });
} catch {
  threw = true;
}
assert(threw, 'the old model must still refuse a charm with no pre-0b value');

console.log('phase0RecoveryArms.test.ts: ok');
