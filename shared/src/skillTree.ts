// ─── Skill tree types ─────────────────────────────────────────────────────────

/** The three sub-variants available within every class. */
export type SubVariant = 'light' | 'balanced' | 'heavy';

/** Stat deltas applied immediately and permanently when a node is unlocked. */
export interface StatEffects {
  attack?: number;
  plating?: number;
  /** Additive percentage reduction (0.0–1.0). e.g. 0.05 = 5% reduction per node. */
  damageReduction?: number;
  /** Evasion hit threshold. Set via skill nodes; lower is more frequent. */
  evasion?: number;
  attackRange?: number;
  /** Negative value reduces cooldown (faster attacks). Clamped on apply to ≥200ms. */
  attackCooldown?: number;
  maxHp?: number;
  hpRegen?: number;
  speed?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  /**
   * Progression tier:
   *   0 = class root (choose your mechanic)
   *   1 = sub-variant (light / balanced / heavy)
   *   2 = range (close / mid / far — universal, same for all paths)
   *   3 = path modifier (3 choices per path — different per class+subvariant)
   *   4–7 = path-locked progression nodes (3 choices each)
   */
  tier: number;
  /**
   * Which class root this node belongs to.
   * null for tier-2 universal range nodes (accessible regardless of class).
   */
  classId: string | null;
  /**
   * Which sub-variant this node targets.
   * null for tier-0 class roots and tier-2 universal range nodes.
   * For tier 1, identifies which sub-variant this node IS.
   * For tier 3+, used as the path lock key alongside classId.
   */
  subVariantId: SubVariant | null;
  /** Cosmetic only — not used for unlock logic. */
  parent: string | null;
  /** Cosmetic only — not used for unlock logic. */
  children: string[];
  /** Numeric stat deltas applied on unlock and rebuilt by recalculatePlayerStats. */
  statEffects: StatEffects;
  /**
   * Named mechanic modifiers accumulated into player.passives on unlock.
   * Keys are archetype-specific identifiers checked by the relevant server system.
   * e.g. { 'cadence.threshold-mod': -2 } reduces the cadence finisher threshold by 2.
   * Values are summed across all unlocked nodes, so each node contributes its share.
   */
  mechanicEffects?: Record<string, number>;
}

// ─── Tree data ────────────────────────────────────────────────────────────────
//
// Tier layout:
//   0 — 5 class roots        (choose mechanic)
//   1 — 15 sub-variant nodes (3 per class: light / balanced / heavy)
//   2 — 3 universal range nodes (close / mid / far — same for ALL paths)
//   3 — 15 path modifier nodes (one per class+subvariant path)
//   4–7 — 45 nodes per tier (15 paths × 3 choices each), generated below
//
// Tiers 8–9 reserved for expansion — add nodes to SKILL_TREE when ready.

export const SKILL_TREE: Map<string, SkillNode> = new Map<string, SkillNode>([

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
    mechanicEffects: { 'defense.regen-burst-pct': 0.08, 'defense.regen-burst-interval-ms': 10000 } as Record<string, number>,
  }],

  ['cooldown-root', {
    id: 'cooldown-root', name: 'Cooldown', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike on a set cycle. Your heavy bearing brings substantial bulk and damage reduction, and 12% of your regen rate applies even while you fight.',
    cost: 1, statEffects: { attack: 6, maxHp: 28, plating: 3, damageReduction: 0.05, speed: -10 },
    mechanicEffects: { 'defense.in-combat-regen-pct': 0.12 } as Record<string, number>,
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
    mechanicEffects: { 'defense.shield-pct': 0.06, 'defense.shield-interval-ms': 14000, 'defense.shield-duration-ms': 14000 } as Record<string, number>,
  }],

  ['dot-root', {
    id: 'dot-root', name: 'DoT', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives. Your toxin-hardened body resists DoT damage by 12% and converts 10% of incoming direct hits into delayed damage you can outlast.',
    cost: 1, statEffects: { attack: 6, maxHp: 18, plating: 2, damageReduction: 0.03, hpRegen: 1, attackRange: 50 },
    mechanicEffects: { 'defense.dot-resistance': 0.12, 'defense.hit-to-dot-pct': 0.10 } as Record<string, number>,
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
    cost: 1, statEffects: { attack: 12, maxHp: 38, plating: 7, hpRegen: 5, damageReduction: 0.04, speed: -20, attackCooldown: 300 },
    mechanicEffects: { 'cadence.empowered-threshold': 6, 'cadence.empowered-mult': 4.0 } as Record<string, number>,
  }],

  // cooldown — heaviest class ────────────────────────────────────────────────

  ['cooldown-light', {
    id: 'cooldown-light', name: 'Light Frame', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'An unusual choice — stripping away the tank stats for speed creates a glass cannon who still carries some damage reduction but little else to survive on. Execution recharges in 5 s at 1.5×.',
    cost: 1, statEffects: { attack: 8, speed: 22, maxHp: -22, plating: -3, damageReduction: -0.02, attackCooldown: -300 },
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
    cost: 1, statEffects: { attack: 15, maxHp: 42, plating: 7, hpRegen: 7, damageReduction: 0.08, speed: -28, attackCooldown: 450 },
    mechanicEffects: { 'cooldown.empowered-cd-ms': 9000, 'cooldown.empowered-mult': 3.0 } as Record<string, number>,
  }],

  // dot — heavy-ish class ────────────────────────────────────────────────────

  ['dot-light', {
    id: 'dot-light', name: 'Light Frame (Poison)', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Poison path. Apply wounds quickly and stay mobile. Up to 8 poison stacks — each hit converts 30% of your attack into lingering poison damage.',
    cost: 1, statEffects: { attack: 6, speed: 20, maxHp: -22, plating: -2, attackCooldown: -300 },
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
    cost: 1, statEffects: { attack: 10, maxHp: 32, plating: 6, hpRegen: 6, damageReduction: 0.06, speed: -28, attackCooldown: 400 },
    mechanicEffects: { 'dot.max-stacks': 3, 'dot.conversion-pct': 0.70 } as Record<string, number>,
  }],

  // reload — light-ish class ─────────────────────────────────────────────────

  ['reload-light', {
    id: 'reload-light', name: 'Light Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'All-in on mobility. Small clip (5 rounds), 1.5 s reload, and extra dodge chance — maximum uptime, minimum profile to hit.',
    cost: 1, statEffects: { attack: 6, speed: 18, maxHp: -18, attackCooldown: -200, evasion: 5 },
    mechanicEffects: { 'reload.max-ammo': 5, 'reload.reload-time-ms': 1500 } as Record<string, number>,
  }],
  ['reload-balanced', {
    id: 'reload-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A steady burst fighter. Standard 8-round clip, 2.5 s reload, modest avoidance — tempo and staying power in balance.',
    cost: 1, statEffects: { attack: 9, maxHp: 10, speed: 6, hpRegen: 2, evasion: 3 },
    mechanicEffects: { 'reload.max-ammo': 8, 'reload.reload-time-ms': 2500 } as Record<string, number>,
  }],
  ['reload-heavy', {
    id: 'reload-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Slower but harder to put down. Large 12-round clip for sustained bursting, but reloading takes 4 s — plan your downtime.',
    cost: 1, statEffects: { attack: 12, maxHp: 32, plating: 5, hpRegen: 4, speed: -12, attackCooldown: 200 },
    mechanicEffects: { 'reload.max-ammo': 12, 'reload.reload-time-ms': 4000 } as Record<string, number>,
  }],

  // energy — lightest class ──────────────────────────────────────────────────

  ['energy-light', {
    id: 'energy-light', name: 'Light Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Pure momentum. Blazing speed and rapid attacks at the cost of any meaningful defense. Gains 20 energy per hit, empowered at 1.5× — fires often.',
    cost: 1, statEffects: { attack: 4, speed: 22, maxHp: -22, attackCooldown: -400 },
    mechanicEffects: { 'energy.per-hit': 20, 'energy.empowered-mult': 1.5 } as Record<string, number>,
  }],
  ['energy-balanced', {
    id: 'energy-balanced', name: 'Balanced Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'Fast and capable. A bit of extra punch and some light armor without sacrificing mobility. Gains 14 energy per hit, empowered at 2×.',
    cost: 1, statEffects: { attack: 6, speed: 10, attackCooldown: -200, maxHp: -5, plating: 1 },
    mechanicEffects: { 'energy.per-hit': 14, 'energy.empowered-mult': 2.0 } as Record<string, number>,
  }],
  ['energy-heavy', {
    id: 'energy-heavy', name: 'Heavy Frame', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Measured power. A light class wearing heavier armor — modest durability and a sliver of damage reduction, without fully abandoning speed. Gains 10 energy per hit, empowered at 6× — builds slowly, hits very hard.',
    cost: 1, statEffects: { attack: 8, maxHp: 24, plating: 3, hpRegen: 3, damageReduction: 0.03, speed: -10, attackCooldown: 100 },
    mechanicEffects: { 'energy.per-hit': 10, 'energy.empowered-mult': 6.0 } as Record<string, number>,
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

  // ── Tier 3: Path modifiers (cadence-light — fully implemented) ────────────
  //
  // Three choices per path (class × sub-variant = 15 paths × 3 = 45 nodes).
  // cadence-light is the first path with real mechanical options; all others
  // are placeholder (to be designed). mechanicEffects values accumulate into
  // player.passives and are read by the relevant archetype system at runtime.

  ['cadence-light-t3-a', {
    id: 'cadence-light-t3-a', name: 'Accelerando', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Each cadence finisher grants a stack of attack speed (up to 5 stacks). Stacks are lost on death or re-equip.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.speed-stack': 1 } as Record<string, number>,
  }],
  ['cadence-light-t3-b', {
    id: 'cadence-light-t3-b', name: 'Cursed Finale', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your cadence finisher curses the target: increases their damage taken by 25% for 5 seconds, and permanently reduces their flat plating by 5 (stacks with no cap). The triggering finisher itself benefits from the vulnerability.',
    cost: 1, statEffects: {},
    // NOTE: 'cadence.debuff-plating-shred' is currently a static flat value (-5 per stack).
    // This is intentionally simple for now but likely needs to scale with player stats
    // or monster level in later tiers to remain relevant. Change the value here when scaling is designed.
    mechanicEffects: {
      'cadence.debuff-vuln-pct': 25,
      'cadence.debuff-vuln-ms':  5000,
      'cadence.debuff-plating-shred': 5,
    } as Record<string, number>,
  }],
  ['cadence-light-t3-c', {
    id: 'cadence-light-t3-c', name: 'Double Time', tier: 3,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-light', children: [],
    description: 'Your cadence finisher strikes twice. Both hits apply the full damage multiplier.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.trigger-count': 2 } as Record<string, number>,
  }],

  // ── Tier 3: Cadence — Balanced ─────────────────────────────────────────────

  ['cadence-balanced-t3-a', {
    id: 'cadence-balanced-t3-a', name: 'Rapid Tempo', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Shortens your combo sequence by 2, letting you reach the finisher more often.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.threshold-mod': -2 } as Record<string, number>,
  }],
  ['cadence-balanced-t3-b', {
    id: 'cadence-balanced-t3-b', name: 'Rising Tide', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Each attack building toward the finisher amplifies it by 20%. After a finisher, your next 5 attacks deal 50% bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.momentum-buildup': 0.20, 'cadence.momentum-echo': 5 } as Record<string, number>,
  }],
  ['cadence-balanced-t3-c', {
    id: 'cadence-balanced-t3-c', name: 'Delayed Verdict', tier: 3,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-balanced', children: [],
    description: 'Your finisher tags the enemy with a detonation charge. After 3 seconds it explodes for damage equal to the sum of the attacks that built up to the finisher. Re-tagging resets the fuse.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.detonation': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Cadence — Heavy ────────────────────────────────────────────────

  ['cadence-heavy-t3-a', {
    id: 'cadence-heavy-t3-a', name: 'Overwhelming Force', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Your combo sequence requires 2 more attacks, but the finisher deals 200% damage (3× multiplier instead of 2×).',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.threshold-mod': 2, 'cadence.damage-mult-add': 1 } as Record<string, number>,
  }],
  ['cadence-heavy-t3-b', {
    id: 'cadence-heavy-t3-b', name: 'Hemorrhage', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Your finisher converts all its damage into a bleeding wound: a non-stacking damage-over-time effect dealing 150% of the finisher damage over 4 seconds. Re-triggering refreshes the wound.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.hemorrhage': 1 } as Record<string, number>,
  }],
  ['cadence-heavy-t3-c', {
    id: 'cadence-heavy-t3-c', name: 'Iron Patience', tier: 3,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-heavy', children: [],
    description: 'Each attack building the sequence stores 30% of its damage as potential energy. Your finisher consumes all stored charge, adding it as bonus damage — the longer the buildup, the heavier the blow.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cadence.charge-buildup': 0.30 } as Record<string, number>,
  }],

  // ── Tier 3: Cooldown — Light ──────────────────────────────────────────────────

  ['cooldown-light-t3-a', {
    id: 'cooldown-light-t3-a', name: 'Overdrive', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution strikes no harder than usual — instead, it triggers a burst of speed: 50% faster attacks for 2.5 s. Roughly half-uptime by default. Pending balance.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.overdrive': 1 } as Record<string, number>,
  }],
  ['cooldown-light-t3-b', {
    id: 'cooldown-light-t3-b', name: 'Eternal Cycle', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution cycle stretches to 10 s, but each attack builds charge that increases attack damage while active (falls off after 10 s idle). The execution deals no inherent multiplier — instead it deals attack × stacks, then resets the charge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.eternal-cycle': 1, 'cooldown.empowered-cd-ms': 5000 } as Record<string, number>,
  }],
  ['cooldown-light-t3-c', {
    id: 'cooldown-light-t3-c', name: 'Temporal Extension', tier: 3,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-light', children: [],
    description: 'Your execution deals no extra damage. Instead it grants a buff that adds flat on-hit damage to every attack. Each attack extends the buff by 1 second — keep fighting to keep it alive.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.temporal-extension': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Cooldown — Balanced ───────────────────────────────────────────────

  ['cooldown-balanced-t3-a', {
    id: 'cooldown-balanced-t3-a', name: 'Acceleration', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'Each attack shaves 1 second off your execution cooldown. Your timing still matters — the reduction is real, not a reset.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.acceleration-ms': 1000 } as Record<string, number>,
  }],
  ['cooldown-balanced-t3-b', {
    id: 'cooldown-balanced-t3-b', name: 'Battery', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'Every second your execution cooldown ticks down, you gain a stack of accumulated power that increases attack damage. The execution spends all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.battery': 1 } as Record<string, number>,
  }],
  ['cooldown-balanced-t3-c', {
    id: 'cooldown-balanced-t3-c', name: 'Alignment', tier: 3,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-balanced', children: [],
    description: 'After your execution fires, a 2-second attack speed surge follows (+50%). When that window closes, the remaining cooldown is halved — creating a fast-slow-fast rhythm unique to this path.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.alignment': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Reload — Light ───────────────────────────────────────────────────

  ['reload-light-t3-a', {
    id: 'reload-light-t3-a', name: 'Exploding Clip', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The last bullet in every clip explodes outward for 3× damage. A high spike on an already aggressive rhythm.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.exploding-clip': 1 } as Record<string, number>,
  }],
  ['reload-light-t3-b', {
    id: 'reload-light-t3-b', name: 'Preemptive Strike', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'The first bullet in every fresh clip is loaded with extra force — dealing 2.5× damage before the fight has even settled in.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.preemptive-strike': 1 } as Record<string, number>,
  }],
  ['reload-light-t3-c', {
    id: 'reload-light-t3-c', name: 'High Powered', tier: 3,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-light', children: [],
    description: 'Tight 3-round clip, but each empty chamber adds 50% more damage to the next shot. Shot 1 is normal. Shot 2 hits 50% harder. Shot 3 hits 100% harder.',
    cost: 1, statEffects: {},
    // reload.max-ammo is additive: light frame gives +5, this node gives -2 → net 3 rounds.
    mechanicEffects: { 'reload.high-powered': 1, 'reload.max-ammo': -2 } as Record<string, number>,
  }],

  // ── Tier 3: Reload — Balanced ─────────────────────────────────────────────────

  ['reload-balanced-t3-a', {
    id: 'reload-balanced-t3-a', name: 'Death Mark', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each attack applies a Death Mark stack to the target (up to 10). Reloading detonates all stacks on the current target for attack × stacks × 0.5 bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.death-mark': 1 } as Record<string, number>,
  }],
  ['reload-balanced-t3-b', {
    id: 'reload-balanced-t3-b', name: 'Continuous Firing', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'Each attack builds up to 4 reload speed stacks (200 ms each, reset on reload). Reloading also grants a 30% attack damage buff for 3 s.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.cont-firing': 1 } as Record<string, number>,
  }],
  ['reload-balanced-t3-c', {
    id: 'reload-balanced-t3-c', name: 'Finishing Strike', tier: 3,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-balanced', children: [],
    description: 'The last bullet in every clip scales with the target\'s missing HP. 1.5× at full health, rising to 3× at 90% missing. An execution mechanic that rewards letting enemies bleed low.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.finishing-strike': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Reload — Heavy ────────────────────────────────────────────────────

  ['reload-heavy-t3-a', {
    id: 'reload-heavy-t3-a', name: 'Momentum', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Each attack builds momentum (up to 8 stacks): +5% attack damage and +3% attack speed per stack. Reloading resets everything.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.momentum': 1 } as Record<string, number>,
  }],
  ['reload-heavy-t3-b', {
    id: 'reload-heavy-t3-b', name: 'Heat', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'Attacks deal 30% less damage but apply Heat stacks (up to clip size) that tick 15% attack damage per second per stack. Reloading detonates all stacks for attack × stacks × 0.5 bonus damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.heat': 1 } as Record<string, number>,
  }],
  ['reload-heavy-t3-c', {
    id: 'reload-heavy-t3-c', name: 'Burst', tier: 3,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-heavy', children: [],
    description: 'After every reload, gain damage stacks equal to clip size (+15% per stack). Each attack converts one into a speed stack instead. Both bonuses expire when all stacks are spent.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'reload.burst': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Cooldown — Heavy ──────────────────────────────────────────────────

  ['cooldown-heavy-t3-a', {
    id: 'cooldown-heavy-t3-a', name: 'Entropy Collapse', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution deals no direct damage. Instead it inflicts a wound that ticks every second for 8 s. Each tick scales with the target\'s missing health — the weaker they are, the harder it burns. 4× multiplier at 90% missing HP.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.entropy-collapse': 1 } as Record<string, number>,
  }],
  ['cooldown-heavy-t3-b', {
    id: 'cooldown-heavy-t3-b', name: 'Singular Extraction', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Normal attacks deal no damage. Your execution fires on a greatly shortened cooldown and hits for significantly more. Leaving combat for 4 s resets your preparation — patience earns nothing here.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.singular-extraction': 1, 'cooldown.empowered-cd-ms': -6000 } as Record<string, number>,
  }],
  ['cooldown-heavy-t3-c', {
    id: 'cooldown-heavy-t3-c', name: 'Channeled Beam', tier: 3,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-heavy', children: [],
    description: 'Your execution becomes a 3-second concentrated channel: you stand still and continuously deal damage to your target. If the target dies mid-channel, you briefly attempt to reacquire before the beam ends.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'cooldown.channeled-beam': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Energy — Light ────────────────────────────────────────────────────

  ['energy-light-t3-a', {
    id: 'energy-light-t3-a', name: 'The Accumulator', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Reaching max energy no longer fires a discharge. Energy constantly drains over time. Each hit grants a stacking attack damage buff, but each stack accelerates the drain. Reaching 0 energy resets all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.accumulator': 1 } as Record<string, number>,
  }],
  ['energy-light-t3-b', {
    id: 'energy-light-t3-b', name: 'Micro-Venting', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'The max-energy discharge is disabled. While your energy pool is above 50%, each basic attack consumes a portion of energy to deal flat bonus on-hit damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.micro-venting': 1 } as Record<string, number>,
  }],
  ['energy-light-t3-c', {
    id: 'energy-light-t3-c', name: 'Polarity Decay', tier: 3,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-light', children: [],
    description: 'Reaching max energy triggers a reduced-damage discharge that clears the pool and grants 5 temporary overcharge stacks. Basic attacks consume stacks for flat bonus damage before they decay.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.polarity-decay': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Energy — Balanced ─────────────────────────────────────────────────

  ['energy-balanced-t3-a', {
    id: 'energy-balanced-t3-a', name: 'Alternating Currents', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Automatically loops between two phases: Charge (doubled energy gain, +20% attack damage) and Discharge (energy drains over 3 s dealing passive tick damage, +50% attack speed).',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.alternating-currents': 1 } as Record<string, number>,
  }],
  ['energy-balanced-t3-b', {
    id: 'energy-balanced-t3-b', name: 'Harmonic Equilibrium', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Grants +60% damage to all hits, but only while the natural energy cycle keeps the pool strictly between 40% and 60%. Both too empty and too full breaks the bonus.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.harmonic-equilibrium': 1 } as Record<string, number>,
  }],
  ['energy-balanced-t3-c', {
    id: 'energy-balanced-t3-c', name: 'Capacitor Shunt', tier: 3,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-balanced', children: [],
    description: 'Energy generation is split 50/50 between the active bar and a persistent reservoir (cap 500). The discharge fires normally at max energy, but its damage is amplified by the total power in the reservoir.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.capacitor-shunt': 1 } as Record<string, number>,
  }],

  // ── Tier 3: Energy — Heavy ────────────────────────────────────────────────────

  ['energy-heavy-t3-a', {
    id: 'energy-heavy-t3-a', name: 'Singularity Execute', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Doubles max energy capacity. Energy generation accelerates the fuller the pool. If a basic hit detects the target\'s health is lower than the discharge\'s projected damage, it triggers an immediate early discharge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.singularity-execute': 1 } as Record<string, number>,
  }],
  ['energy-heavy-t3-b', {
    id: 'energy-heavy-t3-b', name: 'Cascading Induction', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Basic attacks deal 1 damage but plant Induction tags on the target (15 s duration). The discharge consumes all active tags and deals exponentially scaling burst damage based on the tag count.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.cascading-induction': 1 } as Record<string, number>,
  }],
  ['energy-heavy-t3-c', {
    id: 'energy-heavy-t3-c', name: 'Superconducting Mass', tier: 3,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-heavy', children: [],
    description: 'Basic attacks deal no damage but accumulate raw attack power into a charge pool. On discharge, applies your empowered multiplier to the base hit, then adds the entire stored charge as bonus true damage bypassing all defenses. The pool resets on each discharge.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'energy.superconducting-mass': 1 } as Record<string, number>,
  }],

  // ── Tier 3: DoT — Light (Poison) ─────────────────────────────────────────────

  ['dot-light-t3-a', {
    id: 'dot-light-t3-a', name: 'Poison Explosion', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison can stack up to 20. Reaching 20 stacks detonates them all instantly, dealing the equivalent of 10 full ticks of damage in a single burst, then clearing all stacks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.poison-explosion': 1 } as Record<string, number>,
  }],
  ['dot-light-t3-b', {
    id: 'dot-light-t3-b', name: 'Eternal Doom', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'Your poison has no stack limit. The first 8 stacks deal full damage per tick. Each additional stack beyond 8 adds damage at 50% effectiveness, naturally plateauing around 30–40 stacks. Rewards long, sustained fights.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.eternal-doom': 1 } as Record<string, number>,
  }],
  ['dot-light-t3-c', {
    id: 'dot-light-t3-c', name: 'Invigorating Toxins', tier: 3,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-light', children: [],
    description: 'While attacking a poisoned enemy, you gain +2 flat attack damage and +2% attack speed per poison stack on the target. The bonus updates continuously and drops immediately when you switch targets.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.invigorating-toxins': 1 } as Record<string, number>,
  }],

  // ── Tier 3: DoT — Balanced (Fire) ────────────────────────────────────────────

  ['dot-balanced-t3-a', {
    id: 'dot-balanced-t3-a', name: 'Fan the Flames', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each hit applies 2 burn stacks instead of 1, but each stack deals 50% of normal tick damage. Hitting a target already at max stacks deals bonus direct damage equal to 3× the max-stack DoT damage.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.fan-the-flames': 1 } as Record<string, number>,
  }],
  ['dot-balanced-t3-b', {
    id: 'dot-balanced-t3-b', name: 'Smoldering Ember', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'Each burn stack also applies a smolder debuff that increases all damage the target takes by 3% per stack, up to 18% at max stacks. Affects both your direct hits and your burn ticks.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.smoldering-ember': 1 } as Record<string, number>,
  }],
  ['dot-balanced-t3-c', {
    id: 'dot-balanced-t3-c', name: 'Conflagration', tier: 3,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-balanced', children: [],
    description: 'When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: a single intense burn that delivers the same total damage in half the time at double the tick rate. Cannot stack further while Conflagration burns.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.conflagration': 1 } as Record<string, number>,
  }],

  // ── Tier 3: DoT — Heavy (Frost) ──────────────────────────────────────────────

  ['dot-heavy-t3-a', {
    id: 'dot-heavy-t3-a', name: 'Permafrost', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Your frost is limited to 1 stack, but it ramps up each tick: starting at 3 damage and increasing by 3 per tick, capped at 35. The ramp persists as long as the monster lives. Rewards staying on a single target.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.permafrost': 1 } as Record<string, number>,
  }],
  ['dot-heavy-t3-b', {
    id: 'dot-heavy-t3-b', name: 'Freezing Cold', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Each frost stack also applies a Chill stack (up to 3). Each Chill reduces the target\'s movement and attack speed by 12%. At 3 Chill stacks, the target is Frozen for 2 seconds and takes 35% bonus damage from all sources.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.freezing-cold': 1 } as Record<string, number>,
  }],
  ['dot-heavy-t3-c', {
    id: 'dot-heavy-t3-c', name: 'Glacial Fracture', tier: 3,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-heavy', children: [],
    description: 'Your frost stacks make the target brittle. When you hit a target already at max frost stacks, all stacks shatter: deal bonus burst damage equal to maxStacks² × damage-per-stack, clear the stacks, then apply 1 fresh stack. Creates a build-then-shatter rhythm.',
    cost: 1, statEffects: {},
    mechanicEffects: { 'dot.glacial-fracture': 1 } as Record<string, number>,
  }],

]);

// ── Generated placeholder nodes ────────────────────────────────────────────────
//
// Tiers 4–7: all 15 paths × 3 choices per tier = 180 nodes.
// IDs: {class}-{subVariant}-t{tier}-{a|b|c}
// Tier 3 is fully hand-authored above for all classes.
//
// Tiers 8–9 are reserved for expansion — add nodes here when ready.

const CLASSES = ['cadence', 'cooldown', 'reload', 'energy', 'dot'] as const;
const SUB_VARIANTS: SubVariant[] = ['light', 'balanced', 'heavy'];
const CHOICES = ['a', 'b', 'c'] as const;

for (const cls of CLASSES) {
  const classId = `${cls}-root`;
  for (const sub of SUB_VARIANTS) {

    // Tiers 4–7
    for (let tier = 4; tier <= 7; tier++) {
      for (const choice of CHOICES) {
        const id = `${cls}-${sub}-t${tier}-${choice}`;
        SKILL_TREE.set(id, {
          id,
          name: `[T${tier}] Option ${choice.toUpperCase()}`,
          description: '[Placeholder] To be designed.',
          cost: 1,
          tier,
          classId,
          subVariantId: sub,
          parent: null,
          children: [],
          statEffects: {},
          mechanicEffects: {},
        });
      }
    }
  }
}
