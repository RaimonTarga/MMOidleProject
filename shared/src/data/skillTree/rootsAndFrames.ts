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
  // ── Tier 0: Class roots ────────────────────────────────────────────────────
  //
  // Roots UNCHANGED — they passed the T1 balance pass. Each establishes the
  // class mechanic and a baseline lean on the heavy ↔ light spectrum.
  //   cooldown > cadence > dot > reload > energy
  //
  // BALANCE-PASS PRINCIPLE FOR EVERYTHING BELOW:
  //   Every node adds a POSITIVE stat budget. The three options at each tier
  //   (light/bal/heavy; close/mid/far) ALLOCATE that budget differently —
  //   toward offense, balance, or defense — but NO option reduces eHP below
  //   what you had. The only stat any option may reduce is attack/move SPEED
  //   (a DPS/mobility lever), never eHP. This removes "tier-up feels like a
  //   downgrade" friction and keeps frames feeling like power gains.

  ['cadence-root', {
    id: 'cadence-root', name: 'Striker', tier: 0,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Find the rhythm of battle. Every few hits your attack surges with accumulated force. A balanced fighter — periodic bursts of healing sustain you through prolonged engagements.',
    cost: 1, statEffects: { attack: 12, maxHp: 30, plating: 2, damageReduction: 0.04, speed: 5 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.08, 'defense.regen-burst-interval-ms': 6000, 'defense.max-hit-pct': 0.25, 'defense.max-hit-mult': 0.5 } as Record<string, number>,
  }],


  ['cooldown-root', {
    id: 'cooldown-root', name: 'Squire', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike on a set cycle. Your heavy bearing brings substantial bulk and damage reduction, and 10% of your regen rate applies even while you fight.',
    cost: 1, statEffects: { attack: 14, maxHp: 50, plating: 3, damageReduction: 0.08, speed: -10 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.10 } as Record<string, number>,
  }],


  ['reload-root', {
    id: 'reload-root', name: 'Slinger', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Unleash a rapid clip then reload. Your speed is doubled and damage per shot halved as a fundamental multiplier — fights from range naturally and weaves around incoming blows.',
    cost: 1, statEffects: { attack: 18, maxHp: 24, attackSpeedPct: 0.20, attackRange: 120, evasion: 0.25, speed: 15 },
    mechanicEffects: { 'defense.kill-burst-pct': 0.05, 'defense.evade-mitigation': 0.20, 'reload.max-ammo': 10, 'reload.reload-time-ms': 2000, 'reload.acquire-radius-mult': 2.5 } as Record<string, number>,
  }],


  ['energy-root', {
    id: 'energy-root', name: 'Spirit', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Channel each blow into a building surge of power. Your light build fights from range and your energy feeds a periodic shield that absorbs the hits that do reach you.',
    cost: 1, statEffects: { attack: 11, maxHp: 10, attackSpeedPct: 0.25,  attackRange: 130, speed: 15 },
    mechanicEffects: { 'defense.shield-pct': 0.30, 'defense.shield-interval-ms': 10000, 'defense.shield-duration-ms': 10000 } as Record<string, number>,
  }],


  ['dot-root', {
    id: 'dot-root', name: 'Apprentice', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives. Your toxin-hardened body resists DoT damage by 18% and converts 10% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: { attack: 12, maxHp: 35, plating: 1, damageReduction: 0.04, hpRegen: 2, attackRange: 60, speed: 5 },
    mechanicEffects: { 'defense.dot-resistance': 0.18, 'defense.hit-to-dot-pct': 0.10 } as Record<string, number>,
  }],


  ['summoner-root', {
    id: 'summoner-root', name: 'Conduit', tier: 0,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: ['summoner-light', 'summoner-balanced', 'summoner-heavy'],
    description: 'Three slimes fight in your place, each striking with your full attack. Slimes leash to twice your attack range — extend your reach and they will too. Half of all damage you take is redirected to a random living slime.',
    cost: 1, statEffects: { attack: 10, maxHp: 20, attackRange: 150, speed: 5 },
    mechanicEffects: {
      'summoner.minion-count':           3,
      'summoner.minion-damage-pct':      1.0,
      'summoner.minion-hp-pct':          0.45,
      'summoner.minion-respawn-ms':      5000,
      'summoner.minion-range':           12,
      'summoner.minion-attack-cooldown': 1000,
      'summoner.damage-sponge-pct':      0.50,
      'summoner.leash-mult':             2.0,
    } as Record<string, number>,
  }],


  // ── Tier 1: Frames ─────────────────────────────────────────────────────────
  // NO-REGRESSION REBALANCE.
  //   Light  → budget into attack SPEED + attack; small POSITIVE HP gain; no
  //            plating/DR. Highest DPS, squishiest of the three (never below root).
  //   Balanced → the anchor (~100/100). Largely untouched.
  //   Heavy  → budget into HP (+modest plating/DR) and the big mechanic
  //            multiplier; pays ONLY with attack/move speed. Highest eHP,
  //            lowest sustained DPS, biggest burst.

  ['summoner-light', {
    id: 'summoner-light', name: 'Light Frame', tier: 1,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-root', children: ['summoner-light-t3-a', 'summoner-light-t3-b', 'summoner-light-t3-c'],
    description: 'Double your slime count. Each slime is half as large and deals half damage, spreading your pressure across a wider swarm and more redirect targets.',
    cost: 1, statEffects: { speed: 12 },
    mechanicEffects: {
      'summoner.minion-count-mult':  2.0,
      'summoner.minion-damage-mult': 0.5,
      'summoner.minion-size-mult':   0.5,
    } as Record<string, number>,
  }],

  ['summoner-balanced', {
    id: 'summoner-balanced', name: 'Medium Frame', tier: 1,
    classId: 'summoner-root', subVariantId: 'balanced',
    parent: 'summoner-root', children: ['summoner-balanced-t3-a', 'summoner-balanced-t3-b', 'summoner-balanced-t3-c'],
    description: 'Keep the baseline summoner pattern: three standard slimes with no count, damage, speed, or size tradeoff.',
    cost: 1, statEffects: { maxHp: 12 },
    mechanicEffects: {} as Record<string, number>,
  }],

  ['summoner-heavy', {
    id: 'summoner-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-root', children: ['summoner-heavy-t3-a', 'summoner-heavy-t3-b', 'summoner-heavy-t3-c'],
    description: 'Half as many slimes, but each is twice as large, twice as durable, and hits twice as hard. A durable bruiser minion makes the damage-sponge redirect far more reliable. Heavy summons move slower.',
    cost: 1, statEffects: { maxHp: 25 },
    mechanicEffects: {
      'summoner.minion-count-mult':  0.5,
      'summoner.minion-damage-mult': 2.0,
      'summoner.minion-speed-mult':  0.65,
      'summoner.minion-size-mult':   2.0,
      'summoner.minion-hp-mult':     1.5,
    } as Record<string, number>,
  }],


  ['cadence-light', {
    id: 'cadence-light', name: 'Flurry', tier: 1,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-root', children: [],
    description: 'Swift and agile. Trades raw bulk for a blistering attack pace. Empowered finisher triggers every 4 hits at 1.5× — frequency over raw power.',
    cost: 1, statEffects: { attack: 8, speed: 18, maxHp: 2, attackSpeedPct: 0.28 },
    mechanicEffects: { 'cadence.empowered-threshold': 4, 'cadence.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cadence-balanced', {
    id: 'cadence-balanced', name: 'Skirmisher', tier: 1,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-root', children: [],
    description: 'A measured approach. Modest gains across the board without committing to an extreme. Empowered finisher every 5 hits at 2×.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 1, hpRegen: 2 },
    mechanicEffects: { 'cadence.empowered-threshold': 5, 'cadence.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cadence-heavy', {
    id: 'cadence-heavy', name: 'Breaker', tier: 1,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-root', children: [],
    description: 'Endurance over speed. Significant bulk and recovery; pays for it in attack pace. Empowered finisher every 6 hits at 4× — patience rewarded with one enormous blow.',
    cost: 1, statEffects: { attack: 8, maxHp: 24, plating: 4, hpRegen: 5, damageReduction: 0.02, speed: -20, attackSpeedPct: -0.25 },
    mechanicEffects: { 'cadence.empowered-threshold': 6, 'cadence.empowered-mult': 4.0 } as Record<string, number>,
  }],


  ['cooldown-light', {
    id: 'cooldown-light', name: 'Warrior', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'The aggressive tank. Keeps its armored core but trades patience for a fast, hungry tempo. Execution recharges in 5 s at 1.5×.',
    cost: 1, statEffects: { attack: 12, speed: 22, maxHp: 6, attackSpeedPct: 0.25 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 5000, 'cooldown.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cooldown-balanced', {
    id: 'cooldown-balanced', name: 'Knight', tier: 1,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-root', children: [],
    description: 'A sturdy foundation. Substantial HP and armor amplify the class\'s defensive identity without tipping into immobility. Execution recharges in 7 s at 2×.',
    cost: 1, statEffects: { attack: 10, maxHp: 20, plating: 3, hpRegen: 5, damageReduction: 0.03, speed: -8 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 7000, 'cooldown.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cooldown-heavy', {
    id: 'cooldown-heavy', name: 'Bulwark', tier: 1,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-root', children: [],
    description: 'Fortress of patience. Maximum bulk makes you a wall — but you move like a boulder and attack even slower. Execution recharges in 9 s at 3×.',
    cost: 1, statEffects: { attack: 15, maxHp: 32, plating: 5, hpRegen: 7, damageReduction: 0.03, speed: -28, attackSpeedPct: -0.25 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 9000, 'cooldown.empowered-mult': 3.0 } as Record<string, number>,
  }],


  ['dot-light', {
    id: 'dot-light', name: 'Venom vessel', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Poison path. Apply wounds quickly and stay mobile. Up to 8 poison stacks — each hit converts 30% of your attack into lingering poison damage.',
    cost: 1, statEffects: { attack: 6, speed: 20, maxHp: 6, attackSpeedPct: 0.20 },
    mechanicEffects: { 'dot.max-stacks': 8, 'dot.conversion-pct': 0.30 } as Record<string, number>,
  }],

  ['dot-balanced', {
    id: 'dot-balanced', name: 'Ember mage', tier: 1,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-root', children: [],
    description: 'Fire path. A deliberate fighter. Up to 6 burn stacks — each hit converts 50% of your attack into damage over time.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 3, hpRegen: 3, speed: -5 },
    mechanicEffects: { 'dot.max-stacks': 6, 'dot.conversion-pct': 0.50 } as Record<string, number>,
  }],

  ['dot-heavy', {
    id: 'dot-heavy', name: 'Rime-Bound', tier: 1,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-root', children: [],
    description: 'Frost path. A war of attrition. Up to 3 frost stacks — each hit converts 70% of your attack into deep, lingering wounds.',
    cost: 1, statEffects: { attack: 10, maxHp: 32, plating: 6, hpRegen: 6, damageReduction: 0.06, speed: -28, attackSpeedPct: -0.20 },
    mechanicEffects: { 'dot.max-stacks': 3, 'dot.conversion-pct': 0.70 } as Record<string, number>,
  }],


  ['reload-light', {
    id: 'reload-light', name: 'Scout', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'All-in on mobility. Small clip (5 rounds), 1.2 s reload, and extra dodge — maximum uptime, minimum profile to hit.',
    cost: 1, statEffects: { attack: 10, speed: 18, maxHp: 4, attackSpeedPct: 0.18, evasion: 0.20 },
    mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1200 } as Record<string, number>,
  }],

  ['reload-balanced', {
    id: 'reload-balanced', name: 'Marksman', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A steady burst fighter. Standard 10-round clip, 2.0 s reload, modest avoidance — tempo and staying power in balance.',
    cost: 1, statEffects: { attack: 12, maxHp: 14, speed: 6, hpRegen: 2, evasion: 0.13 },
    mechanicEffects: { 'reload.max-ammo': 10, 'reload.reload-time-ms': 2000 } as Record<string, number>,
  }],

  ['reload-heavy', {
    id: 'reload-heavy', name: 'Artillerist', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Slower but harder to put down. Large 14-round clip for sustained bursting, but reloading takes 3 s — plan your downtime.',
    cost: 1, statEffects: { attack: 16, maxHp: 20, plating: 4, hpRegen: 4, speed: -10, attackSpeedPct: -0.05 },
    mechanicEffects: { 'reload.max-ammo': 14, 'reload.reload-time-ms': 3000 } as Record<string, number>,
  }],


  ['energy-light', {
    id: 'energy-light', name: 'Spark', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Pure momentum. Blazing speed and rapid attacks; thrives on frequent discharges and their AoE splash. Gains 20 energy per hit, empowered at 1.5× — fires often.',
    cost: 1, statEffects: { attack: 6, speed: 22, maxHp: 6, attackSpeedPct: 0.20 },
    mechanicEffects: { 'energy.per-hit': 20, 'energy.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['energy-balanced', {
    id: 'energy-balanced', name: 'Wraith', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'Fast and capable. A bit of extra punch and some light armor without sacrificing mobility. Gains 14 energy per hit, empowered at 2×.',
    cost: 1, statEffects: { attack: 6, speed: 10, attackSpeedPct: 0.10, maxHp: 5, plating: 1 },
    mechanicEffects: { 'energy.per-hit': 14, 'energy.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['energy-heavy', {
    id: 'energy-heavy', name: 'Phantasm', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Measured power. A light class wearing heavier armor — durability and a sliver of damage reduction, traded against attack pace. Gains 10 energy per hit, empowered at 6× — builds slowly, hits very hard.',
    cost: 1, statEffects: { attack: 4, maxHp: 18, plating: 2, hpRegen: 3, damageReduction: 0.02, speed: -10, attackSpeedPct: -0.25 },
    mechanicEffects: { 'energy.per-hit': 10, 'energy.empowered-mult': 6.0 } as Record<string, number>,
  }],


  // ── Tier 2: Per-class range nodes ─────────────────────────────────────────
  // BUDGET-SKEW MODEL (no regression). Every option is a positive tier upgrade.
  //   Mid   → neutral all-around growth (~+25% DPS / +25% eHP). The safe default.
  //   Close → forced melee (−40 range): you take every hit, so you get the MAX
  //           stat budget PLUS a class-specific defensive passive that doubles
  //           down on your identity.
  //   Far   → +range + move speed ("time shield" via avoidance): minimal raw
  //           stats, no penalties. The kiting payoff IS the value.
  // Balance lives in positioning, not raw stats — watch how much kiting reduces
  // incoming hits in playtest; that's the dial that makes Close/Far fair.

  ['cadence-range-close', {
    id: 'cadence-range-close', name: 'In-Fighter', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach, repaid with faster, harder attacks, real armor, and tighter healing pulses — every 4th hit feels sturdier as your recovery bursts swell.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.regen-burst-pct': 0.04 } as Record<string, number>,
  }],
  ['cadence-range-mid', {
    id: 'cadence-range-mid', name: 'Lancer', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['cadence-range-far', {
    id: 'cadence-range-far', name: 'Phantom-Blade', tier: 2,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Modest stat growth, but the reach and footspeed let you land hits before the enemy ever closes — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],

  ['cooldown-range-close', {
    id: 'cooldown-range-close', name: 'Vanguard', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach, repaid with faster, harder attacks and real armor — and your in-combat regen surges to a constant 30% of your enormous out-of-combat rate.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.in-combat-regen-pct': 0.20 } as Record<string, number>,
  }],
  ['cooldown-range-mid', {
    id: 'cooldown-range-mid', name: 'Phalanx', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['cooldown-range-far', {
    id: 'cooldown-range-far', name: 'Sentinel', tier: 2,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Modest stat growth, but the reach and footspeed let a slow tank punish from afar — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],

  ['dot-range-close', {
    id: 'dot-range-close', name: 'Hexblade', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach, repaid with faster, harder attacks and real armor — and your absorption pool deepens by 12%, turning you into a close-quarters drain-tank.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.absorb-pct': 0.12 } as Record<string, number>,
  }],
  ['dot-range-mid', {
    id: 'dot-range-mid', name: 'Warlock', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['dot-range-far', {
    id: 'dot-range-far', name: 'Harbinger', tier: 2,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Modest stat growth, but the reach and footspeed let you apply stacks and retreat — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],

  ['reload-range-close', {
    id: 'reload-range-close', name: 'Breacher', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach, repaid with faster, harder attacks and real armor — and your evasion sharpens: more dodges, and each one cuts deeper.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25, evasion: 0.10 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.evade-mitigation': 0.10 } as Record<string, number>,
  }],
  ['reload-range-mid', {
    id: 'reload-range-mid', name: 'Enforcer', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['reload-range-far', {
    id: 'reload-range-far', name: 'Deadeye', tier: 2,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Modest stat growth, but the reach and footspeed maximize your kiting buffer — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],

  ['energy-range-close', {
    id: 'energy-range-close', name: 'Haunt', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach, repaid with faster, harder attacks and real armor — and your energy shield swells to 40% of max HP to weather the constant melee pressure.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'defense.shield-pct': 0.10 } as Record<string, number>,
  }],
  ['energy-range-mid', {
    id: 'energy-range-mid', name: 'Shade', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['energy-range-far', {
    id: 'energy-range-far', name: 'Wisp', tier: 2,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Modest stat growth, but the reach and footspeed keep you safely behind your shield — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],

  ['summoner-range-close', {
    id: 'summoner-range-close', name: 'Close Range', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range alongside your slimes. Reduced reach, repaid with faster, harder attacks and real armor — and 60% of your incoming damage now redirects to your minions.',
    cost: 1, statEffects: { attackRange: -40, attack: 6, attackSpeedPct: 0.15, plating: 5, damageReduction: 0.06, maxHp: 25 },
    mechanicEffects: { 'shared.damage-mult': 0.10, 'summoner.damage-sponge-pct': 0.10 } as Record<string, number>,
  }],
  ['summoner-range-mid', {
    id: 'summoner-range-mid', name: 'Mid Range', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. Solid all-around growth with no commitment to either extreme.',
    cost: 1, statEffects: { attack: 4, attackSpeedPct: 0.10, maxHp: 18, plating: 2 },
  }],
  ['summoner-range-far', {
    id: 'summoner-range-far', name: 'Far Range', tier: 2,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: [],
    description: 'Direct your slimes from a substantial distance. Modest stat growth, but the reach and footspeed (and your slimes\' doubled leash) let your swarm engage well before anything reaches you — distance as armor.',
    cost: 1, statEffects: { attackRange: 120, speed: 30, attack: 2, maxHp: 8, attackSpeedPct: 0.05 },
  }],
] satisfies [string, SkillNode][];
