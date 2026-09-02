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
import { coreIsActive } from './cores';
import { activeStanceModifiers, stanceDef, type StanceModifiers } from '../stances';
import { effectiveAttacksPerSecond, upgradeMechanicEffectsTotal, upgradeStatBonusTotal } from './itemUpgrades';
import { GAME_CONFIG } from '../index';
import { mergePassives, makePulseAccumulator, finalizePulse } from '../passives';
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

/**
 * Fold the active stance's percentage posture onto the finished stat line.
 *
 * Separate from {@link applyClassAffinities} on purpose. Affinities are a shared
 * bucket because the class tree is one long additive chain the player builds over
 * tiers. A stance is a single mode with a single tooltip, and the player has to be
 * able to read that tooltip literally — so its percentages multiply the result of
 * everything below them rather than joining the class's sum.
 *
 * Attack speed and evasion are absent: both fold earlier, in step 2a, because they
 * already had once-applied semantics of their own.
 */
function applyStanceModifiers(p: PlayerStatsTarget, mods: StanceModifiers | undefined): void {
  if (!mods) return;
  const mult = (pct: number): number => Math.max(0.05, 1 + pct);
  if (mods.attackPct)
    p.dealsDamage.attack = Math.max(1, Math.round(p.dealsDamage.attack * mult(mods.attackPct)));
  if (mods.platingPct)
    p.mitigatesDamage.plating = Math.max(0, Math.round(p.mitigatesDamage.plating * mult(mods.platingPct)));
  if (mods.moveSpeedPct)
    p.hasPosition.speed = Math.max(0, Math.round(p.hasPosition.speed * mult(mods.moveSpeedPct)));
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
  // 0. Capture the HP fraction BEFORE step 1 wipes maxHp back to base. A gated stance
  // (Perfection) reads it to decide whether its upside half is in force. The stance
  // system re-runs this rebuild whenever the player crosses the threshold; nothing here
  // moves HP, so the reading cannot feed back into itself.
  const hpFraction = p.hasHealth.hp / Math.max(1, p.hasHealth.maxHp);

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
  p.hasHealth.recovery           = GAME_CONFIG.PLAYER_RECOVERY;
  p.hasPosition.speed           = GAME_CONFIG.PLAYER_SPEED;

  // 1b. Weapon attack rate. Upgrade steps may add an APS delta (the rapier
  // lineage buys cadence instead of Attack), so the effective rate is resolved
  // here rather than read straight off the base definition.
  const weaponId = p.holdsInventory.equipment.weapon;
  const weapon   = weaponId ? ITEM_DATABASE.get(weaponId) : undefined;
  if (weapon) {
    const aps = effectiveAttacksPerSecond(
      weapon,
      p.holdsInventory.itemUpgrades?.[weapon.id] ?? 0,
    );
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

  // 2a. Apply the active stance posture (system rework Step 10, corrected 2026-08-22).
  // Only the two fields with pre-existing sum-then-apply-once semantics fold here, so
  // they ride the same path as skill nodes: attack speed must land before the cooldown
  // computation below, and evasion is already a fraction. The stance's attack / plating
  // / move-speed PERCENTAGES are a separate multiplicative layer applied after the class
  // affinity fold (step 3e) — a posture the player toggles has to mean exactly what its
  // tooltip says for every class. `damageTakenPct` is not a stat at all: it is read at
  // hit time by the stance combat listener. The stance-switch system recalcs on change.
  const stance = stanceDef(p.activeStance);
  // Resolved, never `stance.modifiers`: a gated posture's conditional half only exists
  // in the resolver, so reading the field directly would silently drop it.
  const stanceMods = activeStanceModifiers(p.activeStance, hpFraction);
  if (stanceMods) {
    attackSpeedPct += stanceMods.attackSpeedPct ?? 0;
    if ((stanceMods.evasion ?? 0) > 0) evasionChance += stanceMods.evasion!;
  }
  if (stance?.mechanicEffects) {
    mergePassives(p.usesSkills.passives, stance.mechanicEffects, pulseAcc);
  }

  p.performsAttack.attackCooldown = Math.round(
    p.performsAttack.attackCooldown / Math.max(0.1, 1 + attackSpeedPct),
  );
  p.performsAttack.attackCooldown = Math.max(200, p.performsAttack.attackCooldown);
  p.mitigatesDamage.damageReduction = Math.min(0.9, Math.max(0, p.mitigatesDamage.damageReduction));

  // NOTE: the old step 2b granted a hardcoded per-class flat plating/recovery bonus
  // for picking any `-range-close` node. That was invisible budget living in code
  // rather than in the node tables; the close-range nodes now carry their whole
  // payoff as `platingPct`/`maxHpPct` affinities plus their authored mechanic.

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
    mergePassives(p.usesSkills.passives, def.mechanicEffects, pulseAcc);

    // Item upgrade bonuses: all stat and mechanic effect deltas from upgrade steps.
    const plus = p.holdsInventory.itemUpgrades?.[defId] ?? 0;
    if (plus > 0) {
      for (const [stat, value] of Object.entries(upgradeStatBonusTotal(def, plus))) {
        if (stat === 'evasion') { if (value > 0) evasionChance += value; }
        else applyStatModToTarget(p, stat, value);
      }
      const meFx = upgradeMechanicEffectsTotal(def, plus);
      if (Object.keys(meFx).length > 0) mergePassives(p.usesSkills.passives, meFx, pulseAcc);
    }
  }
  finalizePulse(pulseAcc, p.usesSkills.passives);

  // 3d. Class affinity layer. Base + equipment have now established raw magnitude,
  // so the summed class-tree percentages land here — once each, never compounding
  // per tier. This sits BEFORE the reload archetype layer (so reload's half-damage
  // trade prices the affinity-boosted attack, exactly as it priced the old flat
  // grants) and BEFORE the core layer (cores stay the deliberate final multiplier,
  // a separate layer stacked on the finished class chassis).
  applyClassAffinities(p, affinities);

  // 3e. Active-stance percentages. A stance is a MODE with a printed tooltip, so its
  // multipliers sit on top of the finished class chassis instead of summing into the
  // affinity bucket: "+40% Plating" is x1.40 for a Squire and for an Apprentice alike.
  // Placed immediately after the affinity fold and before the reload/core layers, which
  // both deliberately price the completed stat line.
  applyStanceModifiers(p, stanceMods);

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
  // Recovery is the canonical HP-restoration rate, so `core.recovery-mult` is
  // applied HERE and only here. Every in-combat regen effect activates a fraction
  // of this rate, so multiplying the rate covers all of them exactly once —
  // applying it again per-heal in defense/regen/healing.ts would compound it
  // (a +20% core landing as +44%).
  const recoveryMult   = passives['core.recovery-mult']       ?? 0;
  const atkSpeedMult  = passives['core.attack-speed-mult']  ?? 0;
  if (attackMult !== 0)
    p.dealsDamage.attack = Math.max(1, Math.round(p.dealsDamage.attack * (1 + attackMult)));
  if (maxHpMult !== 0)
    p.hasHealth.maxHp = Math.max(1, Math.round(p.hasHealth.maxHp * (1 + maxHpMult)));
  if (platMult !== 0)
    p.mitigatesDamage.plating = Math.max(0, Math.round(p.mitigatesDamage.plating * (1 + platMult)));
  if (speedMult !== 0)
    p.hasPosition.speed = Math.max(0, Math.round(p.hasPosition.speed * (1 + speedMult)));
  if (recoveryMult !== 0)
    p.hasHealth.recovery = Math.max(0, Math.round((p.hasHealth.recovery ?? 0) * (1 + recoveryMult)));
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

