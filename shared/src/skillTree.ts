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

export const SKILL_TREE: Map<string, SkillNode> = new Map([

  // ── Tier 0: Class roots ────────────────────────────────────────────────────

  ['cadence-root', {
    id: 'cadence-root', name: 'Cadence', tier: 0,
    classId: 'cadence-root', subVariantId: null,
    parent: null, children: [],
    description: 'Find the rhythm of battle. Every few hits your attack surges with accumulated force.',
    cost: 1, statEffects: { attack: 3 },
  }],

  ['cooldown-root', {
    id: 'cooldown-root', name: 'Cooldown', tier: 0,
    classId: 'cooldown-root', subVariantId: null,
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike that triggers on a set cycle.',
    cost: 1, statEffects: { attack: 4 },
  }],

  ['reload-root', {
    id: 'reload-root', name: 'Reload', tier: 0,
    classId: 'reload-root', subVariantId: null,
    parent: null, children: [],
    description: 'Unleash a rapid clip of attacks, then reload. High burst with a built-in pause.',
    cost: 1, statEffects: { attackCooldown: -800 },
  }],

  ['energy-root', {
    id: 'energy-root', name: 'Energy', tier: 0,
    classId: 'energy-root', subVariantId: null,
    parent: null, children: [],
    description: 'Channel the force of each blow into a building surge of power.',
    cost: 1, statEffects: { attack: 2 },
  }],

  ['dot-root', {
    id: 'dot-root', name: 'DoT', tier: 0,
    classId: 'dot-root', subVariantId: null,
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives.',
    cost: 1, statEffects: { attack: 2 },
  }],

  // ── Tier 1: Sub-variants ───────────────────────────────────────────────────
  //
  // Three styles available for every class. Immediate stat effects reflect the
  // thematic identity — light trades HP for speed, heavy trades speed for bulk.
  //
  // cadence ──────────────────────────────────────────────────────────────────

  ['cadence-light', {
    id: 'cadence-light', name: 'Light', tier: 1,
    classId: 'cadence-root', subVariantId: 'light',
    parent: 'cadence-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace.',
    cost: 1, statEffects: { attackCooldown: -300, maxHp: -20, speed: 15 },
  }],
  ['cadence-balanced', {
    id: 'cadence-balanced', name: 'Balanced', tier: 1,
    classId: 'cadence-root', subVariantId: 'balanced',
    parent: 'cadence-root', children: [],
    description: 'A measured approach. Modest gains across the board.',
    cost: 1, statEffects: { attack: 3, maxHp: 10 },
  }],
  ['cadence-heavy', {
    id: 'cadence-heavy', name: 'Heavy', tier: 1,
    classId: 'cadence-root', subVariantId: 'heavy',
    parent: 'cadence-root', children: [],
    description: 'Endurance over speed. High survivability at the cost of attack pace.',
    cost: 1, statEffects: { maxHp: 35, plating: 5, attackCooldown: 300, speed: -15 },
  }],

  // cooldown ─────────────────────────────────────────────────────────────────

  ['cooldown-light', {
    id: 'cooldown-light', name: 'Light', tier: 1,
    classId: 'cooldown-root', subVariantId: 'light',
    parent: 'cooldown-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace.',
    cost: 1, statEffects: { attackCooldown: -300, maxHp: -20, speed: 15 },
  }],
  ['cooldown-balanced', {
    id: 'cooldown-balanced', name: 'Balanced', tier: 1,
    classId: 'cooldown-root', subVariantId: 'balanced',
    parent: 'cooldown-root', children: [],
    description: 'A measured approach. Modest gains across the board.',
    cost: 1, statEffects: { attack: 3, maxHp: 10 },
  }],
  ['cooldown-heavy', {
    id: 'cooldown-heavy', name: 'Heavy', tier: 1,
    classId: 'cooldown-root', subVariantId: 'heavy',
    parent: 'cooldown-root', children: [],
    description: 'Endurance over speed. High survivability at the cost of attack pace.',
    cost: 1, statEffects: { maxHp: 35, plating: 5, attackCooldown: 300, speed: -15 },
  }],

  // reload ───────────────────────────────────────────────────────────────────

  ['reload-light', {
    id: 'reload-light', name: 'Light', tier: 1,
    classId: 'reload-root', subVariantId: 'light',
    parent: 'reload-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace.',
    cost: 1, statEffects: { attackCooldown: -300, maxHp: -20, speed: 15 },
  }],
  ['reload-balanced', {
    id: 'reload-balanced', name: 'Balanced', tier: 1,
    classId: 'reload-root', subVariantId: 'balanced',
    parent: 'reload-root', children: [],
    description: 'A measured approach. Modest gains across the board.',
    cost: 1, statEffects: { attack: 3, maxHp: 10 },
  }],
  ['reload-heavy', {
    id: 'reload-heavy', name: 'Heavy', tier: 1,
    classId: 'reload-root', subVariantId: 'heavy',
    parent: 'reload-root', children: [],
    description: 'Endurance over speed. High survivability at the cost of attack pace.',
    cost: 1, statEffects: { maxHp: 35, plating: 5, attackCooldown: 300, speed: -15 },
  }],

  // energy ───────────────────────────────────────────────────────────────────

  ['energy-light', {
    id: 'energy-light', name: 'Light', tier: 1,
    classId: 'energy-root', subVariantId: 'light',
    parent: 'energy-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace.',
    cost: 1, statEffects: { attackCooldown: -300, maxHp: -20, speed: 15 },
  }],
  ['energy-balanced', {
    id: 'energy-balanced', name: 'Balanced', tier: 1,
    classId: 'energy-root', subVariantId: 'balanced',
    parent: 'energy-root', children: [],
    description: 'A measured approach. Modest gains across the board.',
    cost: 1, statEffects: { attack: 3, maxHp: 10 },
  }],
  ['energy-heavy', {
    id: 'energy-heavy', name: 'Heavy', tier: 1,
    classId: 'energy-root', subVariantId: 'heavy',
    parent: 'energy-root', children: [],
    description: 'Endurance over speed. High survivability at the cost of attack pace.',
    cost: 1, statEffects: { maxHp: 35, plating: 5, attackCooldown: 300, speed: -15 },
  }],

  // dot ──────────────────────────────────────────────────────────────────────

  ['dot-light', {
    id: 'dot-light', name: 'Light', tier: 1,
    classId: 'dot-root', subVariantId: 'light',
    parent: 'dot-root', children: [],
    description: 'Swift and agile. Sacrifices resilience for speed and attack pace.',
    cost: 1, statEffects: { attackCooldown: -300, maxHp: -20, speed: 15 },
  }],
  ['dot-balanced', {
    id: 'dot-balanced', name: 'Balanced', tier: 1,
    classId: 'dot-root', subVariantId: 'balanced',
    parent: 'dot-root', children: [],
    description: 'A measured approach. Modest gains across the board.',
    cost: 1, statEffects: { attack: 3, maxHp: 10 },
  }],
  ['dot-heavy', {
    id: 'dot-heavy', name: 'Heavy', tier: 1,
    classId: 'dot-root', subVariantId: 'heavy',
    parent: 'dot-root', children: [],
    description: 'Endurance over speed. High survivability at the cost of attack pace.',
    cost: 1, statEffects: { maxHp: 35, plating: 5, attackCooldown: 300, speed: -15 },
  }],

  // ── Tier 2: Universal range nodes ─────────────────────────────────────────
  //
  // Identical choices offered to ALL classes and sub-variants.
  // Also adjusts related stats to reflect the combat style shift.

  ['range-close', {
    id: 'range-close', name: 'Close', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'Fight at point-blank range. Reduced reach is offset by higher damage and faster attacks.',
    cost: 1, statEffects: { attackRange: -20, attack: 4, attackCooldown: -150 },
  }],

  ['range-mid', {
    id: 'range-mid', name: 'Mid', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'The standard fighting distance. No stat tradeoffs — a neutral baseline.',
    cost: 1, statEffects: {},
  }],

  ['range-far', {
    id: 'range-far', name: 'Far', tier: 2,
    classId: null, subVariantId: null,
    parent: null, children: [],
    description: 'Strike from a safe distance. Greater reach at the cost of raw damage and speed.',
    cost: 1, statEffects: { attackRange: 60, attack: -3, attackCooldown: 200 },
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

]);

// ── Generated placeholder nodes ────────────────────────────────────────────────
//
// Tier 3: remaining 9 paths (cadence is fully hand-authored above; skip it here).
// Tiers 4–7: all 15 paths × 3 choices per tier = 180 nodes.
// IDs: {class}-{subVariant}-t{tier}-{a|b|c}
//
// Tiers 8–9 are reserved for expansion — add nodes here when ready.

const CLASSES = ['cadence', 'cooldown', 'reload', 'energy', 'dot'] as const;
const SUB_VARIANTS: SubVariant[] = ['light', 'balanced', 'heavy'];
const CHOICES = ['a', 'b', 'c'] as const;

for (const cls of CLASSES) {
  const classId = `${cls}-root`;
  for (const sub of SUB_VARIANTS) {
    // Tier 3 placeholders — skip cadence (all three sub-variants hand-authored above)
    if (cls !== 'cadence') {
      for (const choice of CHOICES) {
        const id = `${cls}-${sub}-t3-${choice}`;
        SKILL_TREE.set(id, {
          id,
          name: `[Path] Option ${choice.toUpperCase()}`,
          description: '[Placeholder] To be designed.',
          cost: 1,
          tier: 3,
          classId,
          subVariantId: sub,
          parent: null,
          children: [],
          statEffects: {},
          mechanicEffects: {},
        });
      }
    }

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
