import { ITEM_DATABASE } from '@mmo-idle/shared';
import { canonicalLoadout } from '../bench/balance/botFactory';
import { resolveGearLoadout } from '../bench/balance/progression';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const t1 = canonicalLoadout(1);
assert(t1.activeStance === null, 'T1 bench bot must not receive a locked stance');
assert(t1.equippedRites.length === 0, 'T1 bench bot must not receive locked rites');

const t2 = canonicalLoadout(2);
assert(t2.activeStance === 'perfection-stance', 'T2 bench bot must use the explicit neutral stance');
assert(t2.equippedRites.length === 0, 'T2 bench bot must not receive T3 rite recipes');

const t3 = canonicalLoadout(3);
assert(t3.equippedRites.join(',') === 'blood-offering,purification,swift-repose', 'T3 rites must fill the legal canonical budget');

const t4 = canonicalLoadout(4);
assert(t4.activeStance === 'perfection-stance', 'T4 roster growth must not change the canonical stance');
assert(t4.equippedRites.join(',') === 'blood-offering,purification,ability-reprieve,swift-repose', 'T4 rites must fill the legal canonical budget');

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
