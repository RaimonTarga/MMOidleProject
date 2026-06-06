import type { EquipmentSlot, ItemStats, EssenceType, UpgradeStep } from '../../items';

export interface Recipe {
  id: string;
  name: string;
  /** Biome group this recipe belongs to — matches the key in player biomeLevel. */
  recipeGroup: string;
  /**
   * Biome level required in recipeGroup for this recipe to unlock.
   * The level cap is gated by playerTier via GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER,
   * so higher-tier recipes are implicitly gated by the character's progression.
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
  /** T4 endgame gear — surfaced in Forge Ultimate filter. */
  ultimate?: boolean;
}
