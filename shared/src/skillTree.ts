// ─── Skill tree types ─────────────────────────────────────────────────────────

/** Stat deltas applied immediately and permanently when a node is unlocked. */
export interface StatEffects {
  attack?: number;
  defense?: number;
  attackRange?: number;
  /** Negative value reduces cooldown (faster attacks). Clamped on apply to ≥200ms. */
  attackCooldown?: number;
  maxHp?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  /**
   * Progression tier. 0 = class root (choose your class), 1–N = progression layers.
   * Unlock rules use ONLY this field — parent/children are cosmetic.
   */
  tier: number;
  /**
   * Which class this node belongs to. Equals the class root's id.
   * Used for class-lock validation without any tree traversal.
   */
  classId: string;
  /** Cosmetic only — not used for unlock logic. */
  parent: string | null;
  /** Cosmetic only — not used for unlock logic. */
  children: string[];
  statEffects: StatEffects;
}

// ─── Tree data ────────────────────────────────────────────────────────────────
//
// Five class roots — tier 0 only for now. Branching tiers added later.
// Each root costs 1 skill point (earned on first kill).

export const SKILL_TREE: Map<string, SkillNode> = new Map([

  // ── Cadence ────────────────────────────────────────────────────────────────
  // Mechanic: every N hits, the triggering hit deals bonus damage.

  ['cadence-root', {
    id: 'cadence-root', name: 'Cadence', tier: 0, classId: 'cadence-root',
    parent: null, children: [],
    description: 'Find the rhythm of battle. Every few hits, your attack surges with accumulated force.',
    cost: 1, statEffects: { attack: 3 },
  }],

  // ── Cooldown ───────────────────────────────────────────────────────────────
  // Mechanic: a passive timer arms an execution window; next hit deals heavy bonus damage.

  ['cooldown-root', {
    id: 'cooldown-root', name: 'Cooldown', tier: 0, classId: 'cooldown-root',
    parent: null, children: [],
    description: 'Patience is power. Prepare a devastating strike that triggers on a set cycle.',
    cost: 1, statEffects: { attack: 4 },
  }],

  // ── Reload ─────────────────────────────────────────────────────────────────
  // Mechanic: rapid attacks consume ammo; when empty, pause to reload.

  ['reload-root', {
    id: 'reload-root', name: 'Reload', tier: 0, classId: 'reload-root',
    parent: null, children: [],
    description: 'Unleash a rapid clip of attacks, then reload. High burst with a built-in pause.',
    cost: 1, statEffects: { attackCooldown: -800 },
  }],

  // ── Energy ─────────────────────────────────────────────────────────────────
  // Mechanic: each hit generates energy; full energy arms an empowered attack.

  ['energy-root', {
    id: 'energy-root', name: 'Energy', tier: 0, classId: 'energy-root',
    parent: null, children: [],
    description: 'Channel the force of each blow into a building surge of power.',
    cost: 1, statEffects: { attack: 2 },
  }],

  // ── Damage over Time ───────────────────────────────────────────────────────
  // Mechanic: attacks apply stacking DoT that ticks damage every second.

  ['dot-root', {
    id: 'dot-root', name: 'DoT', tier: 0, classId: 'dot-root',
    parent: null, children: [],
    description: 'Your strikes leave lingering wounds. Stack the pain until nothing survives.',
    cost: 1, statEffects: { attack: 2 },
  }],

]);
