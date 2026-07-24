import { maxGlobalMasteryAtTier } from '../config/gameConfig';
import {
  MAX_ITEM_TIER,
  MAX_UPGRADE,
  checkUpgrade,
  globalMasteryRequiredForUpgrade,
  upgradeCeilingFromGlobalMastery,
} from './itemUpgrades';
import { ITEM_DATABASE } from '../itemDatabase';
import type { EssenceType } from '../items';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const NO_ESSENCES = {} as Record<EssenceType, number>;

// Band boundaries derived from NODE_BIOMES start tiers (5 T1 biomes, +2 at T2,
// +2 at T3, +2 at T4) × 6 levels per tier; special nodes are excluded.
function testBandBoundaries(): void {
  assert(maxGlobalMasteryAtTier(0) === 0, 'max GM at tier 0');
  assert(maxGlobalMasteryAtTier(1) === 30, 'max GM at tier 1');
  assert(maxGlobalMasteryAtTier(2) === 72, 'max GM at tier 2');
  assert(maxGlobalMasteryAtTier(3) === 126, 'max GM at tier 3');
  assert(maxGlobalMasteryAtTier(4) === 192, 'max GM at tier 4');
}

function testTierOneThresholds(): void {
  for (let plus = 1; plus <= MAX_UPGRADE; plus++) {
    assert(
      globalMasteryRequiredForUpgrade(1, plus) === plus * 6,
      `tier 1 +${plus} threshold`,
    );
  }
  // Tier 0 starter gear shares tier 1's band rather than being free.
  assert(globalMasteryRequiredForUpgrade(0, 1) === 6, 'tier 0 clamps to tier 1 band');
}

function testThresholdsFillEachBand(): void {
  for (let tier = 1; tier <= MAX_ITEM_TIER; tier++) {
    const base = maxGlobalMasteryAtTier(tier - 1);
    assert(globalMasteryRequiredForUpgrade(tier, 1) > base, `tier ${tier} +1 above band start`);
    assert(
      globalMasteryRequiredForUpgrade(tier, MAX_UPGRADE) === maxGlobalMasteryAtTier(tier),
      `tier ${tier} +${MAX_UPGRADE} lands on band max`,
    );
    for (let plus = 2; plus <= MAX_UPGRADE; plus++) {
      assert(
        globalMasteryRequiredForUpgrade(tier, plus) > globalMasteryRequiredForUpgrade(tier, plus - 1),
        `tier ${tier} thresholds strictly increase at +${plus}`,
      );
    }
  }
}

function testCeilingIsTierScoped(): void {
  // Full tier-1 mastery unlocks tier-1 +5 and nothing on higher tiers.
  assert(upgradeCeilingFromGlobalMastery(30, 1) === MAX_UPGRADE, 'GM 30 tier 1 ceiling');
  assert(upgradeCeilingFromGlobalMastery(30, 2) === 0, 'GM 30 tier 2 ceiling');
  assert(upgradeCeilingFromGlobalMastery(30, 4) === 0, 'GM 30 tier 4 ceiling');
  // Tier 2 band opens progressively and closes at 72.
  assert(upgradeCeilingFromGlobalMastery(37, 2) === 0, 'GM 37 tier 2 still locked');
  assert(upgradeCeilingFromGlobalMastery(38, 2) === 1, 'GM 38 tier 2 +1');
  assert(upgradeCeilingFromGlobalMastery(71, 2) === 4, 'GM 71 tier 2 +4');
  assert(upgradeCeilingFromGlobalMastery(72, 2) === MAX_UPGRADE, 'GM 72 tier 2 +5');
  assert(upgradeCeilingFromGlobalMastery(72, 3) === 0, 'GM 72 tier 3 ceiling');
  assert(upgradeCeilingFromGlobalMastery(198, 4) === MAX_UPGRADE, 'GM 198 tier 4 +5');
  assert(upgradeCeilingFromGlobalMastery(9999, 1) === MAX_UPGRADE, 'ceiling capped at MAX_UPGRADE');
}

function testCheckUpgradeGatesByItemTier(): void {
  const tierTwo = [...ITEM_DATABASE.values()].find(
    (item) => item.tier === 2 && item.biomeGroup !== undefined && item.slot !== 'core',
  );
  assert(tierTwo !== undefined, 'database has an upgradeable tier 2 item');
  if (!tierTwo) return;

  // GM 30 (tier 1 fully mastered) must not open tier 2 upgrades.
  const locked = checkUpgrade({
    item: tierTwo,
    currentPlus: 0,
    biomeLevel: 999,
    essences: NO_ESSENCES,
    globalMastery: 30,
  });
  assert(!locked.ok, 'tier 2 upgrade blocked at GM 30');
  assert(
    (locked.reason ?? '').includes('Global Mastery'),
    'tier 2 block reason is the GM gate',
  );

  // At GM 72 the GM gate is open; any remaining failure is a different gate.
  const open = checkUpgrade({
    item: tierTwo,
    currentPlus: 0,
    biomeLevel: 999,
    essences: NO_ESSENCES,
    globalMastery: 72,
  });
  assert(
    open.ok || !(open.reason ?? '').includes('Global Mastery'),
    'tier 2 GM gate open at GM 72',
  );
}

testBandBoundaries();
testTierOneThresholds();
testThresholdsFillEachBand();
testCeilingIsTierScoped();
testCheckUpgradeGatesByItemTier();

console.log('itemUpgrades: ok');
