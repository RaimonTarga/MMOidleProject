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
import { coreIsActive } from './cores';
import { stanceDef } from '../stances';
import { riteDef } from '../rites';
import { upgradeMechanicEffectsTotal, upgradeStatBonusTotal } from './itemUpgrades';
import { GAME_CONFIG } from '../index';
import { mergePassives, makeBurstAccumulator, finalizeBurst } from '../passives';
import { relicRatingsFromPassives, resolveCadenceRelicProfile } from './relics';
import { summonerSpecializationFor } from '../data/summoner';

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
  /**
   * The currently-active stance id (system rework Step 10), if any. Its stat/mechanic
   * deltas fold into the rebuild; the stance-switch system triggers a recalc on change.
   */
  activeStance?:   string | null;
  /**
   * Equipped rites (system rework Step 11). Always-on OOC passives; every equipped
   * rite's `mechanicEffects` (the `rite.*` keys) folds into `usesSkills.passives` so
   * the out-of-combat systems can read them. No in-combat stat path.
   */
  equippedRites?:  readonly string[];
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

  // 2a. Apply the active stance posture (system rework Step 10). The active stance's
  // stat/mechanic deltas apply while it is the current posture. Most fields fold here,
  // before the attack-cooldown computation, so attackSpeedPct/evasion ride the same
  // once-applied path as skill nodes. `damageReduction` is deferred to the equipment
  // pass (below) so a negative DR tradeoff survives the intermediate [0,0.9] clamp and
  // combines with gear before the final clamp. The stance-switch system recalcs on change.
  const stance = stanceDef(p.activeStance);
  if (stance?.statEffects) {
    const e = stance.statEffects;
    p.dealsDamage.attack          += e.attack          ?? 0;
    p.mitigatesDamage.plating     += e.plating         ?? 0;
    if ((e.evasion ?? 0) > 0) evasionChance += e.evasion!;
    p.performsAttack.attackRange  += e.attackRange     ?? 0;
    attackSpeedPct                 += e.attackSpeedPct  ?? 0;
    p.hasHealth.maxHp             += e.maxHp           ?? 0;
    p.hasHealth.hpRegen           = (p.hasHealth.hpRegen ?? 0) + (e.hpRegen ?? 0);
    p.hasPosition.speed           += e.speed           ?? 0;
  }
  if (stance?.mechanicEffects) {
    mergePassives(p.usesSkills.passives, stance.mechanicEffects, burstAcc);
  }

  // 2b. Fold equipped rites (system rework Step 11). Rites are always-on OOC
  // passives: every equipped rite contributes only `rite.*` mechanic keys (no
  // in-combat stat deltas), read later by the out-of-combat systems.
  if (p.equippedRites) {
    for (const id of p.equippedRites) {
      const rite = riteDef(id);
      if (rite?.mechanicEffects) {
        mergePassives(p.usesSkills.passives, rite.mechanicEffects, burstAcc);
      }
    }
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

  // 3. Apply equipped item stat modifiers and mechanic effects
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = p.holdsInventory.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    // Core slot: a restricted core (melee/ranged) contributes NOTHING — neither its
    // upsides nor its tradeoffs — unless the player's selectedRange qualifies.
    // Unrestricted cores always apply. Eligibility is binary; see systems/cores.ts.
    if (slot === 'core' && !coreIsActive(def.coreEligibility, p.usesSkills.selectedRange)) continue;
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

  // Cadence must resolve after equipment is folded so item/relic threshold
  // changes are live. The old pre-equipment callback made those values inert.
  if (p.usesSkills.combatArchetype === 'cadence' && p.resetCadenceCounters) {
    const base = Math.round(p.usesSkills.passives['cadence.empowered-threshold'] ?? 5);
    const mod  = Math.round(p.usesSkills.passives['cadence.threshold-mod'] ?? 0);
    const profile = resolveCadenceRelicProfile(
      Math.max(2, base + mod),
      p.usesSkills.passives['cadence.empowered-mult'] ?? 2,
      relicRatingsFromPassives(p.usesSkills.passives),
    );
    p.resetCadenceCounters(profile.threshold.after);
  }

  // 3a. Shockblade (cadence-light-t3-a): flat on-hit damage scaling with the
  // player's tier, always active while the passive is unlocked. The per-tier
  // rate is authored on the node ('cadence.aftershock-onhit-per-tier'), so this
  // only affects the Shockblade branch.
  // Path specs unlock at playerTier 4, so scaling counts from there: 1× at unlock,
  // +1 per tier after (max(1, playerTier − 4 + 1)).
  const aftershockOnHitPerTier = p.usesSkills.passives['cadence.aftershock-onhit-per-tier'] ?? 0;
  if (aftershockOnHitPerTier > 0) {
    p.dealsDamage.onHitDamage += Math.max(1, (p.playerTier ?? 4) - 4 + 1) * aftershockOnHitPerTier;
  }

  // 3b. Dualslinger (reload-balanced-t3-c): same per-tier on-hit scaling, authored on
  // the node ('reload.alternating-onhit-per-tier'). Rewards the on-hit half of its
  // attack/on-hit split — the odd (2× on-hit) shots scale up with tier.
  const altOnHitPerTier = p.usesSkills.passives['reload.alternating-onhit-per-tier'] ?? 0;
  if (altOnHitPerTier > 0) {
    p.dealsDamage.onHitDamage += Math.max(1, (p.playerTier ?? 4) - 4 + 1) * altOnHitPerTier;
  }

  // Active-stance damageReduction (system rework Step 10): deferred from the 2a fold
  // so a negative DR tradeoff combines with skill + equipment DR before the final
  // clamp, instead of being zeroed by the intermediate step-2 clamp.
  if (stance?.statEffects?.damageReduction) {
    p.mitigatesDamage.damageReduction += stance.statEffects.damageReduction;
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
    const isSnipe = (p.usesSkills.passives['reload.snipe'] ?? 0) > 0;
    const isLaser = (p.usesSkills.passives['reload.laser'] ?? 0) > 0;

    // Sniper converts the bonus attack-speed STAT into attack damage (weapon APS is
    // ignored entirely — the cadence is hard-set below). Deliberately sub-1.0 so
    // attack speed is a damage source, never an efficiency race toward fast weapons.
    if (isSnipe) {
      const rate = p.usesSkills.passives['reload.snipe-as-to-dmg'] ?? 0.5;
      p.dealsDamage.attack += Math.round(p.dealsDamage.attack * attackSpeedPct * rate);
    }

    // Reload's half-damage pays for its double-speed. Sniper (slow hard-set cadence)
    // and Melter (continuous laser with its own per-tick scaling) don't get that
    // double-speed, so both are exempt and keep full attack damage.
    if (!isSnipe && !isLaser) {
      p.dealsDamage.attack = Math.max(1, Math.floor(p.dealsDamage.attack * 0.65));
    }

    if (isSnipe) {
      // Hard-set the firing cadence (ms/shot), ignoring weapon APS, the attack-speed
      // stat, and the reload double-speed layer. Default 2000ms = 0.5 APS.
      p.performsAttack.attackCooldown = Math.max(
        200,
        Math.round(p.usesSkills.passives['reload.snipe-cadence-ms'] ?? 2000),
      );
    } else {
      p.performsAttack.attackCooldown = Math.max(200, Math.round(p.performsAttack.attackCooldown * 0.5));
      if ((p.usesSkills.passives['reload.gatling'] ?? 0) > 0) {
        p.performsAttack.attackCooldown = Math.max(100, Math.round(p.performsAttack.attackCooldown * 0.5));
      }
    }
  }

  // 3c. Core multiplier layer (system rework Step 9). Cores express their effects as
  // percentage multipliers on the FINAL summed stat (base + skills + equipment), applied
  // once here. Sources add (two +10% → +20%); negative values reduce. The separate
  // multiplicative DR layer (`core.dr-layer-pct`) is applied in the combat pipeline, not
  // here. maxHp is multiplied BEFORE the hp-clamp below so the new ceiling takes effect.
  const passives = p.usesSkills.passives;
  const attackMult    = passives['core.attack-mult']       ?? 0;
  const maxHpMult     = passives['core.maxhp-mult']         ?? 0;
  const platMult      = passives['core.plating-mult']       ?? 0;
  const speedMult     = passives['core.speed-mult']         ?? 0;
  // Recovery scales BOTH halves of sustain. This is the passive-stat half; the
  // active half (every heal) is applied in defense/regen/healing.ts.
  const hpRegenMult   = passives['core.recovery-mult']       ?? 0;
  const atkSpeedMult  = passives['core.attack-speed-mult']  ?? 0;
  if (attackMult !== 0)
    p.dealsDamage.attack = Math.max(1, Math.round(p.dealsDamage.attack * (1 + attackMult)));
  if (maxHpMult !== 0)
    p.hasHealth.maxHp = Math.max(1, Math.round(p.hasHealth.maxHp * (1 + maxHpMult)));
  if (platMult !== 0)
    p.mitigatesDamage.plating = Math.max(0, Math.round(p.mitigatesDamage.plating * (1 + platMult)));
  if (speedMult !== 0)
    p.hasPosition.speed = Math.max(0, Math.round(p.hasPosition.speed * (1 + speedMult)));
  if (hpRegenMult !== 0)
    p.hasHealth.hpRegen = Math.max(0, Math.round((p.hasHealth.hpRegen ?? 0) * (1 + hpRegenMult)));
  if (atkSpeedMult !== 0)
    p.performsAttack.attackCooldown = Math.max(
      100,
      Math.round(p.performsAttack.attackCooldown / Math.max(0.1, 1 + atkSpeedMult)),
    );

  // 4. Range floor. Negative range bonuses can reduce ranged builds down to
  // melee, but should never remove the base contact reach needed to attack.
  p.performsAttack.attackRange = Math.max(
    GAME_CONFIG.PLAYER_ATTACK_RANGE,
    p.performsAttack.attackRange,
  );

  // Battle Bond is the sole transformative exception to the Conduit contract.
  const summonerFrame = p.usesSkills.selectedSubVariant ?? 'root';
  const battleBond = summonerSpecializationFor(
    summonerFrame,
    p.usesSkills.unlockedSkills,
  ) === 'battle-bond';
  const cannotAttack = p.usesSkills.combatArchetype === 'summoner' && !battleBond;

  // 5. Clamp current hp to the new max
  p.hasHealth.hp = Math.max(1, Math.min(p.hasHealth.hp, p.hasHealth.maxHp));

  return { cannotAttack };
}

