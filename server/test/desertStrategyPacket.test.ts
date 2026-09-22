import assert from 'node:assert/strict';
import { DESERT_BASES, DESERT_CELLS, DESERT_IDS } from '../bench/balance/desertStrategySpec';
import { runicPointLoadoutCost } from '@mmo-idle/shared';
import { bondResult } from '../bench/balance/desertStrategyRecorder';
import { endpointIntervals } from '../bench/balance/enduranceProgress';

assert.equal(DESERT_CELLS.length, 24);
assert.equal(new Set(DESERT_CELLS.map(c => c.id)).size, 24);
for (let i = 0; i < DESERT_CELLS.length; i += 2) {
  const pair = DESERT_CELLS.slice(i, i + 2);
  const a = pair.find(c => c.arm === 'baseline-targeting')!, b = pair.find(c => c.arm === 'lowhp-targeting')!;
  assert.deepEqual(pair.map(c => c.arm), a.seed === 101009 ? ['baseline-targeting', 'lowhp-targeting'] : ['lowhp-targeting', 'baseline-targeting']);
  assert.equal(a.identityId, DESERT_IDS[(i / 2) % 6]);
  const base = DESERT_BASES.find(c => c.identityId === a.identityId)!;
  const strip = (c: typeof a) => ({ build: { ...c.build, id: '' }, abilities: c.abilities, stance: c.stance,
    range: c.range, upgradeLevel: c.upgradeLevel, playerTreatment: c.playerTreatment });
  assert.deepEqual(strip(a), strip(base)); assert.deepEqual(strip(b), strip(a));
  assert.deepEqual(a.runeRules, base.runeRules);
  assert.deepEqual(b.runeRules, [{ conditionId: 'in-combat', actionId: 'focus-lowest-hp' }, ...a.runeRules!]);
  assert.deepEqual(a.abilities!.guards, ['second-wind', 'brace', 'cleanse']);
  assert.equal(a.stance, 'offensive-stance'); assert.equal(a.upgradeLevel, 5);
  assert.equal(a.nodeId, 'node-t4-desert-03'); assert.equal(b.nodeId, a.nodeId);
  const cost = (c: typeof a) => runicPointLoadoutCost({ rules: c.runeRules!, abilities: c.abilities!, stances: [c.stance!], rites: [] });
  assert.equal(cost(a), ['apprentice', 'spirit'].includes(a.className) ? 43 : 40);
  assert.equal(cost(b) - cost(a), 3);
}
const bond = { packId: 'one', firstBothEngagedMs: 100, bothEngagedMs: 100, ownerHpDamage: 7,
  ownerAbsorbed: 3, controlledMs: 0, lostMembership: false, members: [
    { id: 'd', type: 'sandspitter-cobra', role: 'dealer', firstSeenMs: 0, killedAtMs: 200 },
    { id: 'c', type: 'sand-viper', role: 'controller', firstSeenMs: 0, killedAtMs: 300 },
  ] };
assert.equal(bondResult(bond, 'window-ended').killOrder, 'dealer-first');
assert.equal(bondResult(bond, 'window-ended').dealerRemovalMsFromFirstBothEngaged, 100);
bond.members[1].killedAtMs = 200;
assert.equal(bondResult(bond, 'window-ended').killOrder, 'same-tick');
assert.equal(bondResult({ ...bond, lostMembership: true }, 'window-ended').status, 'ambiguous');
const unfinished = { ...bond, members: bond.members.map(m => ({ ...m, killedAtMs: null })) };
assert.equal(bondResult(unfinished, 'player-died').status, 'unfinished-at-player-death');
assert.equal(bondResult(unfinished, 'window-ended').status, 'unfinished-at-cap');
assert.equal(bondResult({ ...unfinished, firstBothEngagedMs: null }, 'window-ended').exposed, false);
assert.deepEqual(endpointIntervals([{ atMs: 300000, work: { kills: 3 } }], [300000, 600000]).map(x => x.kills), [3, null]);
console.log('desertStrategyPacket: fixed order, native three-RP delta, unchanged packages, pair ambiguity and null endpoints; zero combat');
