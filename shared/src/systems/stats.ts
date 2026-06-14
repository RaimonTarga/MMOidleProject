import type {
  DealsDamage,
  EvadesHits,
  HasHealth,
  HasPosition,
  HoldsInventory,
  MitigatesDamage,
  PerformsAttack,
  UsesSkills,
} from '../components/core/networkedSlices';
import { SKILL_TREE } from '../skillTree';
import { ITEM_DATABASE } from '../itemDatabase';
import { EQUIPMENT_SLOTS } from '../items';
import { upgradeMechanicEffectsTotal, upgradeStatBonusTotal } from './itemUpgrades';
import { GAME_CONFIG } from '../index';
import { mergePassives, makeBurstAccumulator, finalizeBurst } from '../passives';

/**
 * Map a raw evasion rating (Σ 1/N across all evasion sources) to a deterministic
 * per-hit dodge rate. Fully deterministic — the returned value drives a
 * fractional accumulator, never an RNG roll.
 *
 * Below `EVASION_SOFT_CAP` the rate is linear (unchanged low end). Above it,
 * diminishing returns asymptotically approach `EVASION_MAX_DODGE` so dodge
 * frequency can exceed 1/2 (2-in-3, 3-in-4, …) but never reaches 100% — full
 * avoidance is the job of the evade-mitigation multiplier, not frequency.
 */
export function evasionDodgeRate(raw: number): number {
  if (raw <= 0) return 0;
  const { EVASION_SOFT_CAP, EVASION_MAX_DODGE, EVASION_DR_K } = GAME_CONFIG;
  if (raw <= EVASION_SOFT_CAP) return raw;
  const excess = raw - EVASION_SOFT_CAP;
  return EVASION_MAX_DODGE
    - (EVASION_MAX_DODGE - EVASION_SOFT_CAP) / (1 + excess * EVASION_DR_K);
}

/** Slice record consumed by `recalculatePlayerStats`. */
export interface PlayerStatsTarget {
  dealsDamage:     DealsDamage;
  mitigatesDamage: MitigatesDamage;
  evadesHits:      EvadesHits;
  performsAttack:  PerformsAttack;
  hasHealth:       HasHealth;
  hasPosition:     HasPosition;
  usesSkills:      UsesSkills;
  holdsInventory:  HoldsInventory;
  /** Player progression tier (0-indexed: T1=0 … T4=3). Drives per-tier class bonuses. */
  playerTier?:     number;
  /** Optional callback when cadence threshold is recalculated (writes to usesCadence on server). */
  resetCadenceCounters?: (threshold: number) => void;
}


// Class-specific bonus applied when the player chose close range (range-close).
const CLOSE_RANGE_CLASS_BONUS: Record<string, { plating: number; hpRegen: number }> = {
  'cooldown-root': { plating: 5, hpRegen: 1 },
  'dot-root':      { plating: 4, hpRegen: 2 },
  'cadence-root':  { plating: 3, hpRegen: 3 },
  'reload-root':   { plating: 2, hpRegen: 4 },
  'energy-root':   { plating: 1, hpRegen: 5 },
};

function applyStatModToTarget(p: PlayerStatsTarget, stat: string, value: number): void {
  switch (stat) {
    case 'attack':          p.dealsDamage.attack          += value; break;
    case 'onHitDamage':     p.dealsDamage.onHitDamage     += value; break;
    case 'plating':         p.mitigatesDamage.plating     += value; break;
    case 'damageReduction': p.mitigatesDamage.damageReduction += value; break;
    // evasion is accumulated as a dodge rating — handled separately in recalculatePlayerStats
    case 'evasion': break;
    case 'attackRange':     p.performsAttack.attackRange  += value; break;
    case 'attackCooldown':  p.performsAttack.attackCooldown += value; break;
    case 'maxHp':           p.hasHealth.maxHp             += value; break;
    case 'hpRegen':         p.hasHealth.hpRegen           = (p.hasHealth.hpRegen ?? 0) + value; break;
    case 'speed':           p.hasPosition.speed           += value; break;
  }
}

/** Result of a stat rebuild — out-of-band signals the entity wrapper acts on. */
export interface PlayerStatsResult {
  /**
   * True when this player can no longer attack directly. Summoners fight
   * through minions, so the server wrapper attaches the `CannotAttack` marker.
   */
  cannotAttack: boolean;
}

/**
 * Deterministic full stat rebuild: base constants → weapon aps → skill effects → equipment modifiers.
 * Mutates slice fields in place. Returns out-of-band signals (see {@link PlayerStatsResult}).
 */
export function recalculatePlayerStats(p: PlayerStatsTarget): PlayerStatsResult {
  // 1. Reset to base
  p.dealsDamage.attack          = GAME_CONFIG.PLAYER_ATTACK;
  p.dealsDamage.onHitDamage     = 0;
  p.mitigatesDamage.plating     = GAME_CONFIG.PLAYER_PLATING;
  p.mitigatesDamage.damageReduction = 0;
  p.evadesHits.dodgeRate        = 0;
  p.evadesHits.evadeMitigation  = 0;
  p.performsAttack.attackRange  = GAME_CONFIG.PLAYER_ATTACK_RANGE;
  p.performsAttack.attackCooldown = GAME_CONFIG.PLAYER_ATTACK_COOLDOWN;
  p.hasHealth.maxHp             = GAME_CONFIG.PLAYER_MAX_HP;
  p.hasHealth.hpRegen           = GAME_CONFIG.PLAYER_HP_REGEN;
  p.hasPosition.speed           = GAME_CONFIG.PLAYER_SPEED;

  // 1b. Weapon attack rate
  const weaponId = p.holdsInventory.equipment.weapon;
  const weapon   = weaponId ? ITEM_DATABASE.get(weaponId) : undefined;
  if (weapon?.attacksPerSecond) {
    p.performsAttack.attackCooldown = Math.round(1000 / weapon.attacksPerSecond);
  }

  // 2. Apply unlocked skill effects
  let attackSpeedPct = 0;
  // Evasion sources combine additively: each source is a fraction (0–1) expressing
  // dodge frequency. Converted to a deterministic per-hit dodge rate via evasionDodgeRate().
  let evasionChance = 0;
  p.usesSkills.passives = {};
  // Regen-burst pair is resolved frequency-weighted across all sources rather
  // than summed; collect contributions here and finalize after equipment.
  const burstAcc = makeBurstAccumulator();
  for (const skillId of p.usesSkills.unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node) continue;
    const e = node.statEffects;
    p.dealsDamage.attack          += e.attack          ?? 0;
    p.mitigatesDamage.plating     += e.plating         ?? 0;
    p.mitigatesDamage.damageReduction += e.damageReduction ?? 0;
    if ((e.evasion ?? 0) > 0) evasionChance += e.evasion!;
    p.performsAttack.attackRange  += e.attackRange     ?? 0;
    attackSpeedPct                 += e.attackSpeedPct  ?? 0;
    p.hasHealth.maxHp             += e.maxHp           ?? 0;
    p.hasHealth.hpRegen           = (p.hasHealth.hpRegen ?? 0) + (e.hpRegen ?? 0);
    p.hasPosition.speed           += e.speed           ?? 0;
    mergePassives(p.usesSkills.passives, node.mechanicEffects, burstAcc);
  }
  p.performsAttack.attackCooldown = Math.round(
    p.performsAttack.attackCooldown / Math.max(0.1, 1 + attackSpeedPct),
  );
  p.performsAttack.attackCooldown = Math.max(200, p.performsAttack.attackCooldown);
  p.mitigatesDamage.damageReduction = Math.min(0.9, Math.max(0, p.mitigatesDamage.damageReduction));

  // 2b. Class-specific close-range bonus
  if (p.usesSkills.selectedRange?.endsWith('-range-close') && p.usesSkills.selectedClass) {
    const bonus = CLOSE_RANGE_CLASS_BONUS[p.usesSkills.selectedClass];
    if (bonus) {
      p.mitigatesDamage.plating += bonus.plating;
      p.hasHealth.hpRegen = (p.hasHealth.hpRegen ?? 0) + bonus.hpRegen;
    }
  }

  // 2c. Cadence threshold via callback (optional usesCadence slice on server)
  if (p.usesSkills.combatArchetype === 'cadence' && p.resetCadenceCounters) {
    const base = Math.round(p.usesSkills.passives['cadence.empowered-threshold'] ?? 5);
    const mod  = Math.round(p.usesSkills.passives['cadence.threshold-mod']        ?? 0);
    p.resetCadenceCounters(Math.max(2, base + mod));
  }

  // 3. Apply equipped item stat modifiers and mechanic effects
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = p.holdsInventory.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      if (stat === 'evasion') {
        if (value > 0) evasionChance += value;
      } else {
        applyStatModToTarget(p, stat, value);
      }
    }
    mergePassives(p.usesSkills.passives, def.mechanicEffects, burstAcc);

    // Item upgrade bonuses: all stat and mechanic effect deltas from upgrade steps.
    const plus = p.holdsInventory.itemUpgrades?.[defId] ?? 0;
    if (plus > 0) {
      for (const [stat, value] of Object.entries(upgradeStatBonusTotal(def, plus))) {
        if (stat === 'evasion') { if (value > 0) evasionChance += value; }
        else applyStatModToTarget(p, stat, value);
      }
      const meFx = upgradeMechanicEffectsTotal(def, plus);
      if (Object.keys(meFx).length > 0) mergePassives(p.usesSkills.passives, meFx, burstAcc);
    }
  }
  finalizeBurst(burstAcc, p.usesSkills.passives);

  // 3a. Shockblade (cadence-light-t3-a): flat on-hit damage scaling with the
  // player's tier, always active while the passive is unlocked. The per-tier
  // rate is authored on the node ('cadence.aftershock-onhit-per-tier'), so this
  // only affects the Shockblade branch.
  const aftershockOnHitPerTier = p.usesSkills.passives['cadence.aftershock-onhit-per-tier'] ?? 0;
  if (aftershockOnHitPerTier > 0) {
    p.dealsDamage.onHitDamage += ((p.playerTier ?? 0) + 1) * aftershockOnHitPerTier;
  }

  // Re-clamp damage reduction: equipment + upgrades are applied after the step-2 clamp.
  p.mitigatesDamage.damageReduction = Math.min(0.9, Math.max(0, p.mitigatesDamage.damageReduction));

  // Convert accumulated evasion rating to a deterministic per-hit dodge rate
  // (diminishing returns past the soft cap), plus the evade-mitigation multiplier.
  const dodgeRate = evasionDodgeRate(evasionChance);
  if (dodgeRate > 0) {
    p.evadesHits.dodgeRate = dodgeRate;
    p.evadesHits.evadeMitigation = Math.min(1, Math.max(0,
      GAME_CONFIG.EVADE_MITIGATION_BASE + (p.usesSkills.passives['defense.evade-mitigation'] ?? 0)));
  } else {
    p.evadesHits.dodgeRate = 0;
    p.evadesHits.evadeMitigation = 0;
  }

  // 3b. Reload archetype final multiplier
  if (p.usesSkills.combatArchetype === 'reload') {
    p.dealsDamage.attack = Math.max(1, Math.floor(p.dealsDamage.attack * 0.57));
    p.performsAttack.attackCooldown = Math.max(200, Math.round(p.performsAttack.attackCooldown * 0.5));
    if ((p.usesSkills.passives['reload.gatling'] ?? 0) > 0) {
      p.performsAttack.attackCooldown = Math.max(100, Math.round(p.performsAttack.attackCooldown * 0.5));
    }
  }

  // 4. Range floor. Negative range bonuses can reduce ranged builds down to
  // melee, but should never remove the base contact reach needed to attack.
  p.performsAttack.attackRange = Math.max(
    GAME_CONFIG.PLAYER_ATTACK_RANGE,
    p.performsAttack.attackRange,
  );

  // Summoners never attack directly (their minions do), so they can't.
  const cannotAttack = p.usesSkills.combatArchetype === 'summoner';

  // 5. Clamp current hp to the new max
  p.hasHealth.hp = Math.max(1, Math.min(p.hasHealth.hp, p.hasHealth.maxHp));

  return { cannotAttack };
}

