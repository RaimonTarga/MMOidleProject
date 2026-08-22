// ─── Skill tree types ─────────────────────────────────────────────────────────

import type { MechanicEffects } from '../../passives';

/** The three sub-variants available within every class. */
export type SubVariant = 'light' | 'balanced' | 'heavy';

/**
 * Stat deltas applied immediately and permanently when a node is unlocked.
 *
 * Two kinds of field live here and they are NOT interchangeable:
 *
 *   FLAT (`attack`, `plating`, `maxHp`, `speed`, `recovery`, `attackRange`)
 *     add raw magnitude. Gear scales, so a flat grant is diluted as the
 *     character progresses: `+14 attack` is the whole build at T1 and a
 *     rounding error at T5. Reserve these for positional rules (`attackRange`)
 *     and for systems outside the class tree.
 *
 *   AFFINITY (`*Pct`) contribute PERCENTAGE POINTS into a shared bucket per
 *     stat. Every contribution from every source is summed, then the total is
 *     applied ONCE to the post-equipment stat. They never compound tier by
 *     tier: root +30% / frame +22% / range +10% max HP is `raw × 1.62`, NOT
 *     `raw × 1.30 × 1.22 × 1.10`. This is what makes class identity survive
 *     gear scaling — see `applyClassAffinities` in systems/stats.ts.
 *
 * `damageReduction` and `evasion` are already fractions by construction, so
 * gear never dilutes them and they need no percentage twin.
 */
export interface StatEffects {
  attack?: number;
  plating?: number;
  /** Additive percentage reduction (0.0–1.0). e.g. 0.05 = 5% reduction per node. */
  damageReduction?: number;
  /** Evasion hit threshold. Set via skill nodes; lower is more frequent. */
  evasion?: number;
  attackRange?: number;
  /**
   * Percentage attack speed modifier. Positive = faster (shorter cooldown), negative = slower.
   * All unlocked nodes are summed additively, then applied as:
   * finalCooldown = weaponBaseCooldown / (1 + totalAttackSpeedPct).
   *
   * This is the attack-speed member of the affinity family — it already had the
   * sum-then-apply-once semantics the `*Pct` fields below share.
   */
  attackSpeedPct?: number;
  maxHp?: number;
  recovery?: number;
  speed?: number;

  // ── Class affinities: summed across all sources, applied once ─────────────
  /** e.g. 0.18 → +18% attack, applied to base + equipment. */
  attackPct?: number;
  /** e.g. 0.30 → +30% max HP, applied to base + equipment. */
  maxHpPct?: number;
  /** e.g. 0.30 → +30% plating gained, applied to base + equipment. */
  platingPct?: number;
  /** e.g. -0.10 → −10% move speed, applied to base + equipment. */
  moveSpeedPct?: number;
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
   * null only for tier-0 roots (they ARE the class root).
   */
  classId: string | null;
  /**
   * Which sub-variant this node targets.
   * null for tier-0 class roots and tier-2 range nodes.
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
   *
   * Keys are typed via the PassiveKey union derived from per-namespace `*_KEYS`
   * arrays in shared/src/passives.ts.
   */
  mechanicEffects?: MechanicEffects;
}
