import type { EquipmentSlot, ItemStats, EssenceType, UpgradeStep } from '../../items';
import type { DamageElement } from '../../systems/dotElements';
import type { MechanicEffects } from '../../passives';
import type { ClassArchetype } from '../../classKits/types';
import type { ClassLineDef } from '../../systems/classGear';

/**
 * Reservoir DoT design for a weapon, authored on the recipe so the full effect
 * lives next to the weapon's stats. The combat `BURN_FAMILY` table is derived
 * from these (see systems/weaponFamilies.ts) — this is the single source of truth.
 * On hit, `convPct` of the remaining direct damage (× `dotMultiplier`) is added to
 * a pool that drains over `drainDurationMs`, ticking every `tickIntervalMs`.
 */
export interface WeaponDotProfile {
  /** Unique status-effect id for this weapon's reservoir (one per weapon). */
  effectId: string;
  /** Fraction of remaining direct damage converted into the reservoir (0–1). */
  convPct: number;
  tickIntervalMs: number;
  drainDurationMs: number;
  /** Stored-value multiplier applied to the converted damage. */
  dotMultiplier: number;
  /** DoT element for damage-number flavor (color/glyph) and target tile. */
  element: DamageElement;
  /** Optional per-stack move-speed slow (Edge of Oblivion corruption). */
  slowPerStack?: number;
}

export interface Recipe {
  id: string;
  name: string;
  /** Biome group this recipe belongs to — matches the key in player biomeLevel. */
  recipeGroup: string;
  /**
   * Biome level required in recipeGroup for this recipe to unlock. Biome-local
   * absolute level (spans tier segments of BIOME_LEVELS_PER_TIER each). The level
   * cap is gated by playerTier via biomeLevelCap(), so higher-tier recipes are
   * implicitly gated by the character's progression.
   */
  requiredBiomeLevel: number;
  slot: EquipmentSlot;
  /** Essence costs keyed by type. Only types with non-zero amounts are listed. */
  cost: Partial<Record<EssenceType, number>>;
  stats: Partial<ItemStats>;
  tier: number;
  /**
   * Named mechanic modifiers that flow into player.passives via stat rebuild.
   * Mirrors ItemDefinition.mechanicEffects — see items.ts for the full key list.
   */
  mechanicEffects?: Record<string, number>;
  /**
   * Weapon slots only. Reservoir damage-over-time design for DoT weapons (burn /
   * frost / corruption). Drives the derived `BURN_FAMILY` combat table.
   */
  weaponDot?: WeaponDotProfile;
  /**
   * Weapon slots only. PURELY COSMETIC elemental flavor: tints the wielder's
   * basic-attack animation toward this element. Affects nothing about damage,
   * DoT application, or resistances — a weapon that actually deals elemental
   * damage says so through `weaponDot` / `mechanicEffects`, not through this.
   *
   * Omit on weapons with no elemental theme (plain steel), which then render
   * with their class's own palette. DoT weapons may omit it too: the tint
   * resolver falls back to `weaponDot.element`, so the two can never disagree.
   */
  element?: DamageElement;
  /**
   * Weapon slots only. Sets the player's base attack cooldown to round(1000 / aps) ms.
   * See ItemDefinition.attacksPerSecond for full semantics.
   */
  attacksPerSecond?: number;
  description?: string;
  /**
   * Per-item upgrade steps authored alongside the recipe. See UpgradeStep.
   *
   * NEVER on a weapon. The lineage rework retired the weapon `+N` ladder, and its
   * totals are folded into `stats` instead, so a weapon is at full authored power
   * the moment it is crafted — the curve was authored in `+5` terms and every
   * monster number is calibrated against it. `weaponCurve.test.ts` pins both halves;
   * read its header before touching a weapon's `stats.attack`.
   */
  upgrades?: UpgradeStep[];
  /** Frame name in the /assets/icons.png atlas for the item's inventory icon. */
  icon?: string;
  /**
   * Smart loot (class-first build plan §3.6): the classes this is for. Absent means every
   * class (the shared armor, charm and boots bases). See `systems/classGear.ts`.
   */
  classes?: readonly ClassArchetype[];
  /**
   * A shared base's line per class: mechanic keys merged into the wearer's passives only
   * for that class, on top of `mechanicEffects` (bible §4: shared bases, class lines).
   */
  classLines?: Partial<Record<ClassArchetype, ClassLineDef>>;
  /**
   * If set, recipe unlocks only when this token is present in bossesCleared
   * (any boss-clear key, e.g. `mountain:4`).
   */
  requiredBossClear?: string;
}
