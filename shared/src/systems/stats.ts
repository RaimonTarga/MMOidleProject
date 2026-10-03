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
import { effectiveAttacksPerSecond } from './itemUpgrades';
import { GAME_CONFIG, baseRecoveryForTier, poolFactorForTier } from '../index';
import { mergePassives, makePulseAccumulator, finalizePulse } from '../passives';
import { relicRatingsFromPassives, resolveCadenceRelicProfile } from './relics';
import { summonerSpecializationFor } from '../data/summoner';
import { SLINGER_DIRECT_ATTACK_EFFECTIVENESS } from './classSecondaryDamage';
import { defensiveFaceForSubVariant, resolveActiveLineages } from './lineages';

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

  // 2b. Lineage stat rows (progression rework Phase 1).
  //
  // Resolved ONCE here, before the cooldown fold, because a Tempo stat row grants
  // `attackSpeedPct` and attack speed has to land before step 2a computes the
  // cooldown, which is the line immediately below. The flat half of the same
  // result is applied with equipment in step 3c, because a card is item power and
  // must sit inside the magnitude the class affinities then multiply.
  //
  // Only a lineage whose worn form is the item actually equipped in its slot
  // contributes, and only the active card of each row — owning a card is not
  // playing it.
  //
  // BAND COLLAPSE (design §4, Phase 5). `statEffects` also carries the stat row
  // of every band the worn form has collapsed: "the stat row's value folds into
  // the next form's base stats at the gate". Those absorbed rows arrive in the
  // SAME bag as the active one and so land through these two existing sites —
  // the percentage half here, the flat half in step 3c — which is what makes an
  // absorbed row contribute exactly once however many times recalc runs. There
  // is deliberately no third application site; `resolveActiveLineages` also
  // drops a slotted stat card its band has collapsed, so the two sets are
  // disjoint by construction.
  const lineageEffects = resolveActiveLineages(
    p.holdsInventory,
    defensiveFaceForSubVariant(p.usesSkills.selectedSubVariant),
  );
  attackSpeedPct += lineageEffects.statEffects.attackSpeedPct ?? 0;
  if ((lineageEffects.statEffects.evasion ?? 0) > 0) evasionChance += lineageEffects.statEffects.evasion!;
  if (lineageEffects.statEffects.attackPct) {
    affinities.attack += lineageEffects.statEffects.attackPct;
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
    // Core slot: a restricted core (melee/ranged) contributes NOTHING — neither its
    // upsides nor its tradeoffs — unless the player's selectedRange qualifies.
    // Unrestricted cores always apply. Eligibility is binary; see systems/cores.ts.
    if (slot === 'core' && !coreIsActive(def.coreEligibility, p.usesSkills.selectedRange)) continue;
    for (const [stat, value] of Object.entries(def.statModifiers)) {
      if (stat === 'damageReduction') { itemDr += value; continue; }
      if (stat === 'evasion') {
        if (value > 0) evasionChance += value;
      } else {
        applyStatModToTarget(p, stat, value);
      }
    }
    mergePassives(p.usesSkills.passives, omitKeys(def.mechanicEffects, p.previewOmitItemEffects, defId), pulseAcc);
    // No `+N` bonus on top: the ladder is retired on every slot and an item is
    // crafted at full power (design §23, §24.5). A save's stale `itemUpgrades`
    // entry adds nothing here; hydration refunds it.
  }
  // 3c. The flat half of the lineage stat rows — the slotted one plus the
  // absorbed ones (step 2b) — folded with equipment so class affinities multiply
  // it. Percentages and evasion already landed in step 2b; damage reduction joins
  // the ITEM bucket, because a card is item power. An absorbed row is base stats
  // of the worn form, so it belongs in exactly this bucket too.
  for (const [stat, value] of Object.entries(lineageEffects.statEffects)) {
    if (stat === 'attackSpeedPct' || stat === 'attackPct' || stat === 'evasion') continue;
    if (stat === 'damageReduction') { itemDr += value; continue; }
    // Technique power is the existing `technique.power-pct` PASSIVE, not an
    // `ItemStats` field (design §22): the Technique lane scales the same number
    // the Desert recipes author and `techniquePowerPctFor` reads, so a stat row
    // ADDS into that passive rather than inventing a parallel stat for the
    // ability code to miss. Additive and applied once, like every other `*Pct`.
    if (stat === 'techniquePowerPct') {
      p.usesSkills.passives['technique.power-pct'] =
        (p.usesSkills.passives['technique.power-pct'] ?? 0) + value;
      continue;
    }
    applyStatModToTarget(p, stat, value);
  }

  p.mitigatesDamage.damageReduction = 1 - (1-classDr)*(1-Math.min(.9,Math.max(0,itemDr)));
  if (itemDr > 0) p.usesSkills.passives['defense.item-dr-base'] = itemDr;
  finalizePulse(pulseAcc, p.usesSkills.passives);

  // 3c-bis. THE PLAYER POOL RAISE (progression rework Phase 0 call four, design
  // bible §20) — the ONE place the per-tier pool factor is applied.
  //
  // It sits here because the flat pool is now complete and nothing has multiplied
  // it yet: `GAME_CONFIG.PLAYER_MAX_HP` from step 1, the armor's `maxHp` and its
  // upgrade steps from step 3, and the flat half of a defensive lineage's HP row
  // from step 3c (which §3c itself calls item power) are the only flat sources in
  // the game — no skill node or stance authors a flat `maxHp`, they all author
  // `maxHpPct`. So one multiplication here IS "base max HP and armor maxHp", and
  // every percentage layer below (class affinities 3d, the stance 3e, the core's
  // `core.maxhp-mult`) keeps multiplying the finished pool exactly as before.
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

  // 3e. Active-stance plating/movement percentages. Damage is resolved at hit time. A stance is a MODE with a printed tooltip, so its
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
  // Quantized to a TENTH, not to a whole number like the four integer stats above.
  // Recovery became a fractional HP/s rate in Phase 0b, so `Math.round` was eating
  // most of the bonus: the Jungle core's +30% on a naked T1's 6.5 HP/s is 8.45, which
  // rounded to 8 and delivered +1.5 of the +1.95 it authored — a quarter of the core's
  // whole payoff, gone. One decimal is the same resolution `baseRecoveryForTier`
  // already quantizes to and the HUD already shows.
  if (recoveryMult !== 0)
    p.hasHealth.recovery = Math.max(0,
      Math.round((p.hasHealth.recovery ?? 0) * (1 + recoveryMult) * 10) / 10);
  if (atkSpeedMult !== 0)
    p.performsAttack.attackCooldown = Math.max(
      1,
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
