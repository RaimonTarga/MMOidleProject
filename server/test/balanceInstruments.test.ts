import { ITEM_DATABASE } from '@mmo-idle/shared';
import { resolveGearLoadout } from '../bench/balance/progression';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// The relic slot holds the class's boss trophy, never an item (class-first build plan §3.4),
// so no reference build equips a relic at any tier.
for (const [tier, root] of [[2, 'cadence-root'], [4, 'cadence-root'], [4, 'dot-root'], [4, 'summoner-root']] as const) {
  const gear = resolveGearLoadout('desert', tier, tier, root, null, [root]);
  assert(gear.relic === undefined, `${root} at T${tier} equips no relic item`);
}

console.log('balance instruments: ok');
