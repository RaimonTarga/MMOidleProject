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
 * ideal gap) or in melee (closes to contact). Shared by server auto-steering
 * (`steerTowardTarget`) and the client lunge animation gate so the two never
 * disagree. Range nodes win over archetype; Flash is always melee.
 */
export function isRangedCombatant(input: RangedCombatantInput): boolean {
  if (input.flashActive) return false;
  if (input.selectedRange?.endsWith('-range-close')) return false;
  if (input.selectedRange?.endsWith('-range-mid') || input.selectedRange?.endsWith('-range-far')) return true;
  if (input.combatArchetype === 'reload' || input.combatArchetype === 'energy') return true;
  return input.attackRange > 100;
}

export const rootsAndFramesEntries = [
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
    description: 'Find the rhythm of battle. Every few hits your attack surges with accumulated force. A balanced bruiser — your recovery rate surges on a fixed cycle, sustaining you through prolonged engagements.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.18, platingPct: 0.15,
      attackSpeedPct: 0.06, moveSpeedPct: 0.04, damageReduction: 0.02,
    },
    // Recovery pulse: every 6s, run at +20% Recovery for 4s. At the naked baseline
    // (Recovery 10) that is 10% × 0.20 × 4s ≈ 8% max HP per cycle — the same
    // throughput as the flat 8% burst this replaces, but it now scales with
    // Recovery gear instead of ignoring it. Numbers are a first pass.
    mechanicEffects: { 'defense.recovery-pulse-pct': 0.20, 'defense.recovery-pulse-interval-ms': 6000, 'defense.recovery-pulse-duration-ms': 4000, 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 } as Record<string, number>,
  }],


  ['cooldown-root', {
    id: 'cooldown-root', name: 'Squire', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike on a set cycle. The heaviest chassis in the game — enormous bulk and armor, bought with the slowest hands and feet — and 10% of your Recovery rate stays active even while you fight.',
    cost: 1, statEffects: {
      attackPct: 0.18, maxHpPct: 0.30, platingPct: 0.30,
      attackSpeedPct: -0.15, moveSpeedPct: -0.10, damageReduction: 0.04,
    },
    mechanicEffects: { 'defense.recovery-active-pct': 0.10 } as Record<string, number>,
  }],


  ['reload-root', {
    id: 'reload-root', name: 'Slinger', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Unleash a rapid clip then reload. Your speed is doubled and damage per shot halved as a fundamental multiplier — a light, evasive frame that fights from range and weaves around incoming blows.',
    cost: 1, statEffects: {
      attackPct: 0.10, maxHpPct: 0.07,
      attackSpeedPct: 0.10, moveSpeedPct: 0.10,
      attackRange: 120, evasion: 0.25,
    },
    // NOTE: max-ammo / reload-time-ms are set by the FRAME (Scout/Marksman/Artillerist),
    // not here — passives merge additively, so seeding them on the root too would stack
    // with the frame (e.g. 10 + 5 = 15 ammo). T3 nodes then delta off the frame's base
    // (e.g. snipe's reload.max-ammo: -2). Root-only falls back to the consumer defaults.
    mechanicEffects: { 'defense.recovery-on-kill-pct': 0.20, 'defense.recovery-on-kill-ms': 4000, 'defense.evade-mitigation': 0.20, 'reload.acquire-radius-mult': 2.5 } as Record<string, number>,
  }],


  ['energy-root', {
    id: 'energy-root', name: 'Spirit', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Channel each blow into a building surge of power. The lightest, fastest, highest-output chassis — almost no natural bulk, so a barrier worth 30% of your max HP takes the hits that do reach you. It recharges between fights, not during them.',
    cost: 1, statEffects: {
      attackPct: 0.15, maxHpPct: 0.03,
      attackSpeedPct: 0.12, moveSpeedPct: 0.12,
      attackRange: 130,
    },
    mechanicEffects: { 'defense.barrier-pct': 0.30 } as Record<string, number>,
  }],


  ['dot-root', {
    id: 'dot-root', name: 'Apprentice', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives. The middle chassis — no extreme in any direction — and a toxin-hardened body that resists DoT damage by 18% and converts 10% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: {
      attackPct: 0.10, maxHpPct: 0.12, platingPct: 0.08,
      attackSpeedPct: 0.02, moveSpeedPct: 0.03,
      attackRange: 60,
    },
    mechanicEffects: { 'defense.dot-resistance': 0.18, 'defense.hit-to-dot-pct': 0.10 } as Record<string, number>,
  }],


  ['summoner-root', {
    id: 'summoner-root', name: 'Conduit', tier: 0,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: ['summoner-light', 'summoner-balanced', 'summoner-heavy'],
    description: 'Four persistent summons fight in your place. Your weapon sets their damage and cadence while the formation shares one offense and proc budget. Fallen slots rebuild one at a time, costing HP without crossing your safety floor.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.08,
      attackSpeedPct: 0.04, moveSpeedPct: 0.05,
      attackRange: 150,
    },
    mechanicEffects: {} as Record<string, number>,
  }],


  // ── Tier 1: Frames ─────────────────────────────────────────────────────────
  // Light / balanced / heavy expressions of the root mechanic. The generic
  // budget here is deliberately SMALLER than the root's, because each frame's
  // mechanic (finisher size, stack count, magazine, energy rate, formation)
  // already supplies most of its power and identity.
  //
  // LIGHT MEANS TEMPO, NOT ON-HIT. Light frames buy attack speed, which is
  // build-agnostic — basic attacks, on-hit procs, energy generation, cadence
  // accumulation and DoT application all benefit. On-hit AMPLIFICATION is
  // reserved for later specializations, items, rites and cores that
  // deliberately choose that archetype.

  ['summoner-light', {
    id: 'summoner-light', name: 'Splinter', tier: 1,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-root', children: ['summoner-light-t3-a', 'summoner-light-t3-b', 'summoner-light-t3-c'],
    description: 'Your presence splinters across six small, fast summons. The formation budget spreads over many bodies, so each loss costs little offense and little reconstruction HP — but the swarm is vulnerable to plating and area damage.',
    cost: 1, statEffects: {
      maxHpPct: 0.04, attackSpeedPct: 0.06, moveSpeedPct: 0.08,
    },
    mechanicEffects: {} as Record<string, number>,
  }],

  ['summoner-balanced', {
    id: 'summoner-balanced', name: 'Consort', tier: 1,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-root', children: ['summoner-balanced-t3-a', 'summoner-balanced-t3-b', 'summoner-balanced-t3-c'],
    description: 'Five medium summons hold a formal, stable ensemble. The reference formation: moderate damage, durability, and reconstruction pressure.',
    cost: 1, statEffects: {
      maxHpPct: 0.08, platingPct: 0.06, moveSpeedPct: 0.02,
    },
    mechanicEffects: {} as Record<string, number>,
  }],

  ['summoner-heavy', {
    id: 'summoner-heavy', name: 'Effigy', tier: 1,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-root', children: ['summoner-heavy-t3-a', 'summoner-heavy-t3-b', 'summoner-heavy-t3-c'],
    description: 'Two large, slow summons concentrate the formation budget into consequential bodies. Each loss removes major offense and is expensive to reconstruct.',
    cost: 1, statEffects: {
      maxHpPct: 0.16, platingPct: 0.12,
      attackSpeedPct: -0.06, moveSpeedPct: -0.06, damageReduction: 0.01,
    },
    mechanicEffects: {} as Record<string, number>,
  }],


  ['cadence-light', {
    id: 'cadence-light', name: 'Flurry', tier: 1,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-root', children: [],
    description: 'Swift and agile. Trades bulk for a blistering attack pace. Empowered finisher triggers every 4 hits at 1.5× — frequency over raw power.',
    cost: 1, statEffects: {
      attackPct: 0.06, maxHpPct: 0.04, attackSpeedPct: 0.12, moveSpeedPct: 0.10,
    },
    mechanicEffects: { 'cadence.empowered-threshold': 4, 'cadence.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cadence-balanced', {
    id: 'cadence-balanced', name: 'Skirmisher', tier: 1,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-root', children: [],
    description: 'A measured approach. Modest gains across the board without committing to an extreme. Empowered finisher every 5 hits at 2×.',
    cost: 1, statEffects: {
      attackPct: 0.07, maxHpPct: 0.10, platingPct: 0.10,
      attackSpeedPct: 0.04, moveSpeedPct: 0.03,
    },
    mechanicEffects: { 'cadence.empowered-threshold': 5, 'cadence.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cadence-heavy', {
    id: 'cadence-heavy', name: 'Breaker', tier: 1,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-root', children: [],
    description: 'Endurance over speed. Significant bulk and armor; pays for it in attack pace and footwork. Empowered finisher every 6 hits at 4× — patience rewarded with one enormous blow.',
    cost: 1, statEffects: {
      attackPct: 0.05, maxHpPct: 0.18, platingPct: 0.20,
      attackSpeedPct: -0.10, moveSpeedPct: -0.10, damageReduction: 0.02,
    },
    mechanicEffects: { 'cadence.empowered-threshold': 6, 'cadence.empowered-mult': 4.0 } as Record<string, number>,
  }],


  ['cooldown-light', {
    id: 'cooldown-light', name: 'Warrior', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'The aggressive tank. Keeps its armored core but trades patience for a fast, hungry tempo. Execution recharges in 5 s at 1.5×.',
    cost: 1, statEffects: {
      attackPct: 0.07, maxHpPct: 0.05, platingPct: 0.05,
      attackSpeedPct: 0.12, moveSpeedPct: 0.10,
    },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 5000, 'cooldown.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cooldown-balanced', {
    id: 'cooldown-balanced', name: 'Knight', tier: 1,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-root', children: [],
    description: 'A sturdy foundation. Substantial HP and armor amplify the class\'s defensive identity without tipping into immobility. Execution recharges in 7 s at 2×.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.12, platingPct: 0.15,
      attackSpeedPct: 0.03, moveSpeedPct: -0.02, damageReduction: 0.02,
    },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 7000, 'cooldown.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cooldown-heavy', {
    id: 'cooldown-heavy', name: 'Bulwark', tier: 1,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-root', children: [],
    // Bulwark keeps real ATTACK affinity on purpose: the fantasy is enormous
    // individual hits, not merely maximum defense. Its sustained throughput is
    // constrained by the attack-speed penalty, not by a weak attack stat.
    description: 'Fortress of patience. Maximum bulk makes you a wall, and every blow lands like one — but you move like a boulder and swing even slower. Execution recharges in 9 s at 3×.',
    cost: 1, statEffects: {
      attackPct: 0.10, maxHpPct: 0.22, platingPct: 0.25,
      attackSpeedPct: -0.12, moveSpeedPct: -0.12, damageReduction: 0.03,
    },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 8000, 'cooldown.empowered-mult': 3.5 } as Record<string, number>,
  }],


  ['dot-light', {
    id: 'dot-light', name: 'Venom vessel', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Poison path. Apply wounds quickly and stay mobile. Up to 8 poison stacks — each hit converts 30% of your attack into lingering poison damage.',
    cost: 1, statEffects: {
      attackPct: 0.06, maxHpPct: 0.04, attackSpeedPct: 0.10, moveSpeedPct: 0.10,
    },
    mechanicEffects: {
      'dot.max-stacks': 8, 'dot.conversion-pct': 0.30,
      'dot.tick-interval-ms': 1000, 'dot.duration-ms': 5000, 'dot.mechanic-mult': 1.25,
    } as Record<string, number>,
  }],

  ['dot-balanced', {
    id: 'dot-balanced', name: 'Ember mage', tier: 1,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-root', children: [],
    description: 'Fire path. A deliberate fighter. Up to 6 burn stacks — each hit converts 50% of your attack into damage over time.',
    cost: 1, statEffects: {
      attackPct: 0.07, maxHpPct: 0.10, platingPct: 0.10, attackSpeedPct: 0.03,
    },
    mechanicEffects: {
      'dot.max-stacks': 6, 'dot.conversion-pct': 0.50,
      'dot.tick-interval-ms': 1500, 'dot.duration-ms': 5500, 'dot.mechanic-mult': 1.20,
    } as Record<string, number>,
  }],

  ['dot-heavy', {
    id: 'dot-heavy', name: 'Rime-Bound', tier: 1,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-root', children: [],
    description: 'Frost path. A war of attrition. Up to 3 frost stacks — each hit converts 70% of your attack into deep, lingering wounds.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.18, platingPct: 0.20,
      attackSpeedPct: -0.10, moveSpeedPct: -0.10, damageReduction: 0.03,
    },
    mechanicEffects: {
      'dot.max-stacks': 3, 'dot.conversion-pct': 0.70,
      'dot.tick-interval-ms': 2000, 'dot.duration-ms': 6500, 'dot.mechanic-mult': 1.15,
    } as Record<string, number>,
  }],


  // Reload frames spend their defensive budget on AVOIDANCE rather than damage
  // taken. The old frame-level evasion grants (0.20 / 0.13) were very large;
  // these are a deliberate first-pass reduction — let simulation decide whether
  // avoidance needs to come back up.

  ['reload-light', {
    id: 'reload-light', name: 'Scout', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'All-in on mobility. Small clip (5 rounds), 1.2 s reload, and extra dodge — maximum uptime, minimum profile to hit.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.04,
      attackSpeedPct: 0.10, moveSpeedPct: 0.10, evasion: 0.07,
    },
    mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1200 } as Record<string, number>,
  }],

  ['reload-balanced', {
    id: 'reload-balanced', name: 'Marksman', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A steady burst fighter. Standard 10-round clip, 2.0 s reload, modest avoidance — tempo and staying power in balance.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.08,
      attackSpeedPct: 0.04, moveSpeedPct: 0.04, evasion: 0.04,
    },
    mechanicEffects: { 'reload.max-ammo': 10, 'reload.reload-time-ms': 2000 } as Record<string, number>,
  }],

  ['reload-heavy', {
    id: 'reload-heavy', name: 'Artillerist', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Slower but harder to put down. Large 20-round clip for sustained bursting, real armor for the first time on this chassis, but reloading takes 3 s — plan your downtime.',
    cost: 1, statEffects: {
      attackPct: 0.10, maxHpPct: 0.14, platingPct: 0.12,
      attackSpeedPct: -0.04, moveSpeedPct: -0.05,
    },
    mechanicEffects: { 'reload.max-ammo': 20, 'reload.reload-time-ms': 3000 } as Record<string, number>,
  }],


  ['energy-light', {
    id: 'energy-light', name: 'Spark', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Pure momentum. Blazing speed and rapid attacks; thrives on frequent discharges and their AoE splash. Gains 20 energy per hit, empowered at 1.5× — fires often.',
    cost: 1, statEffects: {
      attackPct: 0.07, maxHpPct: 0.03, attackSpeedPct: 0.12, moveSpeedPct: 0.12,
    },
    mechanicEffects: { 'energy.per-hit': 20, 'energy.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['energy-balanced', {
    id: 'energy-balanced', name: 'Wraith', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'Fast and capable. A bit of extra punch and some light armor without sacrificing mobility. Gains 14 energy per hit, empowered at 2×.',
    cost: 1, statEffects: {
      attackPct: 0.08, maxHpPct: 0.07, platingPct: 0.06,
      attackSpeedPct: 0.06, moveSpeedPct: 0.06,
    },
    mechanicEffects: { 'energy.per-hit': 14, 'energy.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['energy-heavy', {
    id: 'energy-heavy', name: 'Phantasm', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Measured power. A light class wearing heavier armor — durability and a sliver of damage reduction, traded against attack pace. Gains 10 energy per hit, empowered at 6× — builds slowly, hits very hard.',
    cost: 1, statEffects: {
      attackPct: 0.10, maxHpPct: 0.14, platingPct: 0.12,
      attackSpeedPct: -0.10, moveSpeedPct: -0.08, damageReduction: 0.02,
    },
    mechanicEffects: { 'energy.per-hit': 10, 'energy.empowered-mult': 6.0 } as Record<string, number>,
  }],


  // ── Tier 2: Per-class range nodes ─────────────────────────────────────────
  // POSITIONAL CONVERSION. Range changes how the existing chassis interacts
  // with distance; it does not rebuild the character.
  //
  //   Close → gives up distance as defense, so it takes the largest raw
  //           defensive compensation PLUS a class-specific defensive payoff.
  //   Mid   → the safe default: even all-around growth.
  //   Far   → minimal raw combat stats. Range, first-hit advantage and move
  //           speed are ALREADY forms of defense; the kiting payoff is the value.
  //
  // The Close package is deliberately NOT identical across classes. A naturally
  // light/ranged chassis needs more compensation to survive contact than a
  // heavy one that was designed to live there — Haunt gets +20% HP, Vanguard
  // only +10%, because Squire already fights in melee. Compensation restores
  // FUNCTION, never identity: a melee Spirit survives on HP, speed and its
  // barrier, and must not converge on a Squire.

  ['cadence-range-close', {
    id: 'cadence-range-close', name: 'In-Fighter', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. No reach at all, repaid with real bulk, armor, harder attacks and tighter healing pulses.',
    cost: 1, statEffects: {
      attackPct: 0.04, maxHpPct: 0.12, platingPct: 0.10, attackSpeedPct: 0.06,
    },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.recovery-pulse-pct': 0.10 } as Record<string, number>,
  }],
  ['cadence-range-mid', {
    id: 'cadence-range-mid', name: 'Lancer', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Increase your reach to the standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: {
      attackRange: 60,
      attackPct: 0.06, maxHpPct: 0.08, platingPct: 0.06,
      attackSpeedPct: 0.04, moveSpeedPct: 0.02,
    },
  }],
  ['cadence-range-far', {
    id: 'cadence-range-far', name: 'Phantom-Blade', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Minimal stat growth, but the reach and footspeed let you land hits before the enemy ever closes — distance as armor.',
    cost: 1, statEffects: {
      attackRange: 120,
      attackPct: 0.03, maxHpPct: 0.03, attackSpeedPct: 0.02, moveSpeedPct: 0.08,
    },
  }],

  ['cooldown-range-close', {
    id: 'cooldown-range-close', name: 'Vanguard', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    // Squire needs LESS close compensation than any other class: its root
    // chassis was already designed to stand in melee.
    description: 'Fight at point-blank range. Reduced reach, repaid with heavier armor and harder attacks — and your in-combat regen surges to a constant 30% of your enormous out-of-combat rate.',
    cost: 1, statEffects: {
      attackRange: -40,
      attackPct: 0.04, maxHpPct: 0.10, platingPct: 0.12, attackSpeedPct: 0.05,
    },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.recovery-active-pct': 0.20 } as Record<string, number>,
  }],
  ['cooldown-range-mid', {
    id: 'cooldown-range-mid', name: 'Phalanx', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: {
      attackRange: 60,
      attackPct: 0.06, maxHpPct: 0.08, platingPct: 0.08, attackSpeedPct: 0.03,
    },
  }],
  ['cooldown-range-far', {
    id: 'cooldown-range-far', name: 'Sentinel', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Minimal stat growth, but the reach and footspeed let a slow tank punish from afar — distance as armor.',
    cost: 1, statEffects: {
      attackRange: 120,
      attackPct: 0.03, maxHpPct: 0.03, platingPct: 0.03,
      attackSpeedPct: 0.02, moveSpeedPct: 0.06,
    },
  }],

  ['dot-range-close', {
    id: 'dot-range-close', name: 'Hexblade', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    // An Apprentice converted into a melee attrition/drain fighter — the HP
    // pool and the absorption payoff carry it, NOT heavy plating. It must not
    // read as a small Squire.
    description: 'Fight at point-blank range. Reduced reach, repaid with a much deeper HP pool and harder attacks — and your absorption pool deepens by 12%, turning you into a close-quarters drain-tank.',
    cost: 1, statEffects: {
      attackRange: -80,
      attackPct: 0.04, maxHpPct: 0.15, platingPct: 0.08, attackSpeedPct: 0.06,
    },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.absorb-pct': 0.12 } as Record<string, number>,
  }],
  ['dot-range-mid', {
    id: 'dot-range-mid', name: 'Warlock', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: {
      attackPct: 0.06, maxHpPct: 0.08, platingPct: 0.06,
      attackSpeedPct: 0.04, moveSpeedPct: 0.02,
    },
  }],
  ['dot-range-far', {
    id: 'dot-range-far', name: 'Harbinger', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Minimal stat growth, but the reach and footspeed let you apply stacks and retreat — distance as armor.',
    cost: 1, statEffects: {
      attackRange: 100,
      attackPct: 0.03, maxHpPct: 0.03, attackSpeedPct: 0.02, moveSpeedPct: 0.10,
    },
  }],

  ['reload-range-close', {
    id: 'reload-range-close', name: 'Breacher', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    // Melee survival comes from HP + evasion/evade-mitigation, deliberately not
    // from heavy plating — a Slinger in your face is still a Slinger.
    description: 'Fight at point-blank range. Reduced reach, repaid with a much larger HP pool and harder attacks — and your evasion sharpens: more dodges, and each one cuts deeper.',
    cost: 1, statEffects: {
      attackRange: -120, evasion: 0.10,
      attackPct: 0.04, maxHpPct: 0.18, platingPct: 0.05,
      attackSpeedPct: 0.06, moveSpeedPct: 0.02,
    },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.evade-mitigation': 0.10 } as Record<string, number>,
  }],
  ['reload-range-mid', {
    id: 'reload-range-mid', name: 'Enforcer', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: {
      attackPct: 0.06, maxHpPct: 0.08, platingPct: 0.03,
      attackSpeedPct: 0.04, moveSpeedPct: 0.04,
    },
  }],
  ['reload-range-far', {
    id: 'reload-range-far', name: 'Deadeye', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Minimal stat growth, but the reach and footspeed maximize your kiting buffer — distance as armor.',
    cost: 1, statEffects: {
      attackRange: 80,
      attackPct: 0.03, maxHpPct: 0.03, attackSpeedPct: 0.02, moveSpeedPct: 0.12,
    },
  }],

  ['energy-range-close', {
    id: 'energy-range-close', name: 'Haunt', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    // The largest HP compensation in the tree, because Spirit sacrifices the
    // most natural defensive value when forced into contact. It stays light
    // armor / high tempo / barrier-driven — never a Squire in disguise.
    description: 'Fight at point-blank range. Reduced reach, repaid with by far the deepest HP compensation in the tree — and your barrier swells to 40% of max HP, a deeper buffer to open each melee engagement with.',
    cost: 1, statEffects: {
      attackRange: -140,
      attackPct: 0.04, maxHpPct: 0.20, platingPct: 0.04,
      attackSpeedPct: 0.06, moveSpeedPct: 0.02,
    },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.barrier-pct': 0.10 } as Record<string, number>,
  }],
  ['energy-range-mid', {
    id: 'energy-range-mid', name: 'Shade', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: {
      attackPct: 0.06, maxHpPct: 0.08, platingPct: 0.03,
      attackSpeedPct: 0.04, moveSpeedPct: 0.04,
    },
  }],
  ['energy-range-far', {
    id: 'energy-range-far', name: 'Wisp', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Minimal stat growth, but the reach and footspeed buy the untouched seconds your barrier needs to recharge — distance as armor.',
    cost: 1, statEffects: {
      attackRange: 80,
      attackPct: 0.03, maxHpPct: 0.03, attackSpeedPct: 0.02, moveSpeedPct: 0.12,
    },
  }],

  // Summoner INVERTS the normal range logic. Close summons intercept and
  // protect the Conduit, so the Conduit itself keeps the smallest defensive
  // share; Far summons are fragile and distant and intercept almost nothing,
  // so the defensive budget stays on the Conduit instead.
  ['summoner-range-close', {
    id: 'summoner-range-close', name: 'Vigil', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your summons keep watch at your shoulder. Durable melee bodies provide the strongest interception, so each reconstruction is expensive. The Conduit keeps the smallest share of the defensive budget.',
    cost: 1, statEffects: {
      maxHpPct: 0.06, platingPct: 0.04,
    },
    mechanicEffects: {} as Record<string, number>,
  }],
  ['summoner-range-mid', {
    id: 'summoner-range-mid', name: 'Procession', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your summons move with you in ordered formation. Short-ranged bodies maintain a reliable orbit with moderate durability, interception, and reconstruction cost.',
    cost: 1, statEffects: {
      maxHpPct: 0.10, platingPct: 0.06, moveSpeedPct: 0.02,
    },
  }],
  ['summoner-range-far', {
    id: 'summoner-range-far', name: 'Harrier', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your summons are cast out ahead. Fragile ranged bodies kite at distance and offer little interception. Cheap bodies leave much more of the defensive budget on the Conduit.',
    cost: 1, statEffects: {
      maxHpPct: 0.18, platingPct: 0.12, moveSpeedPct: 0.10, damageReduction: 0.02,
    },
  }],
] satisfies [string, SkillNode][];
