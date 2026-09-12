import { resolveFinalDamageMultipliers } from './finalDamage';
import { estimatePlayerDps } from './dpsEstimate';
import { resolveSummonerProfile } from './summonerProfile';
import { emptyEquipment } from '../items';
import type { EquipmentSlot } from '../items';
import type { HoldsInventory, UsesSkills } from '../components/core/networkedSlices';
import { recalculatePlayerStats, type PlayerStatsTarget } from './stats';
import { resolveOnHitDamage } from './onHitDamage';

export interface EquipmentPreviewInput {
  usesSkills: UsesSkills;
  equipment: HoldsInventory['equipment'];
  itemUpgrades: Record<string, number>;
  playerTier: number;
  hpFraction?: number;
  activeStance?: string | null;
  equippedRites?: readonly string[];
}

/** Detached inputs: use the server's stat formula without modifying the live build. */
export function previewEquipmentStats(input: EquipmentPreviewInput) {
  const target: PlayerStatsTarget = {
    dealsDamage: { attack: 0, onHitDamage: 0, attackStyle: 'slash' },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    evadesHits: { dodgeRate: 0, evadeMitigation: 0, charge: 0 },
    performsAttack: { attackRange: 0, attackCooldown: 1000, lastAttackAt: 0 },
    hasHealth: { hp: input.hpFraction ?? 1, maxHp: 1, recovery: 0 },
    hasPosition: { nodeId: '', current: { x: 0, y: 0 }, speed: 0 },
    usesSkills: { ...input.usesSkills, unlockedSkills: [...input.usesSkills.unlockedSkills], passives: {} },
    holdsInventory: { equipment: { ...input.equipment }, inventory: [], itemUpgrades: { ...input.itemUpgrades } },
    playerTier: input.playerTier, activeStance: input.activeStance, equippedRites: input.equippedRites,
  };
  const { cannotAttack } = recalculatePlayerStats(target);
  const passives = target.usesSkills.passives;
  const finalDamage = resolveFinalDamageMultipliers(passives, input.activeStance, input.hpFraction);
  const summonerInput = { ...target.usesSkills };
  const dps = estimatePlayerDps({
    attack: target.dealsDamage.attack, onHitDamage: target.dealsDamage.onHitDamage,
    attackCooldownMs: target.performsAttack.attackCooldown, weaponId: input.equipment.weapon,
    archetype: target.usesSkills.combatArchetype, passives,
    selectedSubVariant: target.usesSkills.selectedSubVariant, playerTier: input.playerTier,
    cannotAttack, finalDamageDealtMult: finalDamage.dealt,
    summoner: target.usesSkills.combatArchetype === 'summoner' ? {
      profileInput: summonerInput, activeCount: resolveSummonerProfile(summonerInput).slots.length,
    } : undefined,
  }).total;
  return {
    stats: {
      attack: target.dealsDamage.attack,
      onHitDamage: resolveOnHitDamage(target.dealsDamage.onHitDamage, passives),
      maxHp: target.hasHealth.maxHp,
      recovery: target.hasHealth.recovery ?? 0,
      plating: target.mitigatesDamage.plating,
      damageReduction: target.mitigatesDamage.damageReduction,
      damageDealtMult: finalDamage.dealt, damageTakenMult: finalDamage.taken,
      dodgeRate: target.evadesHits.dodgeRate, evadeMitigation: target.evadesHits.evadeMitigation,
      attacksPerSecond: 1000 / target.performsAttack.attackCooldown, dps,
      speed: target.hasPosition.speed,
      attackRange: target.performsAttack.attackRange,
    },
    rawOnHitDamage: target.dealsDamage.onHitDamage,
    attackCooldownMs: target.performsAttack.attackCooldown,
    passives, cannotAttack,
  };
}

export type EquipmentPreviewStat = keyof ReturnType<typeof previewEquipmentStats>['stats'];

/** Relevant rows include both the removed and added item's contribution, even for equal swaps. */
export function compareEquipmentStats(input: EquipmentPreviewInput, slot?: EquipmentSlot, candidate?: string | null) {
  const before = previewEquipmentStats(input);
  const after = slot ? previewEquipmentStats({ ...input, equipment: { ...input.equipment, [slot]: candidate ?? null } }) : before;
  const without = previewEquipmentStats({ ...input, equipment: slot ? { ...input.equipment, [slot]: null } : emptyEquipment() });
  const relevant = (Object.keys(before.stats) as EquipmentPreviewStat[]).filter(key =>
    Math.abs(before.stats[key] - without.stats[key]) > 1e-6 || Math.abs(after.stats[key] - without.stats[key]) > 1e-6);
  return { before, after, relevant };
}
