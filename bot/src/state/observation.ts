import {
  BIOME_START_TIER_BY_GROUP,
  NODE_BIOMES,
  RECIPE_DATABASE,
  bossClearKey,
  composeMinionView,
  composeMonsterView,
  composePlayerView,
  getMaxUpgrade,
  ITEM_DATABASE,
  checkUpgrade,
  type DungeonView,
  type EquipmentSlot,
  type EssenceType,
  type MinionView,
  type MonsterView,
  type PlayerView,
  type Recipe,
} from "@mmo-idle/shared";
import type { WorldMirror } from "./reducer";

/**
 * Everything the policy layer is allowed to know, and nothing else.
 *
 * Built purely from {@link WorldMirror} (i.e. from `DeltaSnapshot`) plus the
 * static shared databases the real client also reads to render its crafting,
 * upgrade and map UI. Costs and gates are QUERIED from `RECIPE_DATABASE` /
 * `checkUpgrade` rather than restated in route files.
 */
export class Observation {
  constructor(private readonly mirror: WorldMirror) {}

  get nodeId(): string {
    return this.mirror.nodeId;
  }

  get dungeon(): DungeonView | undefined {
    return this.mirror.dungeon;
  }

  /** Our own player, or null before the first snapshot names us. */
  get self(): PlayerView | null {
    const entity = this.mirror.ownEntity();
    return entity ? composePlayerView(entity) : null;
  }

  /** Our own player; throws when called before the world has admitted us. */
  requireSelf(): PlayerView {
    const self = this.self;
    if (!self) throw new Error("observation: own player not present yet");
    return self;
  }

  monsters(): MonsterView[] {
    const out: MonsterView[] = [];
    for (const [, entity] of this.mirror.entitiesOfKind("monster")) {
      const view = composeMonsterView(entity);
      if (view) out.push(view);
    }
    return out;
  }

  minions(): MinionView[] {
    const out: MinionView[] = [];
    for (const [, entity] of this.mirror.entitiesOfKind("minion")) {
      const view = composeMinionView(entity);
      if (view) out.push(view);
    }
    return out;
  }

  /** Other players sharing our node — the shared-world contention signal. */
  otherPlayers(): PlayerView[] {
    const out: PlayerView[] = [];
    for (const [id, entity] of this.mirror.entitiesOfKind("player")) {
      if (id === this.mirror.ownId) continue;
      const view = composePlayerView(entity);
      if (view) out.push(view);
    }
    return out;
  }

  /** Monsters currently swinging at us — drives concurrency telemetry. */
  attackersOnSelf(): MonsterView[] {
    const ownId = this.mirror.ownId;
    if (!ownId) return [];
    return this.monsters().filter((m) => m.attackTargetId === ownId);
  }

  // ── Progression queries ────────────────────────────────────────────────

  biomeLevel(group: string): number {
    return this.self?.biomeLevel[group] ?? 0;
  }

  essence(type: EssenceType): number {
    return this.self?.essences[type] ?? 0;
  }

  catalyst(family: string): number {
    return this.self?.catalysts[family] ?? 0;
  }

  recipeUnlocked(recipeId: string): boolean {
    return this.self?.unlockedRecipes.includes(recipeId) ?? false;
  }

  bossCleared(biomeGroup: string, tier: number): boolean {
    return this.self?.bossesCleared.includes(bossClearKey(biomeGroup, tier)) ?? false;
  }

  hasItem(definitionId: string): boolean {
    const self = this.self;
    if (!self) return false;
    if (self.inventory.includes(definitionId)) return true;
    return Object.values(self.equipment).some((id) => id === definitionId);
  }

  equippedIn(slot: EquipmentSlot): string | null {
    return this.self?.equipment[slot] ?? null;
  }

  itemPlus(definitionId: string): number {
    return this.self?.itemUpgrades[definitionId] ?? 0;
  }

  // ── Cost / gate queries (shared data, exactly what the client's UI reads) ──

  /** True when the recipe is unlocked AND both wallets cover its cost. */
  canCraft(recipeId: string): boolean {
    const self = this.self;
    const recipe = RECIPE_DATABASE.get(recipeId);
    if (!self || !recipe) return false;
    if (recipe.evolvesFrom) return false;
    if (!self.unlockedRecipes.includes(recipeId)) return false;
    return this.canAfford(recipe);
  }

  canAfford(recipe: Recipe): boolean {
    const self = this.self;
    if (!self) return false;
    for (const [type, amount] of Object.entries(recipe.cost)) {
      if ((self.essences[type as EssenceType] ?? 0) < (amount ?? 0)) return false;
    }
    for (const [family, amount] of Object.entries(recipe.catalystCost ?? {})) {
      if ((self.catalysts[family] ?? 0) < (amount ?? 0)) return false;
    }
    return true;
  }

  /**
   * Whether `definitionId` can be taken one step higher right now. Delegates to
   * the shared `checkUpgrade` the server itself uses, so the bot can never
   * disagree with authority about a gate.
   */
  canUpgrade(definitionId: string): { ok: boolean; reason?: string } {
    const self = this.self;
    const item = ITEM_DATABASE.get(definitionId);
    if (!self || !item) return { ok: false, reason: "Unknown item." };
    if (!item.biomeGroup) return { ok: false, reason: "This item cannot be upgraded." };
    return checkUpgrade({
      item,
      currentPlus: self.itemUpgrades[definitionId] ?? 0,
      biomeLevel: self.biomeLevel[item.biomeGroup] ?? 0,
      essences: self.essences,
      catalysts: self.catalysts,
      globalMastery: self.globalMastery,
    });
  }

  maxUpgradeFor(definitionId: string): number {
    const item = ITEM_DATABASE.get(definitionId);
    return item ? getMaxUpgrade(item) : 0;
  }
}

// ── Static world queries (shared data; the map UI reads the same thing) ─────

/** Normal (non-dungeon) node ids for one biome group at one tier. */
export function normalNodesFor(biomeGroup: string, tier: number): string[] {
  return Object.entries(NODE_BIOMES)
    .filter(
      ([, info]) =>
        info.biomeGroup === biomeGroup &&
        info.biomeTier === tier &&
        info.kind === "normal",
    )
    .map(([id]) => id)
    .sort();
}

/** The dungeon node for one biome group at one tier, when it has one. */
export function dungeonNodeFor(biomeGroup: string, tier: number): string | null {
  const found = Object.entries(NODE_BIOMES).find(
    ([, info]) =>
      info.biomeGroup === biomeGroup &&
      info.biomeTier === tier &&
      info.isDungeon === true,
  );
  return found?.[0] ?? null;
}

export function biomeGroupOf(nodeId: string): string | null {
  return NODE_BIOMES[nodeId]?.biomeGroup ?? null;
}

export function nodeModifierOf(nodeId: string): string | null {
  return NODE_BIOMES[nodeId]?.modifier ?? null;
}

export function biomeStartTier(biomeGroup: string): number {
  return BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
}
