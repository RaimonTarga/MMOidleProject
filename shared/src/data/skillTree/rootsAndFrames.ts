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
    if (unlockedSkills.includes('range-far') || unlockedSkills.includes('range-mid')) return false;
    if (unlockedSkills.includes('range-close')) return true;
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
  if (input.selectedRange === 'range-close') return false;
  if (input.selectedRange === 'range-mid' || input.selectedRange === 'range-far') return true;
  if (input.combatArchetype === 'reload' || input.combatArchetype === 'energy') return true;
  return input.attackRange > 100;
}

export const rootsAndFramesEntries = [
  // ── Tier 0: Class roots ────────────────────────────────────────────────────
  //
  // Each root establishes the class mechanic AND a baseline lean on the
  // heavy ↔ light spectrum. Order from heaviest to lightest:
  //   cooldown > cadence > dot > reload > energy
  // Frame choices at tier 1 then amplify this direction, scaled per-class.

  ['cadence-root', {
    id: 'cadence-root', name: 'Cadence', tier: 0,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Find the rhythm of battle. Every few hits your attack surges with accumulated force. A balanced fighter — periodic bursts of healing sustain you through prolonged engagements.',
    cost: 1, statEffects: { attack: 12, maxHp: 30, plating: 2, damageReduction: 0.04, speed: 5 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.06, 'defense.regen-burst-interval-ms': 5000 } as Record<string, number>,
  }],


  ['cooldown-root', {
    id: 'cooldown-root', name: 'Cooldown', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike on a set cycle. Your heavy bearing brings substantial bulk and damage reduction, and 12% of your regen rate applies even while you fight.',
    cost: 1, statEffects: { attack: 14, maxHp: 50, plating: 3, damageReduction: 0.08, speed: -10 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.12 } as Record<string, number>,
  }],


  ['reload-root', {
    id: 'reload-root', name: 'Reload', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Unleash a rapid clip then reload. Your speed is doubled and damage per shot halved as a fundamental multiplier — fights from range naturally and weaves around incoming blows.',
    cost: 1, statEffects: { attack: 4, maxHp: 20, attackSpeedPct: 0.15, attackRange: 120, evasion: 10, speed: 15 },
  }],


  ['energy-root', {
    id: 'energy-root', name: 'Energy', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Channel each blow into a building surge of power. Your light build fights from range and your energy feeds a periodic shield that absorbs the hits that do reach you.',
    cost: 1, statEffects: { attack: 11, maxHp: 10, attackSpeedPct: 0.25,  attackRange: 130, speed: 15 },
    mechanicEffects: { 'defense.shield-pct': 0.06, 'defense.shield-interval-ms': 14000, 'defense.shield-duration-ms': 14000 } as Record<string, number>,
  }],


  ['dot-root', {
    id: 'dot-root', name: 'DoT', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives. Your toxin-hardened body resists DoT damage by 12% and converts 10% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: { attack: 12, maxHp: 35, plating: 1, damageReduction: 0.04, hpRegen: 2, attackRange: 60, speed: 5 },
    mechanicEffects: { 'defense.dot-resistance': 0.12, 'defense.hit-to-dot-pct': 0.10 } as Record<string, number>,
  }],


  ['summoner-root', {
    id: 'summoner-root', name: 'Summoner', tier: 0,
    classId: 'summoner-root', subVariantId: null,
    parent: null, children: ['summoner-light', 'summoner-balanced', 'summoner-heavy'],
    description: 'Three slimes fight in your place, each striking with your full attack. Slimes leash to twice your attack range — extend your reach and they will too. Half of all damage you take is redirected to a random living slime.',
    cost: 1, statEffects: { attack: 10, maxHp: 20, attackRange: 150, speed: 5 },
    mechanicEffects: {
      'summoner.minion-count':           3,
      'summoner.minion-damage-pct':      1.0,
      'summoner.minion-hp-pct':          1.0,
      'summoner.minion-respawn-ms':      5000,
      'summoner.minion-range':           12,
      'summoner.minion-attack-cooldown': 1000,
      'summoner.damage-sponge-pct':      0.50,
      'summoner.leash-mult':             2.0,
    } as Record<string, number>,
  }],


  ['summoner-light', {
    id: 'summoner-light', name: 'Light Frame', tier: 1,
    classId: 'summoner-root', subVariantId: 'light',
    parent: 'summoner-root', children: ['summoner-light-t3-a', 'summoner-light-t3-b', 'summoner-light-t3-c'],
    description: 'Double your slime count. Each slime is half as large and deals half damage, spreading your pressure across a wider swarm.',
    cost: 1, statEffects: {},
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
    cost: 1, statEffects: {},
    mechanicEffects: {} as Record<string, number>,
  }],

  ['summoner-heavy', {
    id: 'summoner-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'summoner-root', subVariantId: 'heavy',
    parent: 'summoner-root', children: ['summoner-heavy-t3-a', 'summoner-heavy-t3-b', 'summoner-heavy-t3-c'],
    description: 'Half as many slimes, but each is twice as large and hits twice as hard. Heavy summons move slower than your baseline slimes.',
    cost: 1, statEffects: { maxHp: 40 },
    mechanicEffects: {
      'summoner.minion-count-mult':  0.5,
      'summoner.minion-damage-mult': 2.0,
      'summoner.minion-speed-mult':  0.65,
      'summoner.minion-size-mult':   2.0,
    } as Record<string, number>,
  }],


  ['cadence-light', {
    id: 'cadence-light', name: 'Light Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace. Empowered finisher triggers every 4 hits at 1.5× — frequency over raw power.',
    cost: 1, statEffects: { attack: 6, speed: 18, maxHp: -22, attackSpeedPct: 0.20 },
    mechanicEffects: { 'cadence.empowered-threshold': 4, 'cadence.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cadence-balanced', {
    id: 'cadence-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-root', children: [],
    description: 'A measured approach. Modest gains across the board without committing to an extreme. Empowered finisher every 5 hits at 2×.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 1, hpRegen: 2 },
    mechanicEffects: { 'cadence.empowered-threshold': 5, 'cadence.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cadence-heavy', {
    id: 'cadence-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-root', children: [],
    description: 'Endurance over speed. Significant bulk and recovery at the cost of mobility and attack pace. Empowered finisher every 6 hits at 4× — patience rewarded with power.',
    cost: 1, statEffects: { attack: 12, maxHp: 38, plating: 7, hpRegen: 5, damageReduction: 0.04, speed: -20, attackSpeedPct: -0.15 },
    mechanicEffects: { 'cadence.empowered-threshold': 6, 'cadence.empowered-mult': 4.0 } as Record<string, number>,
  }],


  ['cooldown-light', {
    id: 'cooldown-light', name: 'Light Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'An unusual choice — stripping away the tank stats for speed creates a glass cannon who still carries some damage reduction but little else to survive on. Execution recharges in 5 s at 1.5×.',
    cost: 1, statEffects: { attack: 8, speed: 22, maxHp: -22, plating: -3, damageReduction: -0.02, attackSpeedPct: 0.15 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 5000, 'cooldown.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['cooldown-balanced', {
    id: 'cooldown-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-root', children: [],
    description: 'A sturdy foundation. Substantial HP, armor, and added damage reduction amplify the class\'s defensive identity. Execution recharges in 7 s at 2×.',
    cost: 1, statEffects: { attack: 10, maxHp: 22, plating: 5, hpRegen: 5, damageReduction: 0.05, speed: -8 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 7000, 'cooldown.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['cooldown-heavy', {
    id: 'cooldown-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-root', children: [],
    description: 'Fortress of patience. Maximum bulk and full 10% damage reduction make you a wall — but you move like a boulder and attack even slower. Execution recharges in 9 s at 3×.',
    cost: 1, statEffects: { attack: 15, maxHp: 42, plating: 7, hpRegen: 7, damageReduction: 0.08, speed: -28, attackSpeedPct: -0.20 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 9000, 'cooldown.empowered-mult': 3.0 } as Record<string, number>,
  }],


  ['dot-light', {
    id: 'dot-light', name: 'Light Frame (Poison)', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Poison path. Apply wounds quickly and stay mobile. Up to 8 poison stacks — each hit converts 30% of your attack into lingering poison damage.',
    cost: 1, statEffects: { attack: 6, speed: 20, maxHp: -22, plating: -2, attackSpeedPct: 0.20 },
    mechanicEffects: { 'dot.max-stacks': 8, 'dot.conversion-pct': 0.30 } as Record<string, number>,
  }],

  ['dot-balanced', {
    id: 'dot-balanced', name: 'Balanced Frame (Fire)', tier: 1,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-root', children: [],
    description: 'Fire path. A deliberate fighter. Up to 6 burn stacks — each hit converts 50% of your attack into damage over time.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 3, hpRegen: 3, speed: -5 },
    mechanicEffects: { 'dot.max-stacks': 6, 'dot.conversion-pct': 0.50 } as Record<string, number>,
  }],

  ['dot-heavy', {
    id: 'dot-heavy', name: 'Heavy Frame (Frost)', tier: 1,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-root', children: [],
    description: 'Frost path. A war of attrition. Up to 3 frost stacks — each hit converts 70% of your attack into deep, lingering wounds.',
    cost: 1, statEffects: { attack: 10, maxHp: 32, plating: 6, hpRegen: 6, damageReduction: 0.06, speed: -28, attackSpeedPct: -0.20 },
    mechanicEffects: { 'dot.max-stacks': 3, 'dot.conversion-pct': 0.70 } as Record<string, number>,
  }],


  ['reload-light', {
    id: 'reload-light', name: 'Light Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'All-in on mobility. Small clip (5 rounds), 1.5 s reload, and extra dodge chance — maximum uptime, minimum profile to hit.',
    cost: 1, statEffects: { attack: 6, speed: 18, maxHp: -18, attackSpeedPct: 0.15, evasion: 5 },
    mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1500 } as Record<string, number>,
  }],

  ['reload-balanced', {
    id: 'reload-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A steady burst fighter. Standard 8-round clip, 2.5 s reload, modest avoidance — tempo and staying power in balance.',
    cost: 1, statEffects: { attack: 9, maxHp: 10, speed: 6, hpRegen: 2, evasion: 3 },
    mechanicEffects: { 'reload.max-ammo': 10, 'reload.reload-time-ms': 2500 } as Record<string, number>,
  }],

  ['reload-heavy', {
    id: 'reload-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Slower but harder to put down. Large 12-round clip for sustained bursting, but reloading takes 4 s — plan your downtime.',
    cost: 1, statEffects: { attack: 12, maxHp: 32, plating: 5, hpRegen: 4, speed: -12, attackSpeedPct: -0.10 },
    mechanicEffects: { 'reload.max-ammo': 20, 'reload.reload-time-ms': 4000 } as Record<string, number>,
  }],


  ['energy-light', {
    id: 'energy-light', name: 'Light Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Pure momentum. Blazing speed and rapid attacks at the cost of any meaningful defense. Gains 20 energy per hit, empowered at 1.5× — fires often.',
    cost: 1, statEffects: { attack: 4, speed: 22, maxHp: -22, attackSpeedPct: 0.20 },
    mechanicEffects: { 'energy.per-hit': 20, 'energy.empowered-mult': 1.5 } as Record<string, number>,
  }],

  ['energy-balanced', {
    id: 'energy-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'Fast and capable. A bit of extra punch and some light armor without sacrificing mobility. Gains 14 energy per hit, empowered at 2×.',
    cost: 1, statEffects: { attack: 6, speed: 10, attackSpeedPct: 0.10, maxHp: -5, plating: 1 },
    mechanicEffects: { 'energy.per-hit': 14, 'energy.empowered-mult': 2.0 } as Record<string, number>,
  }],

  ['energy-heavy', {
    id: 'energy-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Measured power. A light class wearing heavier armor — modest durability and a sliver of damage reduction, without fully abandoning speed. Gains 10 energy per hit, empowered at 6× — builds slowly, hits very hard.',
    cost: 1, statEffects: { attack: 8, maxHp: 24, plating: 3, hpRegen: 3, damageReduction: 0.03, speed: -10, attackSpeedPct: -0.05 },
    mechanicEffects: { 'energy.per-hit': 10, 'energy.empowered-mult': 6.0 } as Record<string, number>,
  }],


  ['range-close', {
    id: 'range-close', name: 'Close Range', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Significantly reduced reach is offset by faster attacks, more damage, and the fortification that comes from fighting in the thick of it.',
    cost: 1, statEffects: { attackRange: -40, attack: 5, attackSpeedPct: 0.15, plating: 3, damageReduction: 0.06, maxHp: 12 },
  }],


  ['range-mid', {
    id: 'range-mid', name: 'Mid Range', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. No tradeoffs — a neutral baseline.',
    cost: 1, statEffects: {},
  }],


  ['range-far', {
    id: 'range-far', name: 'Far Range', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a substantial distance. Major range extension at the cost of raw damage and attack speed — opponents may not even reach you.',
    cost: 1, statEffects: { attackRange: 120, attack: -8, attackSpeedPct: -0.20 },
  }],
] satisfies [string, SkillNode][];
