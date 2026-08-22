// ─── Essence types ────────────────────────────────────────────────────────────

export type EssenceType = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export const ESSENCE_TYPES: readonly EssenceType[] = ['red', 'blue', 'green', 'yellow', 'purple'] as const;

export const ESSENCE_COLORS: Record<EssenceType, string> = {
  red:    '#ff5544',
  blue:   '#4488ff',
  green:  '#44dd88',
  yellow: '#ffdd44',
  purple: '#bb55ff',
};

/**
 * Player-facing aspect names for each essence. The internal keys stay as colors
 * (persistence + protocol + recipe authoring all key on the color), but every
 * UI surface and player-facing message renders the aspect name instead.
 *   Might ← yellow · Wild ← green · Rot ← purple · Stone ← blue · Deep ← red
 */
export const ESSENCE_LABELS: Record<EssenceType, string> = {
  yellow: 'Might',
  green:  'Wild',
  purple: 'Rot',
  blue:   'Stone',
  red:    'Deep',
};

/** Aspect name for an essence key (player-facing). */
export function essenceLabel(type: EssenceType): string {
  return ESSENCE_LABELS[type];
}

/** Primary essence produced by each biome — used by recipes for their main cost. */
export const BIOME_PRIMARY_ESSENCE: Record<string, EssenceType> = {
  clearing: 'green',
  forest:   'green',
  mountain: 'blue',
  plains:   'yellow',
  swamp:    'purple',
  cave:     'red',
  jungle:   'green',
  tundra:   'blue',
  desert:   'yellow',
  volcanic: 'red',
};

import type { MechanicEffects } from './passives';

// ─── Equipment slots ──────────────────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'armor' | 'recovery' | 'mobility' | 'core' | 'relic';

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon', 'armor', 'recovery', 'mobility', 'core', 'relic',
];

/** Null in a slot means nothing is equipped there. */
export type EquipmentMap = Record<EquipmentSlot, string | null>;

export function emptyEquipment(): EquipmentMap {
  return { weapon: null, armor: null, recovery: null, mobility: null, core: null, relic: null };
}

/** Hydration-safe normalization for saves written before newer slots existed. */
export function normalizeEquipment(
  stored: Partial<Record<EquipmentSlot, string | null>> | undefined,
): EquipmentMap {
  return { ...emptyEquipment(), ...(stored ?? {}) };
}

// ─── Cores (system rework Step 9) ───────────────────────────────────────────────

/**
 * Eligibility category for a core (the 5th equipment slot's build amplifier).
 *   melee        — CLOSE range builds only. Compensates for the structural cost of
 *                  staying in contact range, so it may combine offence, bulk and
 *                  threat control more aggressively. Dedicated tanking lives here.
 *   ranged       — MID and FAR builds. "Ranged" means non-melee positional combat,
 *                  not maximum distance: mid and far share one pool and differ by
 *                  how well their class exploits it.
 *   unrestricted — every build. Lower raw-stat ceiling than a restricted core, but
 *                  may still be build-defining through synergy.
 *
 * Eligibility is BINARY: an eligible core applies its full effect, an ineligible one
 * applies nothing at all — no half-strength off-category scaling. That keeps tooltips,
 * simulation and build comparison honest.
 *
 * See systems/cores.ts `coreIsActive` (the single authority) and
 * `design_docs/CORE_DESIGN_PHILOSOPHY.md` §3–4.
 */
export type CoreEligibility = 'melee' | 'ranged' | 'unrestricted';

// ─── Item stat modifiers ──────────────────────────────────────────────────────

/** Typed stat keys that items can modify. Mirrors relevant player view fields. */
export interface ItemStats {
  attack?: number;
  onHitDamage?: number;
  plating?: number;
  /** Percentage reduction added (0.0–1.0 range; items should use small values like 0.05). */
  damageReduction?: number;
  /** Hit threshold for evasion. Lower = more frequent dodge. */
  evasion?: number;
  maxHp?: number;
  recovery?: number;
  speed?: number;
  attackRange?: number;
  attackCooldown?: number;
}

// ─── Per-item upgrade steps ───────────────────────────────────────────────────

/**
 * One incremental upgrade level authored alongside the recipe.
 * Index 0 = +1, index 1 = +2, etc.
 * `stats` and `mechanicEffects` are additive deltas on top of base item values.
 */
export interface UpgradeStep {
  stats?: Partial<ItemStats>;
  mechanicEffects?: Record<string, number>;
  /**
   * Weapons only. ADDITIVE delta on the weapon's base `attacksPerSecond`, so a
   * lineage can spend part of its upgrade budget on cadence instead of Attack
   * (the Forest rapier's identity: +0.02 APS per level rather than more damage).
   * Summed across steps like every other delta, then applied once in the stat
   * rebuild BEFORE `attackSpeedPct` — an upgraded weapon behaves exactly as if
   * its base APS had been authored higher.
   */
  attacksPerSecond?: number;
  cost: Partial<Record<EssenceType, number>>;
  /**
   * Optional biome-catalyst cost for this step, keyed by biome group (e.g.
   * `{ forest: 2 }`). Parallel axis to `cost`; both are spent on upgrade.
   */
  catalystCost?: Partial<Record<string, number>>;
  requiredBiomeLevel: number;
}

// ─── Item definition ──────────────────────────────────────────────────────────

/**
 * A static item template shared by all instances of that item.
 * statModifiers keys map directly to player stat field names:
 *   attack | plating | damageReduction | evasion | attackRange | attackCooldown | maxHp | recovery | speed
 */
export interface ItemDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: number;
  /** Biome group this item belongs to (from its recipe). Gates upgrading + sets
   *  the essence type spent. Absent on legacy starter items → not upgradeable. */
  biomeGroup?: string;
  statModifiers: Record<string, number>;
  /**
   * Named mechanic modifiers accumulated into player.passives during stat rebuild,
   * exactly like skill node mechanicEffects. Use for defensive / recovery stats that
   * don't map to a direct player view field:
   *   defense.max-hit-pct          — clamp single hit to X% of maxHp
   *   defense.hit-to-dot-pct       — redirect X% of hit damage to 4s debt
   *   defense.dot-resistance        — mitigate incoming DoT damage by X (0–1)
   *   defense.debuff-resistance     — reduce non-DoT debuff magnitude by X (0–1)
   *   ── Recovery access. These do NOT heal a % of maxHp; each switches on a
   *   fraction of the player's Recovery RATE (1 Recovery = 1% maxHp/sec at 100%).
   *   Fractions from different sources ADD; see defense/regen/recovery.ts.
   *   defense.recovery-active-pct  — fraction of Recovery kept active while in combat
   *   defense.recovery-pulse-pct      — fraction of Recovery switched on per pulse (needs interval)
   *   defense.recovery-pulse-interval-ms — ms between Recovery pulses
   *   defense.recovery-pulse-duration-ms — how long each pulse stays active
   *   defense.recovery-on-kill-pct — fraction of Recovery switched on by a kill (refreshes)
   *   defense.recovery-on-kill-ms  — how long the on-kill window lasts
   *   defense.recovery-ramp-start-pct / -max-pct / -ramptime-ms — Recovery access
   *                                  that climbs from start to max over a fight
   *   defense.recovery-skill-potency — scales `recovery`-TAGGED skills only
   *   defense.absorb-pct           — fraction of damage taken converted to HoT pool
   *   defense.barrier-pct          — permanent absorb pool worth % maxHp; refills
   *                                  after BARRIER_DELAY_MS without taking damage
   *   defense.barrier-recharge-pct — fraction of the pool refilled per second (overrides the default)
   *   defense.barrier-delay-ms     — undamaged time before the refill starts (overrides the default)
   *   defense.cleanse-stacks       — stacks removed per cleanse trigger
   *   defense.cleanse-interval-ms  — ms between cleanse triggers
   *
   * Guard-ability amplifiers (system rework Step 8) — only do anything while a
   * Guard ability is equipped; read at fire time in abilities/abilityFiring.ts:
   *   guard.cooldown-reduction-pct — shorten the Guard ability cooldown by this fraction
   *   guard.potency-pct            — scale the Guard effect magnitude (e.g. drPct) by (1 + X)
   *   guard.duration-pct           — extend the Guard buff duration by (1 + X)
   *   guard.recovery-on-fire-pct   — switch on X% of Recovery when the Guard fires
   *   guard.recovery-on-fire-ms    — how long that Recovery window lasts
   */
  mechanicEffects?: MechanicEffects;
  /**
   * Weapons only. Sets the player's base attack cooldown to `round(1000 / aps)` ms
   * when this weapon is equipped. Skills and other equipment still modify the result
   * as additive deltas. Omit on non-weapon items.
   */
  attacksPerSecond?: number;
  description?: string;
  /** Per-item upgrade steps. Length determines the max upgrade level for this item. */
  upgrades?: UpgradeStep[];
  /** Frame name in the /assets/icons.png atlas for the item's inventory icon. */
  icon?: string;
  /** Lineage this item belongs to (system rework Step 6). Mirrors Recipe.lineageId. */
  lineageId?: string;
  /** Predecessor recipe/item id this evolved from. Mirrors Recipe.evolvesFrom. */
  evolvesFrom?: string;
  /**
   * Core slot only. Eligibility category gating the core's effect: melee/ranged apply
   * their stats/mechanicEffects ONLY when the player's selectedRange qualifies;
   * unrestricted always applies. Read by systems/cores.ts `coreIsActive` in the stat
   * rebuild. Mirrors Recipe.coreEligibility.
   */
  coreEligibility?: CoreEligibility;
}

// ─── Mechanic-effect vocabulary ───────────────────────────────────────────────
//
// Re-exported from here rather than added to `shared/src/index.ts` so the label
// registry reaches the client through the same door as ESSENCE_LABELS, its
// closest precedent. See `data/mechanicLabels.ts` for why the vocabulary is
// shared rather than client-local.
export * from './data/mechanicLabels';
