import {
  RELIC_UNLOCK_PLAYER_TIER,
  relicIsUnlocked,
  resolveCadenceRelicProfile,
  resolveCooldownRelicProfile,
  resolveDotRelicDeliveryProfile,
  resolveEnergyRelicProfile,
  resolveReloadRelicProfile,
  resolveRelicBonusMultiplier,
  resolveRelicCount,
  resolveRelicGain,
  resolveRelicInterval,
  resolveSummonerRelicProfile,
  type RelicRatings,
} from './relics';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function eq(actual: number, expected: number, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

const zero: RelicRatings = { frequency: 0, potency: 0, buffEffect: 0, debuffEffect: 0 };
const positive: RelicRatings = { frequency: 0.35, potency: 0.4, buffEffect: 0, debuffEffect: 0 };
const negative: RelicRatings = { frequency: -0.3, potency: -0.25, buffEffect: 0, debuffEffect: 0 };

assert(!relicIsUnlocked(RELIC_UNLOCK_PLAYER_TIER - 1), 'relic locked below T4');
assert(relicIsUnlocked(RELIC_UNLOCK_PLAYER_TIER), 'relic opens exactly at T4');
assert(relicIsUnlocked(0, true), 'test room bypasses unlock');

eq(resolveRelicInterval(1000, 0.5, 1, 100), 667, 'positive frequency shortens interval');
eq(resolveRelicInterval(1000, -0.5, 1, 100), 2000, 'negative frequency lengthens interval');
eq(resolveRelicInterval(1000, 2, 1, 500), 500, 'interval respects floor');
eq(resolveRelicGain(10, 0.5, 1, 1), 15, 'frequency raises gain');
eq(resolveRelicGain(10, -0.5, 1, 1), 5, 'negative frequency lowers gain');
eq(resolveRelicBonusMultiplier(2, 0.4, 1), 2.4, 'potency scales bonus above one');
eq(resolveRelicBonusMultiplier(2, -0.5, 1), 1.5, 'negative potency preserves base one');
eq(resolveRelicCount(3, 0.1, 2, 1), 4, 'discrete coefficient crosses baseline breakpoint');
eq(resolveRelicCount(10, 1, 1, 1, 12), 12, 'count respects cap');

{
  const p = resolveCadenceRelicProfile(5, 2, positive);
  eq(p.threshold.after, 3, 'cadence frequency resolves integer threshold');
  eq(p.empoweredMultiplier.after, 2.4, 'cadence potency resolves multiplier');
  const n = resolveCadenceRelicProfile(5, 2, negative);
  assert(n.threshold.after > n.threshold.before, 'negative cadence frequency lengthens cycle');
  assert(n.empoweredMultiplier.after < n.empoweredMultiplier.before, 'negative cadence potency weakens finisher');
}

{
  const p = resolveCooldownRelicProfile(7000, 2, positive);
  assert(p.cooldownMs.after < p.cooldownMs.before, 'cooldown frequency shortens cooldown');
  assert(p.empoweredMultiplier.after > p.empoweredMultiplier.before, 'cooldown potency raises execution');
  eq(resolveCooldownRelicProfile(7000, 2, zero).cooldownMs.after, 7000, 'zero cooldown profile is identity');
}

{
  const p = resolveReloadRelicProfile(1600, 10, positive);
  assert(p.reloadMs.after < 1600, 'reload frequency shortens reload');
  eq(p.ammoMax.after, 14, 'reload potency increases magazine');
}

{
  const p = resolveDotRelicDeliveryProfile(1500, 6, positive);
  assert(p.tickIntervalMs.after < 1500, 'DoT frequency shortens delivery interval');
  assert(p.maxStacks.after > 6, 'DoT potency raises stack ceiling');
  eq(p.damagePerStackReference.tickIntervalMs, 1500, 'DoT damage reference keeps pre-relic interval');
  eq(p.damagePerStackReference.maxStacks, 6, 'DoT damage reference keeps pre-relic cap');
}

{
  const p = resolveEnergyRelicProfile(14, 100, 2, positive);
  assert(p.gainPerHit.after > 14, 'energy frequency raises gain');
  eq(p.maxEnergy.after, 140, 'energy potency raises capacity');
  eq(p.dischargeMultiplier.after, 2.4, 'energy discharge follows capacity ratio');
}

{
  const p = resolveSummonerRelicProfile(5000, 3, positive);
  assert(p.respawnMs.after < 5000, 'summoner frequency shortens respawn');
  assert(p.summonCount.after > 3, 'summoner potency raises count');
}

console.log('relics: ok');
