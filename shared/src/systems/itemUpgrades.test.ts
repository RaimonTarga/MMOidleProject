import { maxGlobalMasteryAtTier } from '../config/gameConfig';
import {
  MAX_ITEM_TIER,
  MAX_UPGRADE,
  UPGRADES_RETIRED_REASON,
  checkUpgrade,
  getMaxUpgrade,
  globalMasteryRequiredForUpgrade,
  upgradeCeilingFromGlobalMastery,
} from './itemUpgrades';
import { ITEM_DATABASE } from '../itemDatabase';
import type { EssenceType } from '../items';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const NO_ESSENCES = {} as Record<EssenceType, number>;

// Band boundaries derived from NODE_BIOMES start AND final tiers × 6 levels per tier;
// special nodes are excluded. Since the T3 economy pass (2026-08-30) a RETIRED biome
// stops adding headroom, so T3 is 114 (not 126) and T4 is 156 (not 192) — both tiers'
// +5 now land on content the player can actually reach.
function testBandBoundaries(): void {
  assert(maxGlobalMasteryAtTier(0) === 0, 'max GM at tier 0');
  assert(maxGlobalMasteryAtTier(1) === 30, 'max GM at tier 1');
  assert(maxGlobalMasteryAtTier(2) === 72, 'max GM at tier 2');
  assert(maxGlobalMasteryAtTier(3) === 114, 'max GM at tier 3');
  assert(maxGlobalMasteryAtTier(4) === 156, 'max GM at tier 4');
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
  assert(upgradeCeilingFromGlobalMastery(156, 4) === MAX_UPGRADE, 'GM 156 tier 4 +5');
  assert(upgradeCeilingFromGlobalMastery(155, 4) === 4, 'GM 155 tier 4 +4');
  assert(upgradeCeilingFromGlobalMastery(9999, 1) === MAX_UPGRADE, 'ceiling capped at MAX_UPGRADE');
}

/**
 * The ladder itself is retired on every slot (design §24.5): no item has a step
 * to take, and `checkUpgrade` refuses everything — at any Global Mastery, level
 * or wallet. The GM band above survives because it prices the bot's GM
 * milestones.
 */
function testLadderRetired(): void {
  const rich = { red: 1e9, blue: 1e9, green: 1e9, yellow: 1e9, purple: 1e9 } as Record<EssenceType, number>;
  for (const item of ITEM_DATABASE.values()) {
    assert(getMaxUpgrade(item) === 0, `${item.id}: no item has a ladder`);
    for (const essences of [NO_ESSENCES, rich]) {
      const check = checkUpgrade({ item, currentPlus: 0, biomeLevel: 999, essences, globalMastery: 999 });
      assert(!check.ok && check.reason === UPGRADES_RETIRED_REASON, `${item.id}: upgrade refused`);
    }
  }
}

testBandBoundaries();
testTierOneThresholds();
testThresholdsFillEachBand();
testCeilingIsTierScoped();
testLadderRetired();

console.log('itemUpgrades: ok');
