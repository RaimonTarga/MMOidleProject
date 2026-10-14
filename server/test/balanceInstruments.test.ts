import { ITEM_DATABASE } from '@mmo-idle/shared';
import { canonicalLoadout } from '../bench/balance/botFactory';
import { resolveGearLoadout } from '../bench/balance/progression';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const t1 = canonicalLoadout(1);
assert(t1.equippedRites.length === 0, 'T1 bench bot must not receive locked rites');

const t2 = canonicalLoadout(2);
assert(t2.equippedRites.length === 0, 'T2 bench bot must not receive T3 rite recipes');

// All six rites are T3 recipes and, since the 2026-08-22 gate fixes, all six are
// actually reachable at T3 — `ability-reprieve` and `mechanic-renewal` previously
// demanded a biome level above their own tier's cap, so the bench bot could not
// reach them until T4. The T3 and T4 rite sets are therefore identical now; what
// still separates the tiers is the RP budget, which is what these assertions check.
const CANONICAL_T3_RITES = 'blood-offering,purification,ability-reprieve,mechanic-renewal,swift-repose';

const t3 = canonicalLoadout(3);
assert(t3.equippedRites.join(',') === CANONICAL_T3_RITES, 'T3 rites must fill the legal canonical budget');

const t4 = canonicalLoadout(4);
assert(t4.equippedRites.join(',') === CANONICAL_T3_RITES, 'T4 rites must fill the legal canonical budget');

// The relic slot holds the class's boss trophy, never an item (class-first build plan §3.4),
// so no reference build equips a relic at any tier.
for (const [tier, root] of [[2, 'cadence-root'], [4, 'cadence-root'], [4, 'dot-root'], [4, 'summoner-root']] as const) {
  const gear = resolveGearLoadout('desert', tier, tier, root, null, [root]);
  assert(gear.relic === undefined, `${root} at T${tier} equips no relic item`);
}

console.log('balance instruments: ok');
