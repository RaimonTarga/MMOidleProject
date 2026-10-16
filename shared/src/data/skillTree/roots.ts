import type { SkillNode } from './types';
import type { CombatArchetype } from '../../types/combat';

const MELEE_ARCHETYPES = new Set<CombatArchetype>(['cadence', 'cooldown']);

/**
 * Returns true if the archetype fights in melee.
 * Null (no class selected) defaults to melee — base attack range is 12px.
 * Range nodes can override this in the future by passing unlockedSkills.
 */
export function isMeleeArchetype(archetype: CombatArchetype, unlockedSkills?: string[]): boolean {
  if (unlockedSkills) {
    if (unlockedSkills.some(s => s.endsWith('-range-far') || s.endsWith('-range-mid'))) return false;
    if (unlockedSkills.some(s => s.endsWith('-range-close'))) return true;
  }
  return archetype === null || MELEE_ARCHETYPES.has(archetype);
}

/** Inputs for {@link isRangedCombatant}; both server entity and PlayerView can supply these. */
export interface RangedCombatantInput {
  attackRange: number;
  combatArchetype: CombatArchetype;
  selectedRange: string | null;
  /** True when the energy.flash passive is active (Flash teleports into melee). */
  flashActive: boolean;
}

/**
 * Single source of truth for whether a combatant fights at range (kites to an
 * ideal gap) or in melee (closes to contact). Apprentice defaults to a short
 * spell range: it does not need a long attack range to cast instead of lunging.
 * Shared by server auto-steering (`steerTowardTarget`) and the client lunge
 * animation gate so the two never disagree. Range nodes win over archetype;
 * Flash is always melee.
 */
export function isRangedCombatant(input: RangedCombatantInput): boolean {
  if (input.flashActive) return false;
  if (input.selectedRange?.endsWith('-range-close')) return false;
  if (input.selectedRange?.endsWith('-range-mid') || input.selectedRange?.endsWith('-range-far')) return true;
  if (
    input.combatArchetype === 'reload' ||
    input.combatArchetype === 'energy' ||
    input.combatArchetype === 'dot'
  )
    return true;
  return input.attackRange > 100;
}

export const rootEntries = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CLASS STAT AFFINITY MODEL (T1–T3)
  //
  //   Gear establishes raw magnitude. Class progression establishes ratios.
  //
  // Every generic stat on tiers 0–2 is a PERCENTAGE affinity, never a flat
  // grant. Flat grants get diluted as equipment scales — `+14 attack` is the
  // whole character at T1 and a rounding error at T5 — which is how a class
  // stops feeling like itself. Percentages ride the gear curve instead, so a
  // Squire is still the heaviest chassis at +5 and a Spirit is still the
  // lightest.
  //
  // Contributions are ADDITIVE and applied ONCE:
  //     Squire root +30% HP, Bulwark +22%, Vanguard +10%  →  raw × 1.62
  //     NOT raw × 1.30 × 1.22 × 1.10
  // See `applyClassAffinities` in shared/src/systems/stats.ts.
  //
  //   Root  defines what you are     — strongest generic identity budget.
  //   Frame defines how you express it — smaller skew; the mechanic carries it.
  //   Range defines where you fight   — positional conversion, not a rebuild.
  //
  // WHAT STAYS FLAT / AUTHORED (deliberately NOT converted):
  //   `attackRange`      — a positional rule, not a magnitude.
  //   `evasion`          — already a fraction; gear never dilutes it.
  //   `damageReduction`  — likewise already a fraction. It needs no percentage
  //                        twin, and folding it into the existing additive DR
  //                        stat keeps one mitigation layer instead of two.
  //   all `mechanicEffects` — cadence thresholds, barrier/regen/DoT/reload/energy
  //                        mechanics, summon formation rules. This pass replaces
  //                        generic stat growth; it does not flatten identity.
  //
  // Flat `recovery` was removed from tiers 0–2 entirely: regen now comes from the
  // base rate, gear, and the authored sustain mechanics (in-combat regen, regen
  // burst) rather than a flat number that gear outgrows.
  //
  // The numbers below are coherent FIRST-PASS values, not final balance. They
  // are deliberately strong and are meant to be simulated and retuned.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Tier 0: Class roots ────────────────────────────────────────────────────
  // The permanent chassis, and the strongest generic identity in the tree:
  //   Squire → Striker → Apprentice → Slinger → Spirit
  //   heavy/defensive/slow ......... light/offensive/fast
  // Conduit is deliberately OFF that line — its offense and survival depend on
  // summon interception and formation size, not on its own stat chassis.

  ['cadence-root', {
    id: 'cadence-root', name: 'Striker', tier: 0,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanic — the combo: a short loop of beats ending in a finisher. You set what each beat does in your Order.',
    cost: 1, statEffects: {"attackPct": 0.08, "maxHpPct": 0.18, "platingPct": 0.05, "attackSpeedPct": 0.06, "moveSpeedPct": 0.04, "damageReduction": 0.18},
    // The old Recovery pulse is gone (bible §12.2): nothing defensive rides the combo.
    mechanicEffects: {},
  }],


  ['cooldown-root', {
    id: 'cooldown-root', name: 'Squire', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanic — prepare a timed execution on the 7s reference cycle at ×2; 10% of your Recovery stays active while you fight. The heaviest chassis in the game — enormous bulk and armor, bought with the slowest hands and feet.',
    cost: 1, statEffects: {"attackPct": 0.18, "maxHpPct": 0.3, "platingPct": 0.1, "attackSpeedPct": -0.15, "moveSpeedPct": -0.1, "damageReduction": 0.28},
    mechanicEffects: {"defense.recovery-active-pct": 0.1},
  }],


  ['reload-root', {
    id: 'reload-root', name: 'Slinger', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanics — unleash a rapid clip, then reload. Weapon Attack damage retains 65% effectiveness at this extreme cadence. Flat on-hit damage stays at full strength, while weapon damage converted into damage over time retains 85% effectiveness. Kills activate 20% of your Recovery for 4s, evades gain 10% extra damage mitigation, and target acquisition radius is ×2.5.',
    cost: 1, statEffects: {"attackPct": 0.2, "maxHpPct": 0.07, "attackSpeedPct": 0.1, "moveSpeedPct": 0.1, "attackRange": 120, "evasion": 0.3},
    // NOTE: max-ammo / reload-time-ms are set by the FRAME (Scout/Marksman/Artillerist),
    // not here — passives merge additively, so seeding them on the root too would stack
    // with the frame (e.g. 10 + 5 = 15 ammo). T3 nodes then delta off the frame's base
    // (e.g. snipe's reload.max-ammo: -2). Root-only falls back to the consumer defaults.
    mechanicEffects: {"defense.recovery-on-kill-pct": 0.2, "defense.recovery-on-kill-ms": 4000, "defense.evade-mitigation": 0.1, "reload.acquire-radius-mult": 2.5},
  }],


  ['energy-root', {
    id: 'energy-root', name: 'Spirit', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanic — channel each blow into a building surge of power. The lightest, fastest, highest-output chassis — almost no natural bulk, so a barrier worth 30% of your max HP takes the hits that do reach you. It recharges after a quiet window without taking damage.',
    cost: 1, statEffects: {"attackPct": 0.15, "maxHpPct": 0.03, "attackSpeedPct": 0.12, "moveSpeedPct": 0.12, "attackRange": 130},
    mechanicEffects: {},
  }],


  ['dot-root', {
    id: 'dot-root', name: 'Apprentice', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanics — your strikes leave lingering wounds; stack the pain until nothing survives. The middle chassis — no extreme in any direction — and a toxin-hardened body with 18% DoT resistance that converts 15% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: {"attackPct": 0.1, "maxHpPct": 0.12, "attackSpeedPct": 0.02, "moveSpeedPct": 0.03, "attackRange": 60, "damageReduction": 0.08},
    mechanicEffects: {"defense.dot-resistance": 0.18, "defense.hit-to-dot-pct": 0.15},
  }],


  ['summoner-root', {
    id: 'summoner-root', name: 'Conduit', tier: 0,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Class mechanic — maximum formation: 4 persistent summons before relic expansion. They fight in your place: your weapon sets their damage and cadence, while every body divides one shared formation offense and secondary-effect budget. Fallen slots rebuild one at a time from a 3.5s base (2.5s floor; 4× faster out of combat), costing 30% of the summon\'s max HP without taking you below 20% of your max HP.',
    cost: 1, statEffects: {"attackPct": 0.08, "maxHpPct": 0.08, "attackSpeedPct": 0.04, "moveSpeedPct": 0.05, "attackRange": 150},
    mechanicEffects: {},
  }],
] satisfies [string, SkillNode][];
