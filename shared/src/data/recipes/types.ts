import type { EquipmentSlot, ItemStats, EssenceType, UpgradeStep, CoreRange } from '../../items';
import type { DamageElement } from '../../systems/dotElements';

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
  /**
   * Optional biome-catalyst costs keyed by biome group (e.g. `{ forest: 3 }`).
   * Parallel axis to `cost` — crafting checks and spends both. Only listed when
   * the recipe demands catalysts; absent means essence-only. Keyed by combat
   * FAMILY (alacrity/brutality/blight/volatility/predation) after the Map Variety
   * Stage A re-key, not by biome group.
   *
   * TODO (Map Variety, deferred): the neutral Broadsword exception (design §2.3)
   * needs a `catalystCostFlexible?: number` — a total payable with any combination
   * of the five family wallets (greedy spend from the largest balance). No recipe
   * uses it yet; wire it into crafting/upgrade affordability + the client cost
   * display when a Broadsword milestone first needs it.
   */
  catalystCost?: Partial<Record<string, number>>;
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
   * Weapon slots only. Sets the player's base attack cooldown to round(1000 / aps) ms.
   * See ItemDefinition.attacksPerSecond for full semantics.
   */
  attacksPerSecond?: number;
  description?: string;
  /** Per-item upgrade steps authored alongside the recipe. See UpgradeStep. */
  upgrades?: UpgradeStep[];
  /** Frame name in the /assets/icons.png atlas for the item's inventory icon. */
  icon?: string;
  /**
   * If set, recipe unlocks only when this token is present in bossesCleared
   * (e.g. ultimate:void-overlord).
   */
  requiredBossClear?: string;
  // ── Lineage / evolution (system rework Step 6) ──────────────────────────────
  /** Lineage this recipe belongs to (e.g. `"rapier"`). Shared by base + all branches. */
  lineageId?: string;
  /**
   * Predecessor recipe id this evolves from. Present ⇒ this is an EVOLVED recipe:
   * craftable by consuming the predecessor at +{@link EVOLUTION_REQUIRED_PLUS}
   * (paying `cost`/`catalystCost`), or by reconstruction (paying `reconstructCost`).
   * Sibling recipes sharing an `evolvesFrom` are alternate branches.
   */
  evolvesFrom?: string;
  /**
   * Reconstruction (skip-the-chain) essence cost — higher than the evolution `cost`,
   * needs no predecessor. Only meaningful on evolved recipes. Absent ⇒ no reconstruct path.
   */
  reconstructCost?: Partial<Record<EssenceType, number>>;
  /** Reconstruction catalyst cost, parallel to `reconstructCost`. */
  reconstructCatalystCost?: Partial<Record<string, number>>;
  // ── Cores (system rework Step 9) ────────────────────────────────────────────
  /**
   * Core slot only. Range tag gating the core's effect — close/mid/far apply only
   * when the player's selectedRange matches; universal/party always apply. Carried
   * to ItemDefinition.rangeTag and read by systems/cores.ts `coreIsActive`.
   */
  rangeTag?: CoreRange;
}
