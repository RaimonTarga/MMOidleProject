import { ITEM_DATABASE, stanceDef } from '@mmo-idle/shared';
import { canonicalLoadout } from '../bench/balance/botFactory';
import { resolveGearLoadout } from '../bench/balance/progression';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const t1 = canonicalLoadout(1);
assert(t1.activeStance === null, 'T1 bench bot must not receive a locked stance');
assert(t1.equippedRites.length === 0, 'T1 bench bot must not receive locked rites');

const t2 = canonicalLoadout(2);
// The canonical stance must carry no intrinsic condition, or the bot spends most of a
// measured fight in a posture the report does not name. See botFactory's rationale.
assert(t2.activeStance === 'offensive-stance', 'T2 bench bot must use the explicit neutral stance');
assert(
  stanceDef(t2.activeStance!)?.gatedModifiers === undefined,
  'the canonical bench stance must be unconditional',
);
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
assert(t4.activeStance === 'offensive-stance', 'T4 roster growth must not change the canonical stance');
assert(t4.equippedRites.join(',') === CANONICAL_T3_RITES, 'T4 rites must fill the legal canonical budget');

const t2Gear = resolveGearLoadout('plains', 2, 2, 'cadence-root', null);
assert(t2Gear.relic === undefined, 'relic must not be equipped below T4');

const cadencePath = ['cadence-root', 'cadence-light', 'cadence-range-close', 'cadence-light-t3-a'];
const t4Gear = resolveGearLoadout('desert', 4, 4, 'cadence-root', 'cadence-range-close', cadencePath);
assert(t4Gear.relic !== undefined, 'T4 build must equip a representative relic');
assert(ITEM_DATABASE.get(t4Gear.relic)?.slot === 'relic', 'resolved relic id must point to a relic item');

const dotPath = ['dot-root', 'dot-light', 'dot-range-close', 'dot-light-t3-a'];
const dotT4Gear = resolveGearLoadout('desert', 4, 4, 'dot-root', 'dot-range-close', dotPath);
assert(dotT4Gear.relic !== undefined, 'every T4 class root must receive a legal relic');
assert(dotT4Gear.relic !== t4Gear.relic, 'relic selection must respond to class relevance');

const summonerPath = ['summoner-root', 'summoner-light', 'summoner-range-mid', 'summoner-light-t3-a'];
const summonerT4Gear = resolveGearLoadout('desert', 4, 4, 'summoner-root', 'summoner-range-mid', summonerPath);
assert(summonerT4Gear.relic !== undefined, 'summoner must receive a legal root-mechanic relic');
assert(summonerT4Gear.relic !== 'relic-glacial-bell', 'summoner must not select a relic for its unused buff channel');

console.log('balance instruments: ok');
