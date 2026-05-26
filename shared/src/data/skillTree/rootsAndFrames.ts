import type { SkillNode } from './types';

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
    cost: 1, statEffects: { attack: 8, maxHp: 18, plating: 2, damageReduction: 0.03 },
    mechanicEffects: { 'defense.regen-burst-pct': 0.08, 'defense.regen-burst-interval-ms': 10000 },
  }],

  ['cooldown-root', {
    id: 'cooldown-root', name: 'Cooldown', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike on a set cycle. Your heavy bearing brings substantial bulk and damage reduction, and 12% of your regen rate applies even while you fight.',
    cost: 1, statEffects: { attack: 6, maxHp: 28, plating: 3, damageReduction: 0.05, speed: -10 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.12 },
  }],

  ['reload-root', {
    id: 'reload-root', name: 'Reload', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Unleash a rapid clip then reload. Your speed is doubled and damage per shot halved as a fundamental multiplier — fights from range naturally and weaves around incoming blows.',
    cost: 1, statEffects: { speed: 12, maxHp: -8, attackRange: 105, evasion: 10 },
  }],

  ['energy-root', {
    id: 'energy-root', name: 'Energy', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Channel each blow into a building surge of power. Your light build fights from range and your energy feeds a periodic shield that absorbs the hits that do reach you.',
    cost: 1, statEffects: { attack: 5, speed: 14, attackCooldown: -200, maxHp: -5, attackRange: 115, plating: 1 },
    mechanicEffects: { 'defense.shield-pct': 0.06, 'defense.shield-interval-ms': 14000, 'defense.shield-duration-ms': 14000 },
  }],

  ['dot-root', {
    id: 'dot-root', name: 'DoT', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives. Your toxin-hardened body resists DoT damage by 12% and converts 10% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: { attack: 6, maxHp: 18, plating: 2, damageReduction: 0.03, hpRegen: 1, attackRange: 50 },
    mechanicEffects: { 'defense.dot-resistance': 0.12, 'defense.hit-to-dot-pct': 0.10 },
  }],

  // ── Tier 1: Sub-variants ───────────────────────────────────────────────────
  //
  // Frame choice amplifies the class's heaviness identity. Heavier classes get
  // larger heavy bonuses and steeper light penalties, and vice versa.
  //
  // cadence — neutral midpoint class ─────────────────────────────────────────

  ['cadence-light', {
    id: 'cadence-light', name: 'Light Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace. Empowered finisher triggers every 4 hits at 1.5× — frequency over raw power.',
    cost: 1, statEffects: { attack: 6, speed: 18, maxHp: -22, attackCooldown: -400 },
    mechanicEffects: { 'cadence.empowered-threshold': 4, 'cadence.empowered-mult': 1.5 },
  }],
  ['cadence-balanced', {
    id: 'cadence-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-root', children: [],
    description: 'A measured approach. Modest gains across the board without committing to an extreme. Empowered finisher every 5 hits at 2×.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 1, hpRegen: 2 },
    mechanicEffects: { 'cadence.empowered-threshold': 5, 'cadence.empowered-mult': 2.0 },
  }],
  ['cadence-heavy', {
    id: 'cadence-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-root', children: [],
    description: 'Endurance over speed. Significant bulk and recovery at the cost of mobility and attack pace. Empowered finisher every 6 hits at 4× — patience rewarded with power.',
    cost: 1, statEffects: { attack: 12, maxHp: 38, plating: 7, hpRegen: 5, damageReduction: 0.04, speed: -20, attackCooldown: 300 },
    mechanicEffects: { 'cadence.empowered-threshold': 6, 'cadence.empowered-mult': 4.0 },
  }],

  // cooldown — heaviest class ────────────────────────────────────────────────

  ['cooldown-light', {
    id: 'cooldown-light', name: 'Light Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'An unusual choice — stripping away the tank stats for speed creates a glass cannon who still carries some damage reduction but little else to survive on. Execution recharges in 5 s at 1.5×.',
    cost: 1, statEffects: { attack: 8, speed: 22, maxHp: -22, plating: -3, damageReduction: -0.02, attackCooldown: -300 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 5000, 'cooldown.empowered-mult': 1.5 },
  }],
  ['cooldown-balanced', {
    id: 'cooldown-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-root', children: [],
    description: 'A sturdy foundation. Substantial HP, armor, and added damage reduction amplify the class\'s defensive identity. Execution recharges in 7 s at 2×.',
    cost: 1, statEffects: { attack: 10, maxHp: 22, plating: 5, hpRegen: 5, damageReduction: 0.05, speed: -8 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 7000, 'cooldown.empowered-mult': 2.0 },
  }],
  ['cooldown-heavy', {
    id: 'cooldown-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-root', children: [],
    description: 'Fortress of patience. Maximum bulk and full 10% damage reduction make you a wall — but you move like a boulder and attack even slower. Execution recharges in 9 s at 3×.',
    cost: 1, statEffects: { attack: 15, maxHp: 42, plating: 7, hpRegen: 7, damageReduction: 0.08, speed: -28, attackCooldown: 450 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 9000, 'cooldown.empowered-mult': 3.0 },
  }],

  // dot — heavy-ish class ────────────────────────────────────────────────────

  ['dot-light', {
    id: 'dot-light', name: 'Light Frame (Poison)', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Poison path. Apply wounds quickly and stay mobile. Up to 8 poison stacks — each hit converts 30% of your attack into lingering poison damage.',
    cost: 1, statEffects: { attack: 6, speed: 20, maxHp: -22, plating: -2, attackCooldown: -300 },
    mechanicEffects: { 'dot.max-stacks': 8, 'dot.conversion-pct': 0.30 },
  }],
  ['dot-balanced', {
    id: 'dot-balanced', name: 'Balanced Frame (Fire)', tier: 1,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-root', children: [],
    description: 'Fire path. A deliberate fighter. Up to 6 burn stacks — each hit converts 50% of your attack into damage over time.',
    cost: 1, statEffects: { attack: 9, maxHp: 16, plating: 3, hpRegen: 3, speed: -5 },
    mechanicEffects: { 'dot.max-stacks': 6, 'dot.conversion-pct': 0.50 },
  }],
  ['dot-heavy', {
    id: 'dot-heavy', name: 'Heavy Frame (Frost)', tier: 1,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-root', children: [],
    description: 'Frost path. A war of attrition. Up to 3 frost stacks — each hit converts 70% of your attack into deep, lingering wounds.',
    cost: 1, statEffects: { attack: 10, maxHp: 32, plating: 6, hpRegen: 6, damageReduction: 0.06, speed: -28, attackCooldown: 400 },
    mechanicEffects: { 'dot.max-stacks': 3, 'dot.conversion-pct': 0.70 },
  }],

  // reload — light-ish class ─────────────────────────────────────────────────

  ['reload-light', {
    id: 'reload-light', name: 'Light Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'All-in on mobility. Small clip (5 rounds), 1.5 s reload, and extra dodge chance — maximum uptime, minimum profile to hit.',
    cost: 1, statEffects: { attack: 6, speed: 18, maxHp: -18, attackCooldown: -200, evasion: 5 },
    mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1500 },
  }],
  ['reload-balanced', {
    id: 'reload-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A steady burst fighter. Standard 8-round clip, 2.5 s reload, modest avoidance — tempo and staying power in balance.',
    cost: 1, statEffects: { attack: 9, maxHp: 10, speed: 6, hpRegen: 2, evasion: 3 },
    mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 2500 },
  }],
  ['reload-heavy', {
    id: 'reload-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Slower but harder to put down. Large 12-round clip for sustained bursting, but reloading takes 4 s — plan your downtime.',
    cost: 1, statEffects: { attack: 12, maxHp: 32, plating: 5, hpRegen: 4, speed: -12, attackCooldown: 200 },
    mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 4000 },
  }],

  // energy — lightest class ──────────────────────────────────────────────────

  ['energy-light', {
    id: 'energy-light', name: 'Light Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Pure momentum. Blazing speed and rapid attacks at the cost of any meaningful defense. Gains 20 energy per hit, empowered at 1.5× — fires often.',
    cost: 1, statEffects: { attack: 4, speed: 22, maxHp: -22, attackCooldown: -400 },
    mechanicEffects: { 'energy.per-hit': 20, 'energy.empowered-mult': 1.5 },
  }],
  ['energy-balanced', {
    id: 'energy-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'Fast and capable. A bit of extra punch and some light armor without sacrificing mobility. Gains 14 energy per hit, empowered at 2×.',
    cost: 1, statEffects: { attack: 6, speed: 10, attackCooldown: -200, maxHp: -5, plating: 1 },
    mechanicEffects: { 'energy.per-hit': 14, 'energy.empowered-mult': 2.0 },
  }],
  ['energy-heavy', {
    id: 'energy-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Measured power. A light class wearing heavier armor — modest durability and a sliver of damage reduction, without fully abandoning speed. Gains 10 energy per hit, empowered at 6× — builds slowly, hits very hard.',
    cost: 1, statEffects: { attack: 8, maxHp: 24, plating: 3, hpRegen: 3, damageReduction: 0.03, speed: -10, attackCooldown: 100 },
    mechanicEffects: { 'energy.per-hit': 10, 'energy.empowered-mult': 6.0 },
  }],

  // ── Tier 2: Universal range nodes ─────────────────────────────────────────
  //
  // Identical base node for ALL classes and sub-variants. Additional class-
  // specific bonuses for range-close are applied in recalculatePlayerStats.

  ['range-close', {
    id: 'range-close', name: 'Close Range', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Significantly reduced reach is offset by faster attacks, more damage, and the fortification that comes from fighting in the thick of it.',
    cost: 1, statEffects: { attackRange: -40, attack: 5, attackCooldown: -300, plating: 3, damageReduction: 0.06, maxHp: 12 },
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
    cost: 1, statEffects: { attackRange: 120, attack: -8, attackCooldown: 400 },
  }],
] satisfies [string, SkillNode][];
