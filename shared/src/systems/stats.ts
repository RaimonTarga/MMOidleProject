import { classLineFor } from './classGear';
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
import { SKILL_TREE, type StatEffects } from '../skillTree';
import { ITEM_DATABASE } from '../itemDatabase';
import { EQUIPMENT_SLOTS } from '../items';
import { effectiveAttacksPerSecond } from './itemUpgrades';
import { GAME_CONFIG, baseRecoveryForTier, poolFactorForTier } from '../index';
import { mergePassives, makePulseAccumulator, finalizePulse } from '../passives';
import { relicRatingsFromPassives, resolveCadenceRelicProfile } from './relics';
import { summonerSpecializationFor } from '../data/summoner';
import { SLINGER_DIRECT_ATTACK_EFFECTIVENESS } from './classSecondaryDamage';
import { dotClassProfileForSubVariant } from './dotClassProfile';
import { weaponDotProfileForWeapon } from './weaponFamilies';

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
  /**
   * Preview only (the inventory stat sheet): leave these mechanic-effect keys of
   * one equipped item out of the rebuild, to measure whether they move the
   * numbers. Never set by the live server.
   */
  previewOmitItemEffects?: { defId: string; keys: ReadonlySet<string> };
}

function omitKeys(
  fx: Record<string, number> | undefined,
  omit: { defId: string; keys: ReadonlySet<string> } | undefined,
  defId: string,
): Record<string, number> | undefined {
  if (!fx || !omit || omit.defId !== defId) return fx;
  return Object.fromEntries(Object.entries(fx).filter(([key]) => !omit.keys.has(key)));
}


/**
 * Running total of every class-affinity contribution, in percentage points.
 *
 * Gear establishes raw magnitude; the class tree establishes ratios. Each node
 * adds into this bucket and the total lands ONCE on the post-equipment stat, so
 * a root/frame/range chain reads `raw × (1 + 0.30 + 0.22 + 0.10)` rather than
 * compounding tier by tier. Attack speed is deliberately absent: it rides the
 * pre-existing `attackSpeedPct` accumulator, which already had these semantics
 * and must stay ahead of the reload archetype's cadence layers.
 */
interface ClassAffinities {
  attack: number;
  maxHp: number;
  plating: number;
  moveSpeed: number;
}

function addAffinities(acc: ClassAffinities, e: StatEffects): void {
  acc.attack    += e.attackPct    ?? 0;
  acc.maxHp     += e.maxHpPct     ?? 0;
  acc.plating   += e.platingPct   ?? 0;
  acc.moveSpeed += e.moveSpeedPct ?? 0;
}

/**
 * Fold the summed affinities into the target's stats. Called once, after base +
 * equipment have established raw magnitude and before the archetype/core layers
 * that deliberately sit on top of the finished stat line.
 *
 * A −100% or worse affinity would zero (or invert) a stat, so each multiplier is
 * floored at 0.05 — an authored penalty stays a penalty without producing a
 * degenerate character.
 */
function applyClassAffinities(p: PlayerStatsTarget, a: ClassAffinities): void {
  const mult = (pct: number): number => Math.max(0.05, 1 + pct);
  if (a.attack !== 0)
    p.dealsDamage.attack = Math.max(1, Math.round(p.dealsDamage.attack * mult(a.attack)));
  if (a.maxHp !== 0)
    p.hasHealth.maxHp = Math.max(1, Math.round(p.hasHealth.maxHp * mult(a.maxHp)));
  if (a.plating !== 0)
    p.mitigatesDamage.plating = Math.max(0, Math.round(p.mitigatesDamage.plating * mult(a.plating)));
  if (a.moveSpeed !== 0)
    p.hasPosition.speed = Math.max(0, Math.round(p.hasPosition.speed * mult(a.moveSpeed)));
}

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
    case 'recovery':         p.hasHealth.recovery           = (p.hasHealth.recovery ?? 0) + value; break;
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
  // Flat HP/s, seeded per player tier (Phase 0b): the pool is a budget, the rate
  // a choice, so the base does not follow max HP inside a tier.
  p.hasHealth.recovery           = baseRecoveryForTier(p.playerTier);
  p.hasPosition.speed           = GAME_CONFIG.PLAYER_SPEED;

  // 1b. Weapon attack rate: the crafted form's own cadence. `itemUpgrades` is
  // never read — the +N ladder is retired on every slot (design §24.5).
  const weaponId = p.holdsInventory.equipment.weapon;
  const weapon   = weaponId ? ITEM_DATABASE.get(weaponId) : undefined;
  if (weapon) {
    const aps = effectiveAttacksPerSecond(weapon, 0);
    if (aps) p.performsAttack.attackCooldown = Math.round(1000 / aps);
  }

  // 2. Apply unlocked skill effects
  let attackSpeedPct = 0;
  // Evasion sources combine additively: each source is a fraction (0–1) expressing
  // dodge frequency. Converted to a deterministic per-hit dodge rate via evasionDodgeRate().
  let evasionChance = 0;
  // Class affinities accumulate here and land once, after equipment (step 3d).
  const affinities: ClassAffinities = { attack: 0, maxHp: 0, plating: 0, moveSpeed: 0 };
  p.usesSkills.passives = {};
  // The Recovery pulse triple is resolved frequency-weighted across all sources
  // rather than summed; collect contributions here and finalize after equipment.
  const pulseAcc = makePulseAccumulator();
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
    p.hasHealth.recovery           = (p.hasHealth.recovery ?? 0) + (e.recovery ?? 0);
    p.hasPosition.speed           += e.speed           ?? 0;
    addAffinities(affinities, e);
    mergePassives(p.usesSkills.passives, node.mechanicEffects, pulseAcc);
  }

  p.performsAttack.attackCooldown = Math.round(
    p.performsAttack.attackCooldown / Math.max(0.1, 1 + attackSpeedPct),
  );
  // Keep rounded cooldowns positive, without capping the attack-speed stat.
  // The combat loop independently limits actual attacks to its logic ticks.
  p.performsAttack.attackCooldown = Math.max(1, p.performsAttack.attackCooldown);
  p.mitigatesDamage.damageReduction = Math.min(0.9, Math.max(0, p.mitigatesDamage.damageReduction));

  // NOTE: the old step 2b granted a hardcoded per-class flat plating/recovery bonus
  // for picking any `-range-close` node. That was invisible budget living in code
  // rather than in the node tables; the close-range nodes now carry their whole
  // payoff as `platingPct`/`maxHpPct` affinities plus their authored mechanic.

  // 3. Apply equipped item stat modifiers and mechanic effects
  const classDr = p.mitigatesDamage.damageReduction;
  let itemDr = 0;
  for (const slot of EQUIPMENT_SLOTS) {
    const defId = p.holdsInventory.equipment[slot];
    if (!defId) continue;
    const def = ITEM_DATABASE.get(defId);
    if (!def) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      if (stat === 'damageReduction') { itemDr += value; continue; }
      if (stat === 'evasion') {
        if (value > 0) evasionChance += value;
      } else {
        applyStatModToTarget(p, stat, value);
      }
    }
    mergePassives(p.usesSkills.passives, omitKeys(def.mechanicEffects, p.previewOmitItemEffects, defId), pulseAcc);
    // A shared base's line for the wearer's class (class-first build plan §3.6).
    mergePassives(p.usesSkills.passives, classLineFor(def, p.usesSkills.combatArchetype)?.effects, pulseAcc);
    // No `+N` bonus on top: the ladder is retired on every slot and an item is
    // crafted at full power (design §23, §24.5). A save's stale `itemUpgrades`
    // entry adds nothing here; hydration refunds it.
  }
  p.mitigatesDamage.damageReduction = 1 - (1-classDr)*(1-Math.min(.9,Math.max(0,itemDr)));
  if (itemDr > 0) p.usesSkills.passives['defense.item-dr-base'] = itemDr;
  finalizePulse(pulseAcc, p.usesSkills.passives);

  // 3c-bis. THE PLAYER POOL RAISE (progression rework Phase 0 call four, design
  // bible §20) — the ONE place the per-tier pool factor is applied.
  //
  // It sits here because the flat pool is now complete and nothing has multiplied
  // it yet: `GAME_CONFIG.PLAYER_MAX_HP` from step 1, the armor's `maxHp` and its
  // upgrade steps from step 3 are the only flat sources in the game — no skill node authors a flat `maxHp`, they all author
  // `maxHpPct`. So one multiplication here IS "base max HP and armor maxHp", and
  // every percentage layer below (class affinities 3d) keeps multiplying the
  // finished pool exactly as before.
  //
  // Recovery is NOT touched: `hasHealth.recovery` was seeded in step 1 from the
  // tier's REFERENCE pool and is a flat HP/s, so a bigger pool buys attrition
  // rather than healing. That separation is the whole point of §15.
  const poolFactor = poolFactorForTier(p.playerTier);
  if (poolFactor !== 1) {
    p.hasHealth.maxHp = Math.max(1, Math.round(p.hasHealth.maxHp * poolFactor));
  }

  // 3d. Class affinity layer. Base + equipment have now established raw magnitude,
  // so the summed class-tree percentages land here — once each, never compounding
  // per tier. This sits BEFORE the reload archetype layer (so reload's half-damage
  // trade prices the affinity-boosted attack, exactly as it priced the old flat
  // grants) and BEFORE the core layer (cores stay the deliberate final multiplier,
  // a separate layer stacked on the finished class chassis).
  applyClassAffinities(p, affinities);

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
      p.dealsDamage.attack = Math.max(
        1,
        Math.floor(p.dealsDamage.attack * SLINGER_DIRECT_ATTACK_EFFECTIVENESS),
      );
    }

    if (isSnipe) {
      // Hard-set the firing cadence (ms/shot), ignoring weapon APS, the attack-speed
      // stat, and the reload double-speed layer. Default 2000ms = 0.5 APS.
      p.performsAttack.attackCooldown = Math.max(
        200,
        Math.round(p.usesSkills.passives['reload.snipe-cadence-ms'] ?? 2000),
      );
    } else {
      p.performsAttack.attackCooldown = Math.max(1, Math.round(p.performsAttack.attackCooldown * 0.5));
      if ((p.usesSkills.passives['reload.gatling'] ?? 0) > 0) {
        p.performsAttack.attackCooldown = Math.max(1, Math.round(p.performsAttack.attackCooldown * 0.5));
      }
    }
  }

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
