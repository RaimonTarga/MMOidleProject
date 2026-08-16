import { buildBalanceLabSnapshot } from './balanceLab';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const snapshot = buildBalanceLabSnapshot(123456);

assert(snapshot.generatedAt === 123456, 'snapshot should preserve the caller-provided timestamp');
assert(snapshot.tiers.join(',') === '1,2,3,4', 'lab should expose every authored balance tier');
assert(snapshot.biomes.length > 0, 'lab should expose cross-biome rows');
assert(snapshot.encounters.length > 0, 'lab should expose encounter rows');
assert(snapshot.progressionPolicies.some((policy) => policy.id === 't1-starter-biomes-v1'), 'lab should expose declared T1 progression intent');
const t1Policy = snapshot.progressionPolicies.find((policy) => policy.id === 't1-starter-biomes-v1');
assert(t1Policy?.authoringBriefs.length === 5, 'T1 policy should give every starter biome a hand-authoring brief');
assert(t1Policy.authoringBriefs.every((brief) => brief.identity && brief.playerTest && brief.roster.length > 0), 'authoring briefs need identity, player test, and monster roles');

for (const tier of snapshot.tiers) {
  assert(snapshot.biomes.some((row) => row.biomeTier === tier), `tier ${tier} needs a world overview`);
  assert(snapshot.referenceProfiles.some((profile) => profile.biomeTier === tier && profile.label.startsWith('Entry')), `tier ${tier} needs an entry reference profile`);
}

const mountainT1 = snapshot.biomes.find((row) => row.biomeTier === 1 && row.biomeId === 'mountain');
assert(mountainT1, 'known mountain T1 row should be present');
assert(mountainT1.rosterSize === 3 && mountainT1.uniqueMonsters === 2, 'pool slots must preserve authored duplicate weighting');
assert(mountainT1.threatIndex > 0, 'threat index should be a finite positive comparison');

const ridgeArcher = snapshot.encounters.find((row) => row.biomeTier === 1 && row.monsterId === 'ridge-archer');
assert(ridgeArcher, 'known encounter should be inspectable');
assert(ridgeArcher.poolWeight === 1, 'encounter should expose authored pool weight');
assert(ridgeArcher.playerTtlSec === null || ridgeArcher.playerTtlSec > 0, 'finite TTL must be positive');

const t1Progression = snapshot.progression.filter((row) => row.policyId === 't1-starter-biomes-v1');
assert(t1Progression.map((row) => row.biomeId).join(',') === 'plains,forest,swamp,mountain,cave', 'T1 progression should preserve declared order');
const plainsBaseline = t1Progression[0];
assert(plainsBaseline.locked && plainsBaseline.currentVsBaseline === 1, 'Plains must remain the locked 1x baseline');
const caveTarget = t1Progression.at(-1);
assert(caveTarget?.minimumVsBaseline === 1.5, 'Cave should expose the declared minimum relative to Plains');
for (const row of t1Progression) {
  assert(Number.isFinite(row.encounterBurdenPctHp) && row.encounterBurdenPctHp >= 0, `${row.biomeName} emitted invalid encounter burden`);
  assert(Number.isFinite(row.currentVsBaseline) && row.currentVsBaseline > 0, `${row.biomeName} emitted invalid baseline ratio`);
}

for (const row of snapshot.biomes) {
  for (const value of [row.threatIndex, row.meanHp, row.maxHp, row.meanIncomingDps, row.maxIncomingDps, row.worstSpikePctHp, row.meanEssence, row.meanBiomeXp, row.rewardThreatRatio]) {
    assert(Number.isFinite(value), `${row.biomeName} T${row.biomeTier} emitted a non-finite metric`);
  }
}

for (const encounter of snapshot.encounters) {
  assert(encounter.specials.every((special) => special.trim().length > 0), `${encounter.name} emitted a blank mechanic label`);
  assert(encounter.planningTtkSec === null || encounter.planningTtkSec > 0, `${encounter.name} emitted an invalid planning TTK`);
}

console.log('balanceLab.test.ts: ok');
