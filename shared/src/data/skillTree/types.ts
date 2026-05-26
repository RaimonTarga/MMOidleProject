// ─── Skill tree types ─────────────────────────────────────────────────────────

import type { MechanicEffects } from '../../passives';

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
  /**
   * Percentage attack speed modifier. Positive = faster (shorter cooldown), negative = slower.
   * All unlocked nodes are summed additively, then applied as:
   * finalCooldown = weaponBaseCooldown / (1 + totalAttackSpeedPct).
   */
  attackSpeedPct?: number;
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
   *
   * Keys are typed via the PassiveKey union derived from per-namespace `*_KEYS`
   * arrays in shared/src/passives.ts.
   */
  mechanicEffects?: MechanicEffects;
}
